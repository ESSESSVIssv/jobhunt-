const fs = require('fs');
const pdfParse = require('pdf-parse');

async function run() {
  let extractedSkills = [];
  try {
     const dataBuffer = fs.readFileSync('test/data/05-versions-space.pdf');
     const pdfData = await pdfParse(dataBuffer);
     console.log(pdfData.text);
  } catch(e) {
     console.log("PDF parse error", e.message);
  }
}
run();
