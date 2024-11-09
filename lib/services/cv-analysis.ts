import { LLMProvider, CVAnalysis } from '../llm/types';
import { supabase } from '../supabase';

export class CVAnalysisService {
    constructor(private llmProvider: LLMProvider) { }

    async analyzePDF(documentId: string, onProgress?: (partialAnalysis: Partial<CVAnalysis>) => void): Promise<CVAnalysis> {
        try {
            // Set status to analyzing before anything else
            const { error: statusError } = await supabase
                .from('pdf_documents')
                .update({
                    status: 'analyzing',
                    analysis_data: null // Clear any previous analysis data
                })
                .eq('id', documentId);

            if (statusError) throw statusError;

            // Fetch the PDF document data
            const { data: document, error: docError } = await supabase
                .from('pdf_documents')
                .select('pages')
                .eq('id', documentId)
                .single();

            if (docError) throw docError;

            // Extract text and prepare data for analysis
            const fullText = document.pages
                .map((page: any) => page.text)
                .join('\n');
            const pagesJson = JSON.stringify(document.pages);

            // Run all analyses in parallel
            const [basicInfo, experienceInfo, educationInfo, skillsInfo, militaryInfo] = await Promise.all([
                this.llmProvider.analyzeBasicInfo(pagesJson).then(async (info) => {
                    await this.updateDatabase(documentId, info, 'analyzing');
                    onProgress?.({ ...info });
                    return info;
                }),
                this.llmProvider.analyzeExperience(fullText).then(info => {
                    onProgress?.(prev => ({ ...prev, ...info }));
                    return info;
                }),
                this.llmProvider.analyzeEducation(fullText).then(info => {
                    onProgress?.(prev => ({ ...prev, ...info }));
                    return info;
                }),
                this.llmProvider.analyzeSkills(fullText).then(info => {
                    onProgress?.(prev => ({ ...prev, ...info }));
                    return info;
                }),
                this.llmProvider.analyzeMilitary(fullText).then(info => {
                    onProgress?.(prev => ({ ...prev, ...info }));
                    return info;
                })
            ]);

            // Combine all results
            const analysis: CVAnalysis = {
                ...basicInfo,
                ...experienceInfo,
                ...educationInfo,
                ...skillsInfo,
                ...militaryInfo
            };

            // Final update with completed status
            await this.updateDatabase(documentId, analysis, 'analyzed');
            return analysis;
        } catch (error) {
            console.error('CV analysis failed:', error);
            await supabase
                .from('pdf_documents')
                .update({ status: 'error' })
                .eq('id', documentId);
            throw error;
        }
    }

    private async updateDatabase(documentId: string, analysis: Partial<CVAnalysis>, status: 'analyzing' | 'analyzed' | 'error') {
        const { error: updateError } = await supabase
            .from('pdf_documents')
            .update({
                candidate_name: analysis.candidate_name,
                position: analysis.position,
                analysis_data: analysis,
                status: status,
            })
            .eq('id', documentId);

        if (updateError) throw updateError;
    }
} 