import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, CVAnalysis } from './types';

interface PDFLink {
    url: string;
    rect: number[];
}

interface PDFPage {
    text: string;
    links: PDFLink[];
    pageNumber: number;
    screenshotPath: string;
}

export class GeminiProvider implements LLMProvider {
    constructor(private apiKey: string) { }

    name = 'Gemini';

    private cleanJsonString(str: string): string {
        // Remove any markdown code block syntax
        str = str.replace(/```json\s*|\s*```/g, '');

        // Handle escaped characters and normalize quotes
        str = str.replace(/\\([^"\\\/bfnrtu])/g, '$1');
        str = str.replace(/[\u0000-\u001F]+/g, '');
        str = str.replace(/[\u2018\u2019]/g, "'");
        str = str.replace(/[\u201C\u201D]/g, '"');

        return str.trim();
    }

    private async analyze(text: string, prompt: string) {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

        // Parse the text to extract any embedded links
        let linksText = '';

        console.log('Raw input text:', text); // Debug log

        // First try to parse links from JSON structure
        try {
            const jsonData = JSON.parse(text) as PDFPage[];
            console.log('Parsed JSON data:', jsonData); // Debug log

            if (Array.isArray(jsonData)) {
                const allLinks = jsonData.flatMap(page =>
                    (page.links || []).map((link: PDFLink) => link.url)
                );
                console.log('Extracted links:', allLinks); // Debug log

                if (allLinks.length > 0) {
                    linksText = '\n\nEmbedded Links:\n' + allLinks.join('\n');
                }
            }
        } catch (error) {
            console.log('JSON parsing failed:', error); // Debug log

            // If JSON parsing fails, try the existing regex approach
            const linkMatches = text.match(/\{[\s\S]*?"links":\s*\[([\s\S]*?)\]/);
            if (linkMatches && linkMatches[1]) {
                try {
                    const links = JSON.parse(`[${linkMatches[1]}]`) as PDFLink[];
                    console.log('Regex extracted links:', links); // Debug log

                    if (links.length > 0) {
                        linksText = '\n\nEmbedded Links:\n' + links
                            .map(link => link.url)
                            .join('\n');
                    }
                } catch (e) {
                    console.warn('Failed to parse links:', e);
                }
            }
        }

        console.log('Final text being sent to Gemini:', prompt + "\n\nCV Text:\n" + text + linksText); // Debug log

        const result = await model.generateContent([
            prompt + "\n\nCV Text:\n" + text + linksText
        ]);
        const response = await result.response;
        const responseText = response.text();

        console.log('Raw response from Gemini:', responseText); // Debug log

        try {
            // Clean and parse the response
            const cleanedText = this.cleanJsonString(responseText);
            console.log('Cleaned response:', cleanedText); // For debugging
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error('Initial parsing failed:', e);
            console.log('Raw response:', responseText);

            try {
                // Try to extract JSON from markdown code blocks
                const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) {
                    const cleanedJson = this.cleanJsonString(jsonMatch[1]);
                    return JSON.parse(cleanedJson);
                }

                // Try to find any JSON-like structure
                const jsonMatch2 = responseText.match(/\{[\s\S]*?\}/);
                if (jsonMatch2) {
                    const cleanedJson = this.cleanJsonString(jsonMatch2[0]);
                    return JSON.parse(cleanedJson);
                }
            } catch (e2) {
                console.error('Fallback parsing failed:', e2);
            }

            throw new Error('Could not parse response as JSON. Raw response: ' + responseText.substring(0, 200));
        }
    }

    async analyzeBasicInfo(text: string) {
        return this.analyze(text,
            `Extract only the following basic information from the CV.
            IMPORTANT: Do not translate any text - keep all extracted information in its original language.
            Return a simple JSON object with these fields only:
            {
                "candidate_name": "full name",
                "position": "position the candidate is applying for. if not mentioned, make it the most relevant position from the experience section", 
                "email": "email address",
                "phone": "phone number in the following format: For Israeli numbers (starting with +972 or 05), convert to 10 digits starting with no special characters (e.g. '+972541234567' or '054-123-4567' becomes '0541234567'). For international numbers, use format '+[country code] [number]' with one space after the prefix (e.g. '+44 1234567890' or '+1 2345678900')",
                "location": "address",
                "social_profiles": {
                    "linkedin": "Only the profile URL path without http/https, e.g. 'linkedin.com/in/username'. If only the word 'LinkedIn' or 'linkedin.com' is found, leave empty",
                    "github": "Only the profile URL path without http/https, e.g. 'github.com/username'. If only the word 'GitHub' or 'github.com' is found, leave empty",
                    "portfolio": "Only the website URL without http/https. If no specific URL is found, leave empty",
                    "twitter": "Only the profile URL path without http/https, e.g. 'twitter.com/username'. If only the word 'Twitter' or 'twitter.com' is found, leave empty",
                    "other": ["Any other professional profile URLs without http/https. Only include if complete profile URLs are found"]
                }
            }
            Important: Return ONLY a valid JSON object with no special characters or formatting.
            Keep all text exactly as it appears in the original CV without any translation.
        For social profiles, extract them from both the text    content and any embedded links.
            For all social profile URLs, remove any http:// or https:// prefix and ensure they are complete profile URLs, not just domain names.`
        );
    }

    async analyzeExperience(text: string) {
        return this.analyze(text,
            `Extract only the work experience information from the CV.
            IMPORTANT: Do not translate any text - keep all extracted information in its original language.
            Return a simple JSON object with this structure:
            {
                "experience": [
                    {
                        "title": "job title",
                        "company": "company name",
                        "duration": "employment period. e.g 2020-2024",
                        "description": "role description"
                    }
                ]
            }
            Important: Return ONLY a valid JSON object with no special characters or formatting.
            Keep all text exactly as it appears in the original CV without any translation.`
        );
    }

    async analyzeEducation(text: string) {
        return this.analyze(text,
            `Extract only the education information from the CV.
            IMPORTANT: Do not translate any text - keep all extracted information in its original language.
            Return a simple JSON object with this structure:
            {
                "education": [
                    {
                        "institution": "school name",
                        "degree": "degree name",
                        "year": "graduation year"
                    }
                ]
            }
            Important: Return ONLY a valid JSON object with no special characters or formatting.
            Keep all text exactly as it appears in the original CV without any translation.`
        );
    }

    async analyzeSkills(text: string) {
        return this.analyze(text,
            `Extract only the most important and relevant skills and languages from the CV.
            Group similar skills together (e.g. combine "React.js", "React Native" into just "React")
            and limit to maximum 10-12 core skills total.
            Focus on technical skills, tools, and technologies that appear most prominent.
            IMPORTANT: Do not translate any text - keep all extracted information in its original language, EXCEPT for languages which should be translated to Hebrew.
            For languages: translate "English" to "אנגלית", "French" to "צרפתית", "Spanish" to "ספרדית", "German" to "גרמנית", "Russian" to "רוסית", "Arabic" to "ערבית", etc.
            Return a simple JSON object with this structure:
            {
                "skills": ["skill1", "skill2"],
                "languages": ["שפה1", "שפה2"]
            }
            Important: Return ONLY a valid JSON object with no special characters or formatting.
            Keep all text exactly as it appears in the original CV without any translation, except for languages which must be in Hebrew.`
        );
    }

    async analyzeMilitary(text: string) {
        return this.analyze(text,
            `Extract only military service information from the CV.
            IMPORTANT: Do not translate any text - keep all extracted information in its original language.
            Return a simple JSON object with this structure:
            {
                "military_service": {
                    "role": "military role",
                    "unit": "unit name",
                    "years": "service period"
                }
            }
            Important: Return ONLY a valid JSON object with no special characters or formatting.
            Keep all text exactly as it appears in the original CV without any translation.`
        );
    }
} 