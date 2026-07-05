const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

function replaceCatchBlock(code, endpointPath, defaultErrorMessage) {
  const postPattern = new RegExp(`app\\.post\\('${endpointPath}'.*?\\}\\s*\\);`, 'gs');
  const postMatches = [...code.matchAll(postPattern)];
  if (postMatches.length === 0) return code;
  
  const endpointCode = postMatches[0][0];
  
  // Find the outermost catch block
  const catchPattern = /} catch \([^)]+\) \{[\s\S]*?\n\s*\}/g;
  const catchMatches = [...endpointCode.matchAll(catchPattern)];
  
  if (catchMatches.length > 0) {
    // The last catch block is usually the main try/catch in these handlers
    const lastCatch = catchMatches[catchMatches.length - 1][0];
    const newCatch = `} catch (error: any) {
          handleApiError(error, res, '${defaultErrorMessage}');
        }`;
    const newEndpointCode = endpointCode.replace(lastCatch, newCatch);
    return code.replace(endpointCode, newEndpointCode);
  }
  return code;
}

code = replaceCatchBlock(code, '/api/extract-resume', 'Failed to extract resume details');
code = replaceCatchBlock(code, '/api/analyze-job', 'Failed to analyze job description');
code = replaceCatchBlock(code, '/api/optimize-resume', 'Failed to optimize resume');
code = replaceCatchBlock(code, '/api/find-jobs', 'Failed to find jobs');
code = replaceCatchBlock(code, '/api/generate-application', 'Failed to generate application materials');

// Remove the now-unused fallback imports and generation functions
code = code.replace(/const generateDynamicJobs.*?\n\s*\}\n/gs, '');

fs.writeFileSync('server.ts', code);
console.log("Updated catch blocks.");
