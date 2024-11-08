'use client';

import { useState } from 'react';
import { UploadCard } from './upload-card';
import { ProcessingIndicator } from './processing-indicator';
import { ProcessedPDF } from './processed-pdf';
import { FeatureCards } from './feature-cards';
import { processPDF } from '@/lib/pdf-processor';
import { toast } from 'sonner';

interface ProcessedData {
  pages: Array<{
    pageNumber: number;
    text: string;
    links: Array<{ url: string; rect: number[] }>;
    screenshotPath: string;
  }>;
}

export function PDFProcessor() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  const handleDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await processPDF(file);
      clearInterval(progressInterval);
      setProgress(100);
      setProcessedData(result);
      toast.success('PDF processed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process PDF');
      console.error('PDF processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <FeatureCards />
      
      {!processing && !processedData && (
        <UploadCard onDrop={handleDrop} processing={processing} />
      )}

      {processing && (
        <ProcessingIndicator progress={progress} />
      )}

      {processedData && (
        <ProcessedPDF pages={processedData.pages} />
      )}
    </div>
  );
}