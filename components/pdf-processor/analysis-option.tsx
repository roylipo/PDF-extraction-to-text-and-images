'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { GeminiProvider } from '@/lib/llm/gemini';
import { CVAnalysisService } from '@/lib/services/cv-analysis';

interface AnalysisOptionProps {
    documentId: string;
    onAnalysisComplete: (analysis: any) => void;
}

export function AnalysisOption({ documentId, onAnalysisComplete }: AnalysisOptionProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setProgress([progressMessages.starting]);

        try {
            const cvAnalysisService = new CVAnalysisService(
                new GeminiProvider(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
            );

            const analysis = await cvAnalysisService.analyzePDF(documentId, (partialAnalysis) => {
                // Track progress based on which fields are populated
                const newProgress = [progressMessages.starting];

                if (partialAnalysis.candidate_name) {
                    newProgress.push(progressMessages.basic);
                }
                if (partialAnalysis.experience) {
                    newProgress.push(progressMessages.experience);
                }
                if (partialAnalysis.education) {
                    newProgress.push(progressMessages.education);
                }
                if (partialAnalysis.skills || partialAnalysis.languages) {
                    newProgress.push(progressMessages.skills);
                }

                setProgress(newProgress);
            });

            // Ensure final progress state shows all steps completed
            setProgress([
                progressMessages.starting,
                progressMessages.basic,
                progressMessages.experience,
                progressMessages.education,
                progressMessages.skills,
            ]);

            await onAnalysisComplete(analysis);
            toast.success('ניתוח קורות החיים הושלם בהצלחה');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('שגיאה בניתוח קורות החיים');
        } finally {
            setAnalyzing(false);
            setProgress([]);
        }
    };

    const progressMessages = {
        starting: 'מתחיל ניתוח קורות חיים...',
        basic: 'מידע בסיסי חולץ בהצלחה',
        experience: 'ניסיון תעסוקתי חולץ בהצלחה',
        education: 'השכלה חולצה בהצלחה',
        skills: 'כישורים חולצו בהצלחה',
    };

    return (
        <div className="space-y-2">
            <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full"
                variant="outline"
            >
                {analyzing ? (
                    <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        מנתח קורות חיים...
                    </>
                ) : (
                    <>
                        <Sparkles className="ml-2 h-4 w-4" />
                        נתח קורות חיים אוטומטית
                    </>
                )}
            </Button>
            {analyzing && progress.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-1">
                    {progress.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {i === progress.length - 1 ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Check className="h-3 w-3 text-green-500" />
                            )}
                            {p}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 