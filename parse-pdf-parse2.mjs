import fs from 'fs';
import { PDFParse } from 'pdf-parse';
async function parse() {
  const dataBuffer = fs.readFileSync('sample.pdf');
  const parser = new PDFParse();
  const text = await parser.extractText(dataBuffer);
  console.log("TEXT:\n", text);
}
parse().catch(e => console.log('caught', e));
