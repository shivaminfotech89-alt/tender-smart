import express from "express";
import multer from "multer";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import AdmZip from "adm-zip";

const app = express();
const PORT = 3000;

// Limit upload to 20MB
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to run Gemini requests with fallback decoding and retries
async function runGeminiRetry(prompt: string, inlineDataArray?: any[]) {
  let response;
  let retries = 3;
  let delay = 2000;
  while (retries > 0) {
    try {
      const parts: any[] = [{ text: prompt }];
      if (inlineDataArray && inlineDataArray.length > 0) {
        parts.push(...inlineDataArray);
      }
      
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.INTEGER },
              matchRationale: {
                type: Type.OBJECT,
                properties: {
                  turnover: { type: Type.STRING },
                  experience: { type: Type.STRING },
                  certifications: { type: Type.STRING },
                  location: { type: Type.STRING },
                }
              },
              baseValueEstimated: { type: Type.INTEGER },
              bidValueBands: {
                type: Type.OBJECT,
                properties: {
                  conservative: { type: Type.OBJECT, properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER }, rationale: { type: Type.STRING } } },
                  recommended: { type: Type.OBJECT, properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER }, rationale: { type: Type.STRING } } },
                  aggressive: { type: Type.OBJECT, properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER }, rationale: { type: Type.STRING } } }
                }
              },
              safeMarginTargetPercent: { type: Type.INTEGER },
              riskLevel: { type: Type.STRING },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              winProbability: { type: Type.INTEGER },
              recommendationDecision: { type: Type.STRING },
              recommendationReason: { type: Type.STRING },
              scopeSummary: { type: Type.STRING },
              prosCons: {
                type: Type.OBJECT,
                properties: {
                  pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                  cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              criticalDates: {
                type: Type.OBJECT,
                properties: {
                  preBidMeeting: { type: Type.STRING },
                  queryDeadline: { type: Type.STRING },
                  submissionDeadline: { type: Type.STRING },
                  executionDuration: { type: Type.STRING }
                }
              },
              roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
              winningStrategy: { type: Type.ARRAY, items: { type: Type.STRING } },
              checklists: {
                type: Type.OBJECT,
                properties: {
                  mandatory: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                  optional: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } } } }
                }
              },
              originalTitle: { type: Type.STRING },
              authority: { type: Type.STRING },
              tenderNumber: { type: Type.STRING },
              projectName: { type: Type.STRING }
            }
          }
        }
      });
      break;
    } catch (err: any) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return response?.text || "{}";
}

app.post("/api/analyze", upload.single("tenderFile"), async (req, res) => {
  try {
    const { businessProfile, textContent } = req.body;
    let inlineDataArray: any[] = [];
    
    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        inlineDataArray.push({
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: "application/pdf",
          }
        });
      } else if (req.file.mimetype === "application/zip" || req.file.mimetype === "application/x-zip-compressed" || req.file.originalname.toLowerCase().endsWith('.zip')) {
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();
        for (const entry of zipEntries) {
          if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.pdf')) {
            inlineDataArray.push({
              inlineData: {
                data: entry.getData().toString("base64"),
                mimeType: "application/pdf",
              }
            });
          }
        }
        if (inlineDataArray.length === 0) {
          return res.status(400).json({ error: "No PDF files found inside the ZIP." });
        }
      } else {
        return res.status(400).json({ error: "Only PDF or ZIP files are supported" });
      }
    } else if (!textContent) {
      return res.status(400).json({ error: "Provide either a PDF/ZIP file or text content." });
    }

    const prompt = `You are TenderMaster AI, an expert bid advisor for Indian businesses.
Analyze the provided tender documents (via PDFs or text below) and compare it against this Company Profile:
${businessProfile}

Please extract and generate the following in JSON format:
1. matchScore (0-100)
2. matchRationale (explain turnover, experience, certifications, location match)
3. baseValueEstimated (integer, your best guess based on scope or mentions, in INR)
4. bidValueBands (Conservative, Recommended, Aggressive - provide min/max INR and 1-sentence rationale)
5. safeMarginTargetPercent (integer)
6. riskLevel (Low/Medium/High)
7. riskFactors (array of specific risks)
8. winProbability (0-100)
9. recommendationDecision (Participate, Participate with Caution, Avoid)
10. recommendationReason
11. scopeSummary (plain English summary of scope of work)
12. prosCons (pros and cons arrays)
13. criticalDates (preBidMeeting, queryDeadline, submissionDeadline, executionDuration - try to find dates or write 'Not Specified')
14. roadmap (immediate next steps specific to this tender and the company's gaps)
15. winningStrategy (tips tailored to the tender and company strengths/weaknesses)
16. checklists (mandatory and optional documents needed to bid, with reasons)
17. originalTitle (the formal title of the tender)
18. authority (the buyer/department)
19. tenderNumber
20. projectName (a clean short name for this project)
21. requiredForms (array of objects with 'code', 'name', 'description' - extract specific named annexures, forms, or schedules required by the tender. If none, return empty array)

Tender text content (if any):
${textContent || "See attached PDFs."}`;

    const text = await runGeminiRetry(prompt, inlineDataArray);
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = {}; }
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze tender" });
  }
});

