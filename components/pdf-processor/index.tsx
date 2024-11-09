'use client';

import { useState, useRef } from 'react';
import { UploadCard } from './upload-card';
import { ProcessingIndicator } from './processing-indicator';
import { ProcessedPDF } from './processed-pdf';
import { CandidateForm } from './candidate-form';
import { CandidatesList } from './candidates-list';
import { FeatureCards } from './feature-cards';
import { processPDF } from '@/lib/pdf-processor';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AnalysisOption } from './analysis-option';

interface ProcessedData {
  id: string;
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
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      setProcessedData({ id: result.id, pages: result.pages });
      toast.success('PDF processed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process PDF');
      console.error('PDF processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveCandidate = () => {
    setShowCandidateForm(false);
    setProcessedData(null);
    setEditingId(null);
    if (candidatesListRef.current) {
      candidatesListRef.current.fetchCandidates();
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowCandidateForm(true);
  };

  const handleAnalysisComplete = async (analysis: any) => {
    setProcessedData(prev => ({
      ...prev!,
      analysis,
    }));

    // Wait for all state updates and database operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then fetch the updated candidates list and show details
    if (candidatesListRef.current) {
      try {
        // First fetch the updated list
        await candidatesListRef.current.fetchCandidates();

        // Then wait a moment for the list to update in the UI
        await new Promise(resolve => setTimeout(resolve, 500));

        // Finally show the candidate details
        const candidateId = processedData?.id;
        if (candidateId) {
          await candidatesListRef.current.showCandidateDetails(candidateId);

          // Reset the processed data and form state
          setProcessedData(null);
          setShowCandidateForm(false);
        }
      } catch (error) {
        console.error('Error updating candidates list:', error);
        toast.error('שגיאה בטעינת פרטי המועמד');
      }
    }
  };

  const candidatesListRef = useRef<{ fetchCandidates: () => Promise<void>, showCandidateDetails: (id: string) => Promise<void> }>(null);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">מעבד קורות חיים</h1>
        <p className="text-muted-foreground mt-2">
          העלה קובץ PDF כדי לחלץ טקסט, קישורים וליצור תצוגה מקדימה של העמודים
        </p>
      </div>

      {!processing && !processedData && !showCandidateForm && (
        <UploadCard onDrop={handleDrop} processing={processing} />
      )}

      {processing && (
        <ProcessingIndicator progress={progress} />
      )}

      {processedData && !showCandidateForm && (
        <>
          <ProcessedPDF pages={processedData.pages} />
          <div className="flex flex-col gap-4 mt-6">
            <AnalysisOption
              documentId={processedData.id}
              onAnalysisComplete={handleAnalysisComplete}
            />
            <div className="text-center text-sm text-muted-foreground">
              או
            </div>
            <Button onClick={() => setShowCandidateForm(true)}>
              הזן מידע באופן ידני
            </Button>
          </div>
        </>
      )}

      {showCandidateForm && (
        <CandidateForm
          documentId={editingId || processedData?.id || ''}
          onSave={handleSaveCandidate}
          onCancel={() => {
            setShowCandidateForm(false);
            setEditingId(null);
          }}
        />
      )}

      <CandidatesList
        ref={candidatesListRef}
        onEdit={handleEdit}
      />
    </div>
  );
}