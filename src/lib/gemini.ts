import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiModel = "gemini-3-flash-preview";

export async function analyzeExamPDF(pdfText: string) {
  const prompt = `
    Analyze the following text extracted from a Cambridge English Exam PDF.
    Extract the questions, options, and correct answers in a structured JSON format.
    The format should match:
    {
      "title": "Exam Title",
      "level": "KET" | "PET" | "FCE",
      "parts": [
        {
          "title": "Part 1",
          "type": "reading" | "writing" | "listening" | "speaking",
          "questions": [
            {
              "text": "Question text",
              "options": ["A", "B", "C"],
              "correctAnswer": "A",
              "type": "multiple-choice"
            }
          ]
        }
      ]
    }

    PDF Text:
    ${pdfText}
  `;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function getSpeakingFeedback(transcript: string, part: string, criteria: string) {
  const prompt = `
    You are a Cambridge English Speaking Examiner.
    Evaluate the following student response for ${part}.
    Criteria: ${criteria}
    
    Student Response: "${transcript}"
    
    Provide feedback in JSON format:
    {
      "score": 1-5,
      "feedback": "Detailed feedback based on Cambridge criteria",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "suggestions": ["..."]
    }
  `;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}
