import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/lib/supabase';

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

async function renderPageToCanvas(page: any) {
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blob;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const filename = formData.get('filename') as string;

    if (!file || !filename) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Read PDF file
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text and links
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    
    const pages = [];
    const screenshots = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const annotations = await page.getAnnotations();
      
      const links = annotations
        .filter((annotation: any) => annotation.subtype === 'Link')
        .map((link: any) => ({
          url: link.url,
          rect: link.rect,
        }));

      // Generate and upload screenshot
      const screenshotBlob = await renderPageToCanvas(page);
      const screenshotPath = `screenshots/${filename}-page-${i}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(screenshotPath, screenshotBlob);

      if (uploadError) {
        throw new Error(`Failed to upload screenshot for page ${i}`);
      }

      screenshots.push(screenshotPath);

      pages.push({
        pageNumber: i,
        text: textContent.items.map((item: any) => item.str).join(' '),
        links,
        screenshotPath,
      });
    }

    // Store extracted data in Supabase
    const { data: insertData, error: insertError } = await supabase
      .from('pdf_documents')
      .insert({
        filename,
        pages,
        storage_path: `pdfs/${filename}`,
        screenshots,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store PDF data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documentId: insertData.id,
      pages: insertData.pages,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}