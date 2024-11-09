import { getDocument, version, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { getWorker } from './pdf-worker';
import { supabase } from './supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractPageContent(page: PDFPageProxy) {
  try {
    const textContent = await page.getTextContent();
    return textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .trim();
  } catch (error) {
    console.error('Error extracting text content:', error);
    return '';
  }
}

async function extractLinks(page: PDFPageProxy) {
  try {
    const annotations = await page.getAnnotations();
    return annotations
      .filter((annotation: any) =>
        annotation.subtype === 'Link' &&
        annotation.url &&
        annotation.url.trim() !== ''
      )
      .map((link: any) => ({
        url: link.url,
        rect: link.rect,
      }));
  } catch (error) {
    console.error('Error extracting links:', error);
    return [];
  }
}

async function generateScreenshot(page: PDFPageProxy, scale = 1.5) {
  const viewport = page.getViewport({ scale });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context creation failed');
  }

  try {
    await page.render({
      canvasContext: context,
      viewport,
      intent: 'print',
    }).promise;

    return await canvas.convertToBlob({
      type: 'image/png',
      quality: 0.95,
    });
  } catch (error) {
    console.error('Error generating screenshot:', error);
    throw error;
  }
}

async function uploadWithRetry(
  bucket: string,
  path: string,
  file: Blob | File,
  retries = MAX_RETRIES
): Promise<string> {
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Changed to true to allow overwriting
      });

    if (uploadError) {
      throw uploadError;
    }

    // Verify the file exists and is accessible
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return path;
  } catch (error: any) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return uploadWithRetry(bucket, path, file, retries - 1);
    }
    throw error;
  }
}

export async function processPDF(file: File) {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload original PDF
    const pdfPath = `documents/${fileName}`;
    await uploadWithRetry('pdfs', pdfPath, file);

    // Process PDF
    const arrayBuffer = await file.arrayBuffer();
    const worker = getWorker();

    if (!worker) {
      throw new Error('PDF worker not initialized');
    }

    const loadingTask = getDocument({
      data: arrayBuffer,
      worker,
      useSystemFonts: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${version}/standard_fonts/`,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pages = [];
    const screenshots = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);

        // Extract content in parallel
        const [text, links, screenshotBlob] = await Promise.all([
          extractPageContent(page),
          extractLinks(page),
          generateScreenshot(page),
        ]);

        const screenshotPath = `screenshots/${timestamp}-page-${pageNum}.png`;
        await uploadWithRetry('pdfs', screenshotPath, screenshotBlob);

        screenshots.push(screenshotPath);
        pages.push({
          pageNumber: pageNum,
          text,
          links,
          screenshotPath,
        });
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        pages.push({
          pageNumber: pageNum,
          text: `Error processing page ${pageNum}`,
          links: [],
          screenshotPath: '',
          error: pageError.message,
        });
      }
    }

    // Save metadata to database
    const { data, error: dbError } = await supabase
      .from('pdf_documents')
      .insert({
        filename: file.name,
        storage_path: pdfPath,
        pages,
        screenshots,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    return { id: data.id, pages };
  } catch (error: any) {
    console.error('PDF processing error:', error);
    throw new Error(
      error.message || 'Failed to process PDF. Please try again with a different file.'
    );
  }
}