import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProcessedPDFProps {
  pages: Array<{
    pageNumber: number;
    text: string;
    links: Array<{ url: string; rect: number[] }>;
    screenshotPath: string;
    error?: string;
  }>;
}

interface PageImageProps {
  path: string;
  pageNumber: number;
}

function PageImage({ path, pageNumber }: PageImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Get the public URL with cache busting
  const imageUrl = `${supabase.storage
    .from('pdfs')
    .getPublicUrl(path)
    .data.publicUrl}?v=${Date.now()}`;

  const handleError = () => {
    if (retryCount < maxRetries) {
      // Wait a bit before retrying
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setError(false);
      }, 1000);
    } else {
      setIsLoading(false);
      setError(true);
    }
  };

  return (
    <div className="relative bg-muted rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          {retryCount > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              Retry {retryCount}/{maxRetries}...
            </span>
          )}
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-sm">Failed to load image</span>
        </div>
      )}

      <img
        key={`${path}-${retryCount}`} // Force reload on retry
        src={imageUrl}
        alt={`Page ${pageNumber}`}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoading || error ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => {
          setIsLoading(false);
          setError(false);
        }}
        onError={handleError}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

export function ProcessedPDF({ pages }: ProcessedPDFProps) {
  return (
    <Card className="p-6">
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-8">
          {pages.map((page, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold">
                Page {page.pageNumber}
              </h3>
              
              {page.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {page.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {page.screenshotPath && (
                    <PageImage 
                      path={page.screenshotPath} 
                      pageNumber={page.pageNumber} 
                    />
                  )}

                  {page.text && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Extracted Text</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {page.text}
                      </p>
                    </div>
                  )}

                  {page.links && page.links.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Links Found</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {page.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {link.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {index < pages.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}