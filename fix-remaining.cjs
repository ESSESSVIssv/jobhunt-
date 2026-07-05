const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

const r1 = /catch \(error: any\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous extraction\.', error\.message\);[\s\S]*?res\.json\(fallbackResume\);\}\s*\}/g;

const r2 = /catch \(error: any\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous optimization\.'\);[\s\S]*?res\.json\(\{ tailoredResume: tailored, atsAnalysis \}\);\s*\}/g;

serverTs = serverTs.replace(r1, `catch (error: any) {\n          handleApiError(error, res, 'Failed to extract resume details');\n        }`);
serverTs = serverTs.replace(r2, `catch (error: any) {\n            handleApiError(error, res, 'Failed to optimize resume');\n         }`);

fs.writeFileSync('server.ts', serverTs);
console.log("Rewrote remaining blocks.");
