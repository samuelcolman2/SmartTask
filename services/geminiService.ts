
import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const breakDownTask = async (taskText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise esta tarefa: "${taskText}". Como especialista em produtividade, sugira uma prioridade (LOW, MEDIUM, HIGH) e divida-a em até 5 sub-passos claros. Além disso, dê uma frase curta de motivação em português.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
            prioritySuggestion: { 
                type: Type.STRING, 
                enum: ["LOW", "MEDIUM", "HIGH"] 
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["motivation", "prioritySuggestion", "steps"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
