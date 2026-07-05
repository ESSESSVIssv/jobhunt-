const text = `
JavaScript, TypeScript, React, Node.js
• PostgreSQL, MongoDB
• Docker, AWS
`;
let extractedSkills = text.split(/[,|\n•-]/)
  .map(s => s.trim())
  .filter(s => s.length > 1 && s.length < 35);
console.log(extractedSkills);
