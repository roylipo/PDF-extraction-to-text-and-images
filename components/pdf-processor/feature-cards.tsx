import { FileText, Image } from 'lucide-react';

export function FeatureCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="p-6 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="font-semibold">חילוץ טקסט</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          מחלץ טקסט וקישורים מקובץ ה-PDF שלך
        </p>
      </div>

      <div className="p-6 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          <h3 className="font-semibold">צילומי מסך של עמודים</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          יוצר צילומי מסך של כל עמוד
        </p>
      </div>
    </div>
  );
}