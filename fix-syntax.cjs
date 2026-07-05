const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

serverTs = serverTs.replace(/catch \(error: any\) \{\n          handleApiError\(error, res, 'Failed to extract resume details'\);\n        \}\);/g, `catch (error: any) {\n          handleApiError(error, res, 'Failed to extract resume details');\n        }\n      });`);

fs.writeFileSync('server.ts', serverTs);
console.log("Fixed syntax");
