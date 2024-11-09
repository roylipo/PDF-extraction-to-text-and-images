'use client';

import { forwardRef, useEffect, useState, useImperativeHandle } from 'react';
import { format } from 'date-fns';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CandidateDetailsSheet } from './candidate-details-sheet';

interface Candidate {
    id: string;
    created_at: string;
    candidate_name: string;
    position: string;
    filename: string;
    notes?: string;
    pages?: Array<{
        pageNumber: number;
        text: string;
        screenshotPath: string;
    }>;
}

interface CandidatesListProps {
    onEdit: (id: string) => void;
}

export const CandidatesList = forwardRef<
    {
        fetchCandidates: () => Promise<void>;
        showCandidateDetails: (id: string) => void;
    },
    CandidatesListProps
>(({ onEdit }, ref) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    const fetchCandidates = async () => {
        try {
            const { data, error } = await supabase
                .from('pdf_documents')
                .select('*, analysis_data')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidates(data || []);
        } catch (error) {
            toast.error('Failed to fetch candidates');
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const showCandidateDetails = (id: string) => {
        const candidate = candidates.find(c => c.id === id);
        if (candidate) {
            setSelectedCandidate(candidate);
        }
    };

    useImperativeHandle(ref, () => ({
        fetchCandidates,
        showCandidateDetails
    }));

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this candidate?')) return;

        try {
            const { error } = await supabase
                .from('pdf_documents')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Candidate deleted successfully');
            fetchCandidates();
        } catch (error) {
            toast.error('Failed to delete candidate');
            console.error('Error deleting candidate:', error);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>מועמדים</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">תאריך</TableHead>
                                <TableHead className="text-right">שם</TableHead>
                                <TableHead className="text-right">תפקיד</TableHead>
                                <TableHead className="text-right">קובץ</TableHead>
                                <TableHead className="text-right">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {candidates.map((candidate) => (
                                <TableRow
                                    key={candidate.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedCandidate(candidate)}
                                >
                                    <TableCell>
                                        {format(new Date(candidate.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>{candidate.candidate_name || '-'}</TableCell>
                                    <TableCell>{candidate.position || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            {candidate.filename}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(candidate.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedCandidate && (
                <CandidateDetailsSheet
                    isOpen={!!selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    candidate={selectedCandidate}
                    onSave={() => {
                        fetchCandidates();
                        setSelectedCandidate(null);
                    }}
                />
            )}
        </>
    );
});

CandidatesList.displayName = 'CandidatesList';