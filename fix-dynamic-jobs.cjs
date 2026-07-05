const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldDevBlock = `          } else {
            const devTitles = [
              \`Software Development Engineer (SDE-I)\`,
              \`Frontend Engineer - React\`,
              \`Backend Engineer - Node.js\`,
              \`Fullstack Developer\`,
              \`Mobile Developer (React Native)\`,
              \`DevOps Cloud SDE\`,
              \`SDE-II - Systems Architecture\`,
              \`Senior Software Engineer\`,
              \`Database SDE (SQL & MongoDB)\`,
              \`Software Engineer Intern\`
            ];
            
            const parsedSearch = query.trim() ? \`\${displayQuery} Developer\` : devTitles[i % devTitles.length];
            title = finalType === "Internship" ? \`\${query.trim() ? displayQuery : 'Software Engineer'} Intern\` : (i % 3 === 0 ? parsedSearch : devTitles[i % devTitles.length]);
            
            tags = Array.from(new Set([query.trim() ? displayQuery : (resumeSkills[0] || "React"), resumeSkills[1] || "Node.js", resumeSkills[2] || "TypeScript", "JavaScript", "SQL", "Git", "Docker"].filter(Boolean)));
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = \`Architect and deploy scalable digital systems for \${company.name}'s leading \${company.domain} team. Write clean, reliable, and test-covered application components.\`;
          }`;

const newDevBlock = `          } else {
            const domainTitle = (resumeSkills && resumeSkills.length > 0) ? resumeSkills[0] : "Software";
            
            const devTitles = [
              \`Software Development Engineer (SDE-I)\`,
              \`\${domainTitle} Engineer\`,
              \`Backend Engineer\`,
              \`Fullstack Developer\`,
              \`\${resumeSkills[1] || 'Mobile'} Developer\`,
              \`DevOps Cloud SDE\`,
              \`SDE-II - Systems Architecture\`,
              \`Senior \${domainTitle} Engineer\`,
              \`Database SDE\`,
              \`Software Engineer Intern\`
            ];
            
            const parsedSearch = query.trim() ? \`\${displayQuery} Developer\` : devTitles[i % devTitles.length];
            title = finalType === "Internship" ? \`\${query.trim() ? displayQuery : (domainTitle + ' Engineer')} Intern\` : (i % 3 === 0 ? parsedSearch : devTitles[i % devTitles.length]);
            
            let possibleTags = query.trim() ? [displayQuery, ...resumeSkills] : [...resumeSkills, "JavaScript", "SQL", "Git", "Docker"];
            tags = Array.from(new Set(possibleTags.filter(Boolean)));
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = \`Architect and deploy scalable digital systems for \${company.name}'s leading \${company.domain} team. Write clean, reliable, and test-covered application components utilizing \${tags.join(", ")}.\`;
          }`;

code = code.replace(oldDevBlock, newDevBlock);
fs.writeFileSync('server.ts', code);
console.log("Rewrote dynamic jobs block");
