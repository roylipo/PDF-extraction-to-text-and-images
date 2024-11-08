'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { processPDF } from '@/lib/pdf-processor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export function PDFUploader() {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !file.type.includes('pdf')) {
      toast.error('Please upload a valid PDF file');
      return;
    }

    setIsProcessing(true);
    try {
      await processPDF(file);
      toast.success('PDF processed successfully!');
    } catch (error: any) {
      toast.error(`Error processing PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  return (
    <Card
      {...getRootProps()}
      className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">Processing PDF...</p>
          </>
        ) : (
          <>
            {isDragActive ? (
              <>
                <FileText className="h-10 w-10 text-primary" />
                <p className="text-lg font-medium">Drop your PDF here</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium mb-1">
                    Drag and drop your PDF here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to select a file
                  </p>
                </div>
                <Button variant="outline" className="mt-2">
                  Select PDF
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
}