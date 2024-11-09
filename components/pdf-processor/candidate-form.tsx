'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    X as XMarkIcon,
    Link as LinkIcon,
    Calendar as CalendarIcon,
    Briefcase as BriefcaseIcon,
    FileText as DocumentIcon,
    Mail as EnvelopeIcon,
    Phone as PhoneIcon,
    MapPin as MapPinIcon
} from 'lucide-react';

interface CandidateFormProps {
    documentId: string;
    initialData?: {
        candidate_name?: string;
        position?: string;
        notes?: string;
    };
    onSave: () => void;
    onCancel: () => void;
}

export function CandidateForm({ documentId, initialData, onSave, onCancel }: CandidateFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        candidate_name: '',
        position: '',
        notes: '',
    });

    useEffect(() => {
        const fetchCandidateData = async () => {
            if (!documentId) return;

            try {
                const { data, error } = await supabase
                    .from('pdf_documents')
                    .select('candidate_name, position, notes')
                    .eq('id', documentId)
                    .single();

                if (error) throw error;

                if (data) {
                    setFormData({
                        candidate_name: data.candidate_name || '',
                        position: data.position || '',
                        notes: data.notes || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching candidate data:', error);
                toast.error('Failed to load candidate data');
            }
        };

        fetchCandidateData();
    }, [documentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('pdf_documents')
                .update({
                    candidate_name: formData.candidate_name,
                    position: formData.position,
                    notes: formData.notes,
                    status: 'processed'
                })
                .eq('id', documentId);

            if (error) throw error;

            toast.success('Candidate information saved successfully');
            onSave();
        } catch (error: any) {
            console.error('Error saving candidate:', error);
            toast.error('Failed to save candidate information');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-6" dir="rtl">
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="candidate_name">שם המועמד</Label>
                    <Input
                        id="candidate_name"
                        value={formData.candidate_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, candidate_name: e.target.value }))}
                        placeholder="הכנס שם מועמד"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="position">תפקיד</Label>
                    <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="הכנס תפקיד"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">הערות</Label>
                    <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="הוסף הערות"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={onCancel} type="button">
                    ביטול
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    שמור
                </Button>
            </div>
        </form>
    );
} 