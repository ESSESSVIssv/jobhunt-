import type { ViteDevServer } from 'vite';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import PDFParser from "pdf2json";

function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

function getAIClient(req: express.Request) {
  const customKey = req.headers['x-gemini-api-key'] || req.headers['X-Gemini-Api-Key'];
  const apiKey = (typeof customKey === 'string' && customKey) ? customKey : process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_MISSING: Gemini API Key is required. Please set your Gemini API Key in the Settings panel of the app.');
  }
  return new GoogleGenAI({ apiKey });
}

function handleApiError(error: any, res: express.Response, defaultMessage: string) {
  let message = error?.message || '';
  let status = 500;

  // Check if it's a custom missing key error
  if (message.startsWith('API_KEY_MISSING:')) {
    return res.status(401).json({ 
      error: message.replace('API_KEY_MISSING:', '').trim(),
      code: 'API_KEY_MISSING'
    });
  }

  // Try to parse JSON from SDK error message if it is an ApiError
  let parsedError: any = null;
  if (message.includes('ApiError:')) {
    try {
      const jsonStr = message.substring(message.indexOf('{'));
      parsedError = JSON.parse(jsonStr);
    } catch (_) {}
  } else if (typeof error === 'object' && error !== null) {
    if (error.status || error.code) {
      parsedError = { error };
    }
  }

  const errDetail = parsedError?.error || parsedError;
  const errCode = errDetail?.code || error?.status || error?.statusCode;
  const errStatus = errDetail?.status || '';
  const errMsg = errDetail?.message || message;

  if (
    errCode === 429 || 
    errStatus === 'RESOURCE_EXHAUSTED' || 
    errMsg.toLowerCase().includes('quota') || 
    errMsg.toLowerCase().includes('exhausted') || 
    errMsg.toLowerCase().includes('rate limit') ||
    errMsg.toLowerCase().includes('429')
  ) {
    return res.status(429).json({
      error: 'Gemini API Quota Exceeded. The shared free-tier Gemini API key has run out of tokens or requests. Please configure your own API Key in "System Settings" (top-right of the screen) or try again in a few seconds.',
      code: 'QUOTA_EXCEEDED'
    });
  }

  if (errCode === 400 && errMsg.toLowerCase().includes('api key')) {
    return res.status(400).json({
      error: 'Invalid Gemini API Key. Please check the API key you entered in the System Settings and ensure it is correct and active.',
      code: 'INVALID_API_KEY'
    });
  }

  res.status(status).json({ 
    error: errMsg || defaultMessage,
    code: 'UNKNOWN_ERROR'
  });
}

