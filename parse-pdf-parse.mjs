import fs from 'fs';
import pdfParse from 'pdf-parse';
async function parse() {
  const dataBuffer = fs.readFileSync('sample.pdf');
  const text = await pdfParse(dataBuffer);
  console.log("TEXT:\n", text.text);
}
parse().catch(e => console.log('caught', e));
