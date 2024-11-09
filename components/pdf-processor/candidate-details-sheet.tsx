'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, ChevronDown, Pencil, X, Calendar, Briefcase, Mail, Phone, MapPin, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CandidateForm } from './candidate-form';

interface CandidateDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: {
        id: string;
        created_at: string;
        candidate_name: string;
        position: string;
        filename: string;
        notes?: string;
        status?: string;
        pages?: Array<{
            pageNumber: number;
            text: string;
            screenshotPath: string;
        }>;
        analysis_data?: {
            email?: string;
            phone?: string;
            location?: string;
            skills?: string[];
            experience?: Array<{
                title: string;
                company: string;
                duration: string;
                description?: string;
            }>;
            education?: Array<{
                institution: string;
                degree: string;
                year?: string;
            }>;
            languages?: string[];
            social_profiles?: {
                linkedin?: string;
                github?: string;
                portfolio?: string;
                twitter?: string;
                other?: string[];
            };
        };
    };
    onSave: () => void;
}

export function CandidateDetailsSheet({
    isOpen,
    onClose,
    candidate,
    onSave,
}: CandidateDetailsSheetProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    console.log('Candidate data:', candidate);

    const handleSave = () => {
        setIsEditing(false);
        onSave();
    };

    // Get analysis data
    const analysisData = candidate.analysis_data || {};

    // Check if analysis is in progress
    const isAnalyzing = candidate.status === 'analyzing';

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col rtl dialog-content">
                    <DialogHeader className="flex flex-row justify-between items-center">
                        <DialogTitle>{candidate.candidate_name || 'פרטי מועמד'}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    {isEditing ? (
                        <CandidateForm
                            documentId={candidate.id}
                            initialData={candidate}
                            onSave={handleSave}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <Tabs defaultValue="overview" className="flex-1">
                            <TabsList className="flex justify-end space-x-2 space-x-reverse">
                                <TabsTrigger value="cv">קורות חיים</TabsTrigger>
                                <TabsTrigger value="experience">ניסיון</TabsTrigger>
                                <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview">
                                <div className="grid grid-cols-3 gap-6 p-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>הערות</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-right">
                                            <p className="text-sm">{candidate.notes || 'אין הערות'}</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>כישורים</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {isAnalyzing ? (
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>מנתח כישורים...</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {analysisData.skills && analysisData.skills.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2 justify-end">
                                                            {analysisData.skills.map((skill, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-right">לא צוינו כישורים</p>
                                                    )}

                                                    {analysisData.languages && analysisData.languages.length > 0 && (
                                                        <div className="pt-4 border-t">
                                                            <h4 className="font-medium mb-2 text-right">שפות</h4>
                                                            <div className="flex flex-wrap gap-2 justify-end">
                                                                {analysisData.languages.map((language, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                                                                    >
                                                                        {language}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>מידע בסיסי</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <span>נוסף: {format(new Date(candidate.created_at), 'MMM d, yyyy')}</span>
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span>תפקיד: {candidate.position || 'לא צוין'}</span>
                                                <Briefcase className="h-4 w-4" />
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span>קובץ: {candidate.filename}</span>
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            {analysisData.email && (
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span>{analysisData.email}</span>
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                            )}
                                            {analysisData.phone && (
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span>{analysisData.phone}</span>
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                            )}
                                            {analysisData.location && (
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span>{analysisData.location}</span>
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                            )}

                                            {analysisData.social_profiles && (
                                                Object.entries(analysisData.social_profiles).some(([key, value]) =>
                                                    key !== 'other' && value && value.length > 0
                                                ) && (
                                                    <div className="pt-4 border-t">
                                                        <h4 className="font-medium mb-2 text-right">לינקים וסושיאל</h4>
                                                        <div className="space-y-2">
                                                            {analysisData.social_profiles.linkedin && (
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <a
                                                                        href={`https://${analysisData.social_profiles.linkedin}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {analysisData.social_profiles.linkedin}
                                                                    </a>
                                                                    <LinkIcon className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            {analysisData.social_profiles.github && (
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <a
                                                                        href={`https://${analysisData.social_profiles.github}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {analysisData.social_profiles.github}
                                                                    </a>
                                                                    <LinkIcon className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            {analysisData.social_profiles.portfolio && (
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <a
                                                                        href={`https://${analysisData.social_profiles.portfolio}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {analysisData.social_profiles.portfolio}
                                                                    </a>
                                                                    <LinkIcon className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            {analysisData.social_profiles.twitter && (
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <a
                                                                        href={`https://${analysisData.social_profiles.twitter}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {analysisData.social_profiles.twitter}
                                                                    </a>
                                                                    <LinkIcon className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            {analysisData.social_profiles.other?.map((url, index) => (
                                                                <div key={index} className="flex items-center gap-2 justify-end">
                                                                    <a
                                                                        href={`https://${url}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary hover:underline"
                                                                    >
                                                                        {url}
                                                                    </a>
                                                                    <LinkIcon className="h-4 w-4" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="experience" className="h-full overflow-y-auto">
                                <div className="p-6">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            <p>מנתח ניסיון והשכלה...</p>
                                        </div>
                                    ) : (
                                        (!analysisData.experience || analysisData.experience.length === 0) &&
                                            (!analysisData.education || analysisData.education.length === 0) ? (
                                            <div className="text-center text-muted-foreground">
                                                אין מידע על ניסיון או השכלה
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                {analysisData.experience?.map((exp, index) => (
                                                    <div key={index} className="relative pr-8 pb-8 border-r-2 border-border">
                                                        <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-primary" />
                                                        <div className="space-y-2">
                                                            <h3 className="text-lg font-semibold">{exp.title}</h3>
                                                            <div className="text-muted-foreground">
                                                                {exp.company} • {exp.duration}
                                                            </div>
                                                            {exp.description && (
                                                                <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {analysisData.education?.map((edu, index) => (
                                                    <div key={index} className="relative pr-8 pb-8 border-r-2 border-border">
                                                        <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-secondary" />
                                                        <div className="space-y-2">
                                                            <h3 className="text-lg font-semibold">{edu.degree}</h3>
                                                            <div className="text-muted-foreground">
                                                                {edu.institution} {edu.year ? `• ${edu.year}` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="cv" className="h-full">
                                <ScrollArea className="h-full rounded-md border">
                                    {candidate.pages?.map((page) => (
                                        <div key={page.pageNumber} className="p-4">
                                            <h3 className="font-medium mb-4">עמוד {page.pageNumber}</h3>
                                            <div className="flex gap-6">
                                                <div className="w-1/2 flex items-start">
                                                    <div className="relative w-full h-[calc(100vh-300px)] overflow-hidden">
                                                        <img
                                                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${page.screenshotPath}`}
                                                            alt={`עמוד ${page.pageNumber}`}
                                                            className="rounded-md border w-full h-full object-contain bg-white p-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setZoomedImage(page.screenshotPath)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-1/2 max-h-[calc(100vh-300px)] overflow-y-auto">
                                                    <div className="text-sm whitespace-pre-wrap">
                                                        {page.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
                    <div className="relative w-full h-[90vh] bg-black/50">
                        <img
                            src={zoomedImage ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${zoomedImage}` : ''}
                            alt="Zoomed CV page"
                            className="w-full h-full object-contain"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                            onClick={() => setZoomedImage(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
} 