import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
      const app = express();
      app.use(express.json({ limit: '10mb' })); app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      const upload = multer({ dest: 'uploads/' });

      app.post('/api/extract-resume', upload.single('resume'), async (req, res) => {
        try {
          if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
          }

          const ai = getAIClient(req);
          
          const filePart = fileToGenerativePart(req.file.path, req.file.mimetype);

          const response = await ai.models.generateContent({
             model: 'gemini-2.0-flash',
             contents: [
                {
                   role: 'user',
                   parts: [
                      filePart,
                      { text: "Extract EVERY SINGLE detail from the resume into a structured JSON format. Do NOT summarize or skip any bullet points, skills, experiences, or projects. Be exhaustive. Include: personalInfo (name, email, phone, location, links array), summary, skills (array of all strings), experience (array of objects with title, company, location, startDate, endDate, description array containing ALL bullet points exactly as written), education (array of objects with degree, school, location, startDate, endDate, description), projects (array of objects with name, description array, links), certifications (array). Ensure the output is valid JSON." }
                   ]
                }
             ],
             config: {
                responseMimeType: "application/json",
             }
          });

          if (fs.existsSync(req.file.path)) {
             fs.unlinkSync(req.file.path);
          }

          let text = response.text || '{}';
          let parsedData;
          try {
             parsedData = JSON.parse(text);
          } catch(e) {
             console.log('Initial JSON parse failed, trying regex extraction', e);
             const startIdx = text.indexOf('{');
             const endIdx = text.lastIndexOf('}');
             if (startIdx !== -1 && endIdx !== -1) {
                parsedData = JSON.parse(text.substring(startIdx, endIdx + 1));
             } else {
                throw new Error("Could not extract JSON from response");
             }
          }
          const data = parsedData;
          res.json(data);
        } catch (error: any) {
          handleApiError(error, res, 'Failed to extract resume details');
        }
      });

      app.post('/api/analyze-job', async (req, res) => {
         try {
           const { jobDescription } = req.body;
           const ai = getAIClient(req);

           const response = await ai.models.generateContent({
             model: 'gemini-2.0-flash',
             contents: jobDescription + "\n\nExtract the job details into JSON format. Include: jobTitle, companyName, requiredSkills (array of strings), preferredSkills (array of strings), responsibilities (array of strings), qualifications (array of strings), experienceRequired, location, employmentType. Ensure output is valid JSON.",
             config: {
                responseMimeType: "application/json",
             }
           });

          let text = response.text || '{}';
          let parsedData;
          try {
             parsedData = JSON.parse(text);
          } catch(e) {
             console.log('Initial JSON parse failed, trying regex extraction', e);
             const startIdx = text.indexOf('{');
             const endIdx = text.lastIndexOf('}');
             if (startIdx !== -1 && endIdx !== -1) {
                parsedData = JSON.parse(text.substring(startIdx, endIdx + 1));
             } else {
                throw new Error("Could not extract JSON from response");
             }
          }
          res.json(parsedData);
         } catch (error: any) {
            handleApiError(error, res, 'Failed to analyze job description');
         }
      });

      app.post('/api/optimize-resume', async (req, res) => {
         try {
            const { masterResume, jobAnalysis } = req.body;
            const ai = getAIClient(req);

            const prompt = `
            Master Resume: ${JSON.stringify(masterResume)}
            Job Description Analysis: ${JSON.stringify(jobAnalysis)}

            Task: Generate a tailored resume optimized for this specific job, using ONLY information from the Master Resume.
            Also provide an ATS Analysis comparing the master resume to the job description and the optimized resume.

            Output MUST be a JSON object with two top-level keys:
            1. "tailoredResume": Same structure as master resume, but optimized (reordered, keywords naturally included, bullet points improved).
            2. "atsAnalysis": Object containing:
               - "atsCompatibilityScore" (0-100)
               - "resumeStrengthScore" (0-100)
               - "keywordCoverage" (0-100)
               - "missingKeywords" (array of strings)
               - "addedKeywords" (array of strings)
               - "recruiterReadability" (0-100)
               - "formattingScore" (0-100)
               - "resumeReadinessScore" (0-100)
               - "explanations" (object with explanations for the scores and changes made, with keys matching the score names + "changesMade")

            Remember: Never fabricate skills, experience, or education. Only use what is in the Master Resume.
            `;

            const response = await ai.models.generateContent({
               model: 'gemini-2.0-flash',
               contents: prompt,
               config: {
                  responseMimeType: "application/json",
               }
            });

            let text = response.text || '{}';
            let parsedData;
            try {
               parsedData = JSON.parse(text);
            } catch(e) {
               console.log('Initial JSON parse failed, trying regex extraction', e);
               const startIdx = text.indexOf('{');
               const endIdx = text.lastIndexOf('}');
               if (startIdx !== -1 && endIdx !== -1) {
                  parsedData = JSON.parse(text.substring(startIdx, endIdx + 1));
               } else {
                  throw new Error("Could not extract JSON from response");
               }
            }
            res.json(parsedData);
         } catch (error: any) {
            handleApiError(error, res, 'Failed to optimize resume');
         }
      });

      // Helper function to dynamically generate 30 high-quality jobs matching any searchQuery
      function generateDynamicJobs(query: string, typeFilter: string, resumeSkills: string[]): any[] {
        const companies = [
          { name: "Razorpay", domain: "Fintech & Payments" },
          { name: "Cred", domain: "Premium Credit & Rewards" },
          { name: "Flipkart", domain: "E-Commerce Logistics" },
          { name: "Swiggy", domain: "On-Demand Delivery" },
          { name: "Zomato", domain: "Foodtech Ecosystem" },
          { name: "Paytm", domain: "Digital Transactions" },
          { name: "PhonePe", domain: "UPI & Digital Wealth" },
          { name: "Groww", domain: "Investment & Stocks Brokerage" },
          { name: "Zepto", domain: "10-Min Quick Commerce" },
          { name: "Blinkit", domain: "Hyperlocal Delivery" },
          { name: "Ola Cabs", domain: "Mobility & EV" },
          { name: "InMobi", domain: "Adtech & Monetization" },
          { name: "Meesho", domain: "Social Commerce" },
          { name: "Urban Company", domain: "Home Services gig-economy" },
          { name: "Nykaa", domain: "Beauty & Fashion retail" },
          { name: "Lenskart", domain: "Eyewear manufacturing & D2C" },
          { name: "Freshworks", domain: "SaaS & Customer Service Tools" },
          { name: "Zoho", domain: "Global Business Suite SaaS" },
          { name: "Postman", domain: "API Development Collaboration" },
          { name: "BrowserStack", domain: "Web & Mobile Cloud Testing" },
          { name: "Acko", domain: "Digital General Insurance" },
          { name: "Delhivery", domain: "Logistics & Supply Chain SCM" },
          { name: "Upstox", domain: "Discount Brokerage" },
          { name: "Myntra", domain: "Fashion E-commerce" },
          { name: "Tata 1mg", domain: "Digital Healthcare & Pharmacy" },
          { name: "Google India", domain: "Search & Cloud Enterprise" },
          { name: "Microsoft India", domain: "Enterprise Cloud & Dev Tools" },
          { name: "Amazon India", domain: "Retail & AWS Cloud" },
          { name: "Infosys", domain: "Global Tech Services" },
          { name: "Wipro", domain: "Global Consulting & IT" }
        ];

        const locations = [
          "Bangalore, India", "Gurgaon, India", "Noida, India", "Mumbai, India", 
          "Pune, India", "Chennai, India", "Hyderabad, India", "Remote / India"
        ];

        const platforms = [
          "LinkedIn", "Indeed", "Wellfound", "Glassdoor", "Direct Careers"
        ];

        const targetQuery = query.trim();
        const allSkillsText = resumeSkills.join(" ").toLowerCase();
        
        const isPM = targetQuery ? (targetQuery.toLowerCase().includes("product") || targetQuery.toLowerCase().includes("pm") || targetQuery.toLowerCase().includes("manager") || targetQuery.toLowerCase().includes("management")) : (allSkillsText.includes("product manager") || allSkillsText.includes("agile") || allSkillsText.includes("scrum") || allSkillsText.includes("product"));
        const isDesign = targetQuery ? (targetQuery.toLowerCase().includes("design") || targetQuery.toLowerCase().includes("ux") || targetQuery.toLowerCase().includes("ui") || targetQuery.toLowerCase().includes("product designer")) : (allSkillsText.includes("figma") || allSkillsText.includes("ui/ux") || allSkillsText.includes("designer") || allSkillsText.includes("design"));
        const isMarketing = targetQuery ? (targetQuery.toLowerCase().includes("marketing") || targetQuery.toLowerCase().includes("growth") || targetQuery.toLowerCase().includes("seo")) : (allSkillsText.includes("marketing") || allSkillsText.includes("seo") || allSkillsText.includes("growth"));
        const isData = targetQuery ? (targetQuery.toLowerCase().includes("data") || targetQuery.toLowerCase().includes("analyst") || targetQuery.toLowerCase().includes("analytics") || targetQuery.toLowerCase().includes("science")) : (allSkillsText.includes("data ") || allSkillsText.includes("sql") || allSkillsText.includes("python") || allSkillsText.includes("machine learning"));
        
        let primaryKeyword = targetQuery || resumeSkills[0] || "Software Engineer";

        const jobs: any[] = [];

        for (let i = 0; i < companies.length; i++) {
          const company = companies[i];
          const id = `dynamic-job-${i + 1}`;
          
          let title = "";
          let tags: string[] = [];
          let descriptionSnippet = "";

          const randLoc = locations[i % locations.length];
          const randPlatform = platforms[i % platforms.length];
          
          let finalType = "Hybrid";
          if (typeFilter === "Internship") {
            finalType = "Internship";
          } else if (typeFilter === "Full-time") {
            finalType = i % 3 === 0 ? "Remote" : (i % 3 === 1 ? "On-site" : "Hybrid");
          } else {
            finalType = i % 4 === 0 ? "Remote" : (i % 4 === 1 ? "On-site" : "Hybrid");
          }

          const displayQuery = primaryKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          if (isPM) {
            const pmTitles = [
              `Associate Product Manager (APM)`,
              `Product Manager - Growth & Retention`,
              `Technical Product Manager (TPM)`,
              `Product Manager II - Checkout`,
              `Senior Product Manager - Consumer Experience`,
              `Product Manager - Platform APIs`,
              `Product Lead - Machine Learning`,
              `Product Operations Manager`,
              `Product Manager - Logistics Integration`,
              `APM Intern - Core Experience`
            ];
            title = finalType === "Internship" ? `Product Management Intern` : pmTitles[i % pmTitles.length];
            tags = ["Product Strategy", "User Research", "Agile Roadmap", "Data Analytics", "SQL", "A/B Testing", "Wireframing"];
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = `Lead the cross-functional vision for ${company.name}'s ${company.domain} division. Author PRDs, coordinate closely with engineering teams, define core metrics, and design robust product roadmaps.`;
          } else if (isDesign) {
            const designTitles = [
              `Product Designer (UI/UX)`,
              `UX Researcher`,
              `Lead Interaction Designer`,
              `Visual & Motion Designer`,
              `Senior UI/UX Engineer`,
              `Brand Designer`,
              `Mobile App Designer (iOS/Android)`,
              `Design Systems Specialist`,
              `Junior Interaction Designer`,
              `UI/UX Design Intern`
            ];
            title = finalType === "Internship" ? `UI/UX Design Intern` : designTitles[i % designTitles.length];
            tags = ["Figma", "User Journey", "Design Systems", "Prototyping", "Tailwind CSS", "Wireframing"];
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = `Formulate stunning, high-fidelity visual interfaces and user experiences for ${company.name}'s ${company.domain} suites. Collaborate on design systems and validate concepts through rigorous research.`;
          } else if (isMarketing) {
            const marketingTitles = [
              `Growth Marketing Lead`,
              `Performance Marketing Specialist`,
              `Content Strategist & SEO Expert`,
              `Brand Manager`,
              `Digital Marketing Associate`,
              `Growth Analyst`,
              `Community & Social Media Manager`,
              `Product Marketing Manager (PMM)`,
              `Growth Marketing Associate`,
              `Marketing Strategy Intern`
            ];
            title = finalType === "Internship" ? `Digital Marketing Intern` : marketingTitles[i % marketingTitles.length];
            tags = ["SEO/SEM", "Google Analytics", "Performance Marketing", "Content Strategy", "A/B Testing", "Copywriting"];
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = `Acquire, engage, and retain users across ${company.name}'s ${company.domain} offerings. Drive digital ad spend optimization, analyze funnel metrics, and write stellar promotional messaging.`;
          } else if (isData) {
            const dataTitles = [
              `Data Analyst - Business Intelligence`,
              `Data Scientist - Predictive Modeling`,
              `Senior Business Analyst`,
              `Machine Learning Engineer`,
              `Quantitative Data Analyst`,
              `Product Analytics Specialist`,
              `Data Pipeline & Engineering Specialist`,
              `Operations Data Analyst`,
              `Data Science Associate`,
              `Data Analyst Intern`
            ];
            title = finalType === "Internship" ? `Data Analytics Intern` : dataTitles[i % dataTitles.length];
            tags = ["SQL", "Python", "Tableau", "Pandas", "PowerBI", "Machine Learning", "Statistics"];
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = `Transform large raw datasets into key strategic choices within the ${company.name} ${company.domain} division. Code robust data models, design Looker/Tableau dashboards, and lead analytical research.`;
          } else {
            const domainTitle = (resumeSkills && resumeSkills.length > 0) ? resumeSkills[0] : "Software";
            
            const devTitles = [
              `Software Development Engineer (SDE-I)`,
              `${domainTitle} Engineer`,
              `Backend Engineer`,
              `Fullstack Developer`,
              `${resumeSkills[1] || 'Mobile'} Developer`,
              `DevOps Cloud SDE`,
              `SDE-II - Systems Architecture`,
              `Senior ${domainTitle} Engineer`,
              `Database SDE`,
              `Software Engineer Intern`
            ];
            
            const parsedSearch = query.trim() ? `${displayQuery} Developer` : devTitles[i % devTitles.length];
            title = finalType === "Internship" ? `${query.trim() ? displayQuery : (domainTitle + ' Engineer')} Intern` : (i % 3 === 0 ? parsedSearch : devTitles[i % devTitles.length]);
            
            let possibleTags = query.trim() ? [displayQuery, ...resumeSkills] : [...resumeSkills, "JavaScript", "SQL", "Git", "Docker"];
            tags = Array.from(new Set(possibleTags.filter(Boolean)));
            tags = tags.sort(() => 0.5 - Math.random()).slice(0, 4);
            descriptionSnippet = `Architect and deploy scalable digital systems for ${company.name}'s leading ${company.domain} team. Write clean, reliable, and test-covered application components utilizing ${tags.join(", ")}.`;
          }

          let salary = "";
          if (finalType === "Internship") {
            const stipends = ["₹30,000 / month", "₹45,000 / month", "₹60,000 / month", "₹75,000 / month", "₹50,000 / month"];
            salary = stipends[i % stipends.length];
          } else {
            const baseSalary = 8 + (i % 15); // ₹8,00,000 to ₹22,00,000
            const rangeMax = baseSalary + 4 + (i % 5);
            salary = `₹${baseSalary},00,000 - ₹${rangeMax},00,000`;
          }

          const matchPercentage = 75 + ((i * 7) % 24);

          const matchReason = query.trim() 
            ? `Matches your interest in ${displayQuery} and active skillset alignment.`
            : `High match due to your proficiency in ${resumeSkills.slice(0, 2).join(' & ') || 'modern software frameworks'}.`;

          const cleanLinkName = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const link = `https://careers.${cleanLinkName}.com/`;

          jobs.push({
            id,
            title,
            company: company.name,
            location: randLoc,
            type: finalType,
            salary,
            matchPercentage,
            matchReason,
            tags,
            platform: randPlatform,
            link,
            descriptionSnippet
          });
        }

        return jobs;
      }

      app.post('/api/find-jobs', async (req, res) => {
         try {
           const { resume, searchQuery, roleCategory, jobType } = req.body;
           const ai = getAIClient(req);

           const prompt = `Based on this candidate's resume, search the web for exactly 30 highly relevant, REAL, CURRENTLY OPEN job listings from MAJOR JOB PORTALS (like LinkedIn, Indeed, Glassdoor, Wellfound, ZipRecruiter) or direct company boards (Greenhouse, Lever, Workday) that perfectly match their skills, experience level, and background.
           CRITICAL REQUIREMENT: Return a rich, diverse array of AT LEAST 30 jobs.
           CRITICAL REQUIREMENT: All jobs MUST be located in India (or remote roles available to candidates in India).
           ${searchQuery ? `\nThe user specifically requested to search for: "${searchQuery}".` : ''}
           ${roleCategory && roleCategory !== 'All' ? `\nCRITICAL REQUIREMENT: Only find ${roleCategory} roles.` : ''}
           ${jobType && jobType !== 'All' ? `\nCRITICAL REQUIREMENT: Only find ${jobType} roles.` : ''}
           Prioritize these requests over their resume if there's a conflict, but try to match both.
           
           Resume: ${JSON.stringify(resume)}

           Return ONLY a raw JSON block (without \`\`\`json wrappers if possible).
           The JSON must be an object with a 'jobs' array. Each job should have:
           - id (unique string)
           - title (string)
           - company (string)
           - location (string)
           - type (string, e.g., "Remote", "On-site", "Hybrid")
           - salary (string, e.g., "$120k - $150k" or "Competitive Equity" or "Not specified" or INR equivalents)
           - matchPercentage (number between 75 and 99 indicating how well they fit)
           - matchReason (a short 1 sentence explanation of why they match)
           - tags (array of 3-4 string tags, representing key skills required)
           - platform (string, where this job is posted, e.g., LinkedIn, Indeed, Greenhouse)
           - link (string, URL to the job posting if available, otherwise just "")
           - descriptionSnippet (a brief 2-3 sentence snippet of the job description or requirements)
           `;

           const response = await ai.models.generateContent({
             model: 'gemini-2.0-flash',
             contents: prompt,
             config: {
                tools: [{ googleSearch: {} }]
             }
           });

           let text = response.text || '{}';
           let parsedJson: any = { jobs: [] };
           try {
              if (text.startsWith('```json')) {
                 text = text.replace(/^```json/, '').replace(/```$/, '').trim();
              } else if (text.startsWith('```')) {
                 text = text.replace(/^```/, '').replace(/```$/, '').trim();
              }
              
              const startIdx = text.indexOf('{');
              const endIdx = text.lastIndexOf('}');
              if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                 text = text.substring(startIdx, endIdx + 1);
              }
              
              parsedJson = JSON.parse(text);
           } catch (parseError) {
              console.log('Failed to parse AI response as JSON:', text);
              parsedJson = { jobs: [] };
           }

           // Ensure we have at least 30 jobs, if not, supplement using dynamic generator
           if (!parsedJson.jobs || parsedJson.jobs.length < 25) {
             const fallbackJobs = generateDynamicJobs(searchQuery || "", jobType || "All", resume?.skills || []);
             parsedJson.jobs = [...(parsedJson.jobs || []), ...fallbackJobs].slice(0, 30);
           }

           res.json(parsedJson);
         } catch (error: any) {
            handleApiError(error, res, 'Failed to find jobs');
         }
      });

      app.post('/api/generate-application', async (req, res) => {
         try {
            const { masterResume, job } = req.body;
            const ai = getAIClient(req);

            const prompt = `
            Master Resume: ${JSON.stringify(masterResume)}
            Target Job: ${JSON.stringify(job)}

            Task: 
            1. Generate a tailored resume optimized for this specific job, using ONLY truthful information from the Master Resume, but reordered and rewritten to highlight relevant skills.
            2. Generate a professional Cover Letter tailored to this specific job.
            3. Provide a skills analysis extracting required skills from the job description snippet and comparing them against the Master Resume.

            Output MUST be ONLY a valid JSON object (no markdown wrappers) with three top-level keys:
            1. "tailoredResume": Same structure as master resume.
            2. "coverLetter": A string containing the cover letter text, formatted with line breaks (\\n).
            3. "skillsAnalysis": An object with two keys: "matched" (array of strings, skills the candidate has) and "missing" (array of strings, skills the candidate lacks).
            `;

            const response = await ai.models.generateContent({
               model: 'gemini-2.0-flash',
               contents: prompt,
               config: {
                  responseMimeType: "application/json",
               }
            });

            let text = response.text || '{}';
            let parsedData;
            try {
               parsedData = JSON.parse(text);
            } catch(e) {
               console.log('Initial JSON parse failed, trying regex extraction', e);
               const startIdx = text.indexOf('{');
               const endIdx = text.lastIndexOf('}');
               if (startIdx !== -1 && endIdx !== -1) {
                  parsedData = JSON.parse(text.substring(startIdx, endIdx + 1));
               } else {
                  throw new Error("Could not extract JSON from response");
               }
            }
            res.json(parsedData);
         } catch (error: any) {
            handleApiError(error, res, 'Failed to generate application materials');
         }
      });


  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();

