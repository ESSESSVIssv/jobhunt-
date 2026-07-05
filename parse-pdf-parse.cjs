const fs = require('fs');
const pdfParse = require('pdf-parse');
async function parse() {
  const dataBuffer = fs.readFileSync('sample.pdf');
  const text = await pdfParse(dataBuffer);
  console.log("TEXT:\n", text.text);
  
  const skillsMatch = text.text.match(/(?:SKILLS|Skills|skills?)[^\w]*([\s\S]*?)(?:EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|Experience|Education|Projects|Certifications|$)/i);
  console.log("MATCH:", skillsMatch ? skillsMatch[1] : null);
}
parse().catch(e => console.log('caught', e));
