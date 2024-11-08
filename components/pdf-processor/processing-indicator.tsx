import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProcessingIndicatorProps {
  progress: number;
}

export function ProcessingIndicator({ progress }: ProcessingIndicatorProps) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="w-full max-w-xs space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            Processing PDF... {progress}%
          </p>
        </div>
      </div>
    </Card>
  );
}