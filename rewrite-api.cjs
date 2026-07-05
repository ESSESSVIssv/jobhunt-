const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

// We need to replace the entire try-catch logic of each app.post
// A safer way is to match app.post(...) and then replace the specific catch blocks based on the console.log string.

const replacements = [
  {
    find: /catch \(error: any\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous extraction\.', error\.message\);[\s\S]*?res\.json\(fallbackResume\);\n\s*\}/g,
    replace: `catch (error: any) {\n          handleApiError(error, res, 'Failed to extract resume details');\n        }`
  },
  {
    find: /catch \(error\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous analysis\.'\);[\s\S]*?res\.json\(fallbackAnalysis\);\s*\}/g,
    replace: `catch (error: any) {\n            handleApiError(error, res, 'Failed to analyze job description');\n         }`
  },
  {
    find: /catch \(error: any\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous optimization\.'\);[\s\S]*?res\.json\(\{ tailoredResume: tailored, atsAnalysis \}\);\s*\}/g,
    replace: `catch (error: any) {\n            handleApiError(error, res, 'Failed to optimize resume');\n         }`
  },
  {
    find: /catch \(error: any\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous job finder\.'\);[\s\S]*?res\.json\(\{ jobs: fallbackJobs \}\);\s*\}/g,
    replace: `catch (error: any) {\n            handleApiError(error, res, 'Failed to find jobs');\n         }`
  },
  {
    find: /catch \(error: any\) \{\s*console\.log\('Gemini API status check: Quota\/Rate Limit active\. Seamlessly fell back to smart autonomous application generator\.'\);[\s\S]*?res\.json\(\{[\s\S]*?\}\);\n\s*\}/g,
    replace: `catch (error: any) {\n            handleApiError(error, res, 'Failed to generate application materials');\n         }`
  }
];

let replaced = serverTs;
for (const r of replacements) {
  replaced = replaced.replace(r.find, r.replace);
}

fs.writeFileSync('server.ts', replaced);
console.log("Rewrote blocks.");
