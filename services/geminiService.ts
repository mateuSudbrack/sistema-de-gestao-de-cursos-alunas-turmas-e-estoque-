import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFollowUpMessage = async (
  studentName: string,
  courseInterest: string,
  lastContact: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Escreva uma mensagem curta, amigável e profissional para WhatsApp.
      Contexto: Sou de uma Escola de Estética.
      Destinatário: Aluna/Lead chamada ${studentName}.
      Interesse: Curso de ${courseInterest}.
      Último contato: ${lastContact}.
      Objetivo: Convidar para fechar a matrícula ou tirar dúvidas.
      Tom de voz: Empático, encorajador, use emojis moderados (beleza, brilho).
      Não use hashtags. Máximo 2 parágrafos curtos.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Olá! Gostaria de saber se tem alguma dúvida sobre o curso?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Olá! Vi seu interesse no curso. Como posso ajudar?";
  }
};