const fs = require('fs');
const PDFParser = require('pdf2json');

async function parsePdf(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1);
    pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", pdfData => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.parseBuffer(buffer);
  });
}

parsePdf(fs.readFileSync('package.json')).catch(e => console.log('caught', e.message));
