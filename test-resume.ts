import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
const ai = new GoogleGenAI({});

async function test() {
  fs.writeFileSync('test.pdf', 'dummy content');
  try {
    const filePart = {
      inlineData: {
        data: Buffer.from(fs.readFileSync('test.pdf')).toString("base64"),
        mimeType: 'application/pdf'
      }
    };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            filePart,
            { text: "Extract" }
          ]
        }
      ]
    });
    console.log("Success!", response.text);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
