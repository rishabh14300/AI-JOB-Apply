import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function optimizeResume(resumeText: string, jobDescription: string): Promise<object> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume against the job description and provide a detailed JSON response.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "atsScore": <number 0-100>,
  "summary": "<brief overall assessment>",
  "missingKeywords": ["<keyword1>", "<keyword2>"],
  "suggestions": [
    {
      "category": "<category like 'Skills', 'Experience', 'Education', 'Format'>",
      "suggestion": "<specific actionable improvement>"
    }
  ],
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { atsScore: 0, summary: text, missingKeywords: [], suggestions: [], strengths: [], weaknesses: [] };
  }
}

export async function generateCoverLetter(resumeText: string, jobDescription: string, jobTitle: string, company: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert career coach. Write a professional, compelling cover letter based on the following resume and job description.

RESUME:
${resumeText}

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION:
${jobDescription}

Write a cover letter that:
1. Is tailored specifically to this role and company
2. Highlights relevant experience from the resume
3. Shows enthusiasm for the role
4. Is professional but personable
5. Is 3-4 paragraphs long
6. Uses proper business letter format (without addresses - start from the greeting)

Return ONLY the cover letter text, no explanations or metadata.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateInterviewPrep(jobTitle: string, jobDescription: string): Promise<object> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert interview coach. Generate interview preparation material for the following role.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "questions": [
    {
      "question": "<interview question>",
      "category": "<category: 'Behavioral', 'Technical', 'Situational', 'Role-Specific'>",
      "difficulty": "<Easy, Medium, Hard>",
      "sampleAnswer": "<detailed sample answer>",
      "tips": "<tips for answering this type of question>"
    }
  ]
}

Generate exactly 8 questions covering different categories and difficulty levels.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { questions: [] };
  }
}
