import { FileText, Image } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h3 className="font-medium">Text Extraction</h3>
            <p className="text-sm text-gray-500">
              Extracts text and links from your PDF
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <Image className="h-8 w-8 text-primary" />
          <div>
            <h3 className="font-medium">Page Screenshots</h3>
            <p className="text-sm text-gray-500">
              Captures screenshots of each page
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}