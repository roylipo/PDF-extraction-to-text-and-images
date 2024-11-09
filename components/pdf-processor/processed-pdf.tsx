import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ProcessedPDFProps {
  pages: Array<{
    pageNumber: number;
    text: string;
    links: Array<{ url: string; rect: number[] }>;
    screenshotPath: string;
    error?: string;
  }>;
}

export function ProcessedPDF({ pages }: ProcessedPDFProps) {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">טקסט שחולץ</h2>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {pages.map((page) => (
            <div key={page.pageNumber} className="space-y-4">
              <h3 className="font-medium">עמוד {page.pageNumber}</h3>
              {page.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{page.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  {page.screenshotPath && (
                    <div className="mb-4">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${page.screenshotPath}`}
                        alt={`עמוד ${page.pageNumber}`}
                        className="w-full rounded-md border"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{page.text}</p>
                </>
              )}
              <Separator className="my-4" />
            </div>
          ))}
        </ScrollArea>
      </div>
    </Card>
  );
}