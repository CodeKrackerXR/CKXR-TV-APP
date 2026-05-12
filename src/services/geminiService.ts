import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ForensicReport {
  isOneDollarBill: boolean;
  serialNumber: string;
  seriesYear: string;
  bank: string;
  district: string;
  designYear: string;
  coordinate: string;
  facility: string;
  suffix: string;
  treasurer: string;
  secretary: string;
  facePlate: string;
  backPlate: string;
  confidence: number;
  reasoning?: string;
}

export const authenticateCurrency = async (base64Image: string): Promise<ForensicReport> => {
  const prompt = `
    Analyze this image of a US banknote. 
    You are a Currency Forensics Tool. Perform a deep authentication of this $1 bill.
    
    Step A: Verify if it is a US $1 bill. If it is NOT a $1 bill (e.g. $5, $10, or random object), set 'isOneDollarBill' to false.
    Step B: If it IS a $1 bill, extract the following data points. Use "UNCLEAR" if you cannot read a specific value.
    
    1. Serial Number (top right and bottom left)
    2. Series Year (e.g. 2017)
    3. Bank (The Federal Reserve Bank name)
    4. District (The letter/number associated with the bank, e.g. B2)
    5. Design Year (usually same as series or slightly different)
    6. Coordinate (Position on the plate, e.g. A1, H4)
    7. Facility (Look for 'FW' mark indicating Fort Worth, otherwise 'DC')
    8. Suffix (Letter at the end of serial number)
    9. Treasurer name
    10. Secretary name
    11. Face Plate number (tiny number on front)
    12. Back Plate number (tiny number on back - if visible in image)

    Return a JSON object ONLY with this structure:
    {
      "isOneDollarBill": boolean,
      "serialNumber": string,
      "seriesYear": string,
      "bank": string,
      "district": string,
      "designYear": string,
      "coordinate": string,
      "facility": string,
      "suffix": string,
      "treasurer": string,
      "secretary": string,
      "facePlate": string,
      "backPlate": string,
      "confidence": number (0-1),
      "reasoning": string (brief explanation if not a $1 bill)
    }
  `;

  try {
    // Remove data:image/jpeg;base64, prefix
    const base64Data = base64Image.split(',')[1];
    
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    };
    const textPart = {
      text: prompt
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    
    // Extract JSON from text (sometimes Gemini wraps it in code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Failed to parse forensics report");
  } catch (error) {
    console.error("Forensics Error:", error);
    throw error;
  }
};

export const analyzeSerialNumber = async (serialNumber: string, seriesYear: string): Promise<ForensicReport> => {
  const prompt = `
    Analyze this US $1 bill.
    Serial Number: ${serialNumber}
    Series Year: ${seriesYear}

    You are a Currency Forensics Tool. Based ON THIS SERIAL NUMBER AND SERIES YEAR, provide the expected forensic data points for a typical $1 bill.
    
    Data points to return:
    1. Series Year (confirm or correct if needed)
    2. Bank (The Federal Reserve Bank associated with the first letter of serial or the seal)
    3. District (The letter/number associated with the bank, e.g. B2)
    4. Design Year
    5. Coordinate (Typical e.g. A1)
    6. Facility (Typical e.g. DC or FW)
    7. Suffix (Letter at the end of serial number)
    8. Treasurer name (associated with the series year)
    9. Secretary name (associated with the series year)
    10. Face Plate number (typical)
    11. Back Plate number (typical)

    Return a JSON object ONLY with this structure:
    {
      "isOneDollarBill": true,
      "serialNumber": "${serialNumber}",
      "seriesYear": "${seriesYear}",
      "bank": string,
      "district": string,
      "designYear": string,
      "coordinate": string,
      "facility": string,
      "suffix": string,
      "treasurer": string,
      "secretary": string,
      "facePlate": string,
      "backPlate": string,
      "confidence": number (0-1),
      "reasoning": "Manual Input Analysis"
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse forensics report");
  } catch (error) {
    console.error("Manual Analysis Error:", error);
    throw error;
  }
};