app.post("/api/re-analyze", upload.single("tenderFile"), async (req, res) => {
  try {
    const { businessProfile, additionalDocs, originalAnalysis } = req.body;
    let inlineDataArray: any[] = [];
    
    const docs = JSON.parse(additionalDocs || "[]");

    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        inlineDataArray.push({
          inlineData: { data: req.file.buffer.toString("base64"), mimeType: "application/pdf" }
        });
      } else if (req.file.mimetype === "application/zip" || req.file.mimetype === "application/x-zip-compressed" || req.file.originalname.toLowerCase().endsWith('.zip')) {
        const zip = new AdmZip(req.file.buffer);
        for (const entry of zip.getEntries()) {
          if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.pdf')) {
            inlineDataArray.push({
              inlineData: { data: entry.getData().toString("base64"), mimeType: "application/pdf" }
            });
          }
        }
      } else {
        return res.status(400).json({ error: "Only PDF or ZIP files are supported" });
      }
    }
    
    // Download any fileUrls from the additionalDocs
    for (const doc of docs) {
      if (doc.fileUrl) {
        try {
          const response = await fetch(doc.fileUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            inlineDataArray.push({
              inlineData: { data: Buffer.from(buffer).toString("base64"), mimeType: "application/pdf" }
            });
          } else {
            console.warn(`Failed to download fileUrl: ${doc.fileUrl}`);
          }
        } catch (e) {
          console.error(`Error downloading fileUrl: ${doc.fileUrl}`, e);
        }
      }
    }

    const prompt = `You are TenderMaster AI, an expert bid advisor. You previously analyzed a tender and generated this analysis:
${originalAnalysis}

The user has now provided these additional documents (Corrigendums, clarifications, etc.):
${JSON.stringify(docs, null, 2)}
(Also see attached PDFs if any)

Please re-analyze the tender considering these new documents. Compare against this Company Profile:
${businessProfile}

First, explain what specifically changed and why as a result of the new documents in a field called 'changeSummary'.
Then, provide the FULL updated analysis object in the same format as the original, incorporating all new dates, values, scope, forms, and recommendations.

JSON Format:
{
  "changeSummary": "Text explaining what changed",
  "updatedAnalysis": { 
     "matchScore": ..., "matchRationale": ..., "baseValueEstimated": ..., "bidValueBands": ..., 
     "safeMarginTargetPercent": ..., "riskLevel": ..., "riskFactors": ..., "winProbability": ...,
     "recommendationDecision": ..., "recommendationReason": ..., "scopeSummary": ..., "prosCons": ...,
     "criticalDates": ..., "roadmap": ..., "winningStrategy": ..., "checklists": ..., "originalTitle": ...,
     "authority": ..., "tenderNumber": ..., "projectName": ..., "requiredForms": [{"code":"", "name":"", "description":""}]
  }
}`;

    const text = await runGeminiRetry(prompt, inlineDataArray);
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = {}; }
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Re-Analysis Error:", error);
    return res.status(500).json({ error: error.message || "Failed to re-analyze tender" });
  }
});

app.post("/api/predict-bid", async (req, res) => {
  try {
    const { businessProfile, tenderContext } = req.body;
    const prompt = `You are an expert Indian procurement cost estimator. Analyze this tender context and business profile, then predict line-item costs, bid strategies, and win probabilities.

Tender Context (Scope, Value, Authority):
${JSON.stringify(tenderContext, null, 2)}

Business Profile:
${businessProfile}

Please return ONLY valid JSON matching this schema exactly:
{
  "lineItems": [
    { "id": "uuid", "category": "Material/Labour/Transport/Misc", "description": "String", "quantity": number, "unitRate": number, "total": number, "rationale": "String" }
  ],
  "strategies": {
    "conservative": { "marginPercent": number, "bidAmount": number, "winProbability": number, "rationale": "String" },
    "recommended": { "marginPercent": number, "bidAmount": number, "winProbability": number, "rationale": "String" },
    "aggressive": { "marginPercent": number, "bidAmount": number, "winProbability": number, "rationale": "String" }
  },
  "benchmarkingNote": "String (what similar past tenders typically went for)"
}
Ensure costs are realistic for the Indian market in INR.`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json"
        }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-docs", async (req, res) => {
  try {
    const { businessProfile, tenderContext, targetBidValue, requiredDocs } = req.body;
    const prompt = `Draft the required documents for this tender bid based on the following contexts.
    
Tender Context:
${tenderContext}

Company Profile:
${businessProfile}

Target Bid Value: ₹${targetBidValue}

You MUST generate formats for ALL of the following newly requested required documents:
${(requiredDocs || []).join(', ')}

Ensure the Target Bid Value is explicitly stated in financial or bid submission forms where relevant.
Return ONLY valid JSON where the keys are the EXACT document names requested above, and the value is the drafted text for that document containing placeholders like [Date], [Signature] where applicable.`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json"
        }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/tender-chat", async (req, res) => {
  try {
    const { message, previousMessages, tenderContext, businessProfile } = req.body;
    
    let history = [
      { role: "user", parts: [{ text: `System Context: You are a chat assistant for a specific tender. 
Tender details: ${tenderContext}
Company Profile: ${businessProfile}
Answer questions directly and concisely.` }] },
      { role: "model", parts: [{ text: "Got it. I am ready to answer questions about this tender." }] }
    ];
    
    // Map previous messages to required format
    for (const msg of previousMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        history.push({
           role: msg.role === 'assistant' ? 'model' : 'user',
           parts: [{ text: msg.content }]
        });
      }
    }
    
    const chat = ai.chats.create({
       model: "gemini-3.5-flash",
       history: history as any
    });
    
    const result = await chat.sendMessage({ message });
    return res.status(200).json({ reply: result.text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: "File too large. Please upload smaller." });
    }
    return res.status(500).json({ error: err.message || "Internal server error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
  });
}

startServer();
