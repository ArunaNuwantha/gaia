import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIEnrichedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const countrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A captivating 2-sentence intro about the country." },
    attractions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "Short description of the place." }
        },
        required: ["name", "description"]
      }
    },
    culture: {
      type: Type.OBJECT,
      properties: {
        greetings: { type: Type.STRING, description: "Common local greeting phrase." },
        traditions: { type: Type.ARRAY, items: { type: Type.STRING } },
        religion: { type: Type.STRING },
        festivals: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["greetings", "traditions", "religion", "festivals"]
    },
    anthem: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        lyricsSnippet: { type: Type.STRING, description: "First 2 lines of the anthem in English or original." },
        audioUrl: { type: Type.STRING, description: "A valid public HTTPS MP3 URL for the instrumental national anthem. Return empty string if not found." }
      },
      required: ["title", "lyricsSnippet"]
    },
    travel: {
      type: Type.OBJECT,
      properties: {
        topHotels: { type: Type.ARRAY, items: { type: Type.STRING } },
        bestTimeVisit: { type: Type.STRING },
        avgCostPerDayUSD: { type: Type.STRING }
      },
      required: ["topHotels", "bestTimeVisit", "avgCostPerDayUSD"]
    }
  },
  required: ["summary", "attractions", "culture", "anthem", "travel"]
};

export const fetchCountryDetails = async (countryName: string): Promise<AIEnrichedData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide travel and cultural insights for ${countryName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: countrySchema,
        temperature: 0.4
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIEnrichedData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};