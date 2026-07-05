const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('import pdfParse from "pdf-parse";', 'import PDFParser from "pdf2json";');

const oldCode = `                   const dataBuffer = fs.readFileSync(req.file.path);
                   const pdfData = await pdfParse(dataBuffer);
                   const text = pdfData.text;`;

const newCode = `                   const dataBuffer = fs.readFileSync(req.file.path);
                   const text = await new Promise((resolve, reject) => {
                     const pdfParser = new PDFParser(null, 1);
                     pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
                     pdfParser.on("pdfParser_dataReady", pdfData => resolve(pdfParser.getRawTextContent()));
                     pdfParser.parseBuffer(dataBuffer);
                   });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('server.ts', code);
console.log("Replaced pdf-parse with pdf2json");
