'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { FileUp } from 'lucide-react';

interface UploadCardProps {
  onDrop: (files: File[]) => void;
  processing: boolean;
}

export function UploadCard({ onDrop, processing }: UploadCardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    disabled: processing,
    multiple: false,
  });

  return (
    <Card
      {...getRootProps()}
      className={`
        p-8 border-2 border-dashed rounded-lg cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
        ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <FileUp className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select a file
          </p>
        </div>
      </div>
    </Card>
  );
}