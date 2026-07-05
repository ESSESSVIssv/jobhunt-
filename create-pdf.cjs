const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('sample.pdf'));
doc.text('SKILLS\n\n• Google AI Studio\n• Gemini API\n• n8n Automation\n\nEXPERIENCE\nSome experience here');
doc.end();
