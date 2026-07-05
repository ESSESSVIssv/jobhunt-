const fs = require('fs');
const PDFParser = require('pdf2json');
async function parse() {
  const dataBuffer = fs.readFileSync('sample.pdf');
  const text = await new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => resolve(pdfParser.getRawTextContent()));
    pdfParser.parseBuffer(dataBuffer);
  });
  console.log("TEXT:\n", text);
  
  const skillsMatch = text.match(/(?:SKILLS|Skills|skills?)[^\w]*([\s\S]*?)(?:EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|Experience|Education|Projects|Certifications|$)/i);
  console.log("MATCH:", skillsMatch ? skillsMatch[1] : null);
}
setTimeout(parse, 2000);
