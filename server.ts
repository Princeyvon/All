import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initTRPC } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { z } from "zod";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health checks
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Auth PIN route for client PIN login
app.post("/api/auth/pin", (_req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      openId: "guest-user",
      name: "Prince",
      email: "princeyvon30@gmail.com",
      role: "user",
      loginMethod: "pin",
    },
  });
});

// Voice note & file upload mock proxy
app.post("/api/uploads", (req, res) => {
  const { dataBase64, contentType } = req.body || {};
  const mime = contentType || "audio/webm";
  res.json({
    url: dataBase64 ? `data:${mime};base64,${dataBase64}` : "",
  });
});

// Health AI habit assistant route
app.post("/api/health-ai", async (req, res) => {
  const { messages, message, userText } = req.body || {};
  const promptText = userText || message || (messages && messages[0]?.content) || "";
  const ai = getAI();

  if (ai && promptText) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You are a supportive health-habit assistant inside a personal dashboard app. The user describes a symptom or condition: "${promptText}".
Respond ONLY with a raw JSON object in this exact schema:
{
  "diseaseName": "short condition name",
  "summary": "1-2 encouraging sentences of practical guidance",
  "habits": ["short imperative habit 1", "short imperative habit 2"],
  "clinicVisit": false,
  "medication": null
}`,
      });
      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return res.json({
          ...parsed,
          content: [{ text: JSON.stringify(parsed) }],
        });
      }
    } catch {}
  }

  const fallback = {
    diseaseName: promptText ? promptText.slice(0, 30) : "General Wellness",
    summary: "Stay hydrated, prioritize deep recovery sleep, and avoid strenuous lifts until symptoms resolve.",
    habits: ["Drink 3L electrolyte water", "Rest and sleep 8+ hours"],
    clinicVisit: false,
    medication: null,
  };
  return res.json({
    ...fallback,
    content: [{ text: JSON.stringify(fallback) }],
  });
});

// Talking points AI route
app.post("/api/talking-points", async (req, res) => {
  const { messages, person } = req.body || {};
  const promptText = (messages && messages[0]?.content) || (person ? `Name: ${person.name}, Relationship: ${person.type}` : "");
  const ai = getAI();

  if (ai && promptText) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `You help someone prepare for a warm catch-up conversation. Context: "${promptText}".
Respond ONLY with a raw JSON object:
{ "points": ["starter 1", "starter 2", "starter 3"] }`,
      });
      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return res.json({
          ...parsed,
          content: [{ text: JSON.stringify(parsed) }],
        });
      }
    } catch {}
  }

  const fallback = {
    points: [
      "Ask how their recent projects and hobbies are going.",
      "Check in on their family and recent weekend plans.",
      "Share an encouraging update about Georgetown and your upcoming goals.",
    ],
  };
  return res.json({
    ...fallback,
    content: [{ text: JSON.stringify(fallback) }],
  });
});

// AI Eisenhower Prioritization & Coaching Route
app.post("/api/coach/prioritize", async (req, res) => {
  try {
    const { note, currentContext } = req.body || {};
    const ai = getAI();

    if (ai && note) {
      try {
        const prompt = `You are an executive life coach and productivity master applying the Eisenhower Matrix (Q1: Do First/Urgent & Important, Q2: Schedule/Not Urgent & Important, Q3: Delegate or Quick Win/Urgent & Not Important, Q4: Don't Do or Backlog/Not Urgent & Not Important).
The user gave this voice note: "${note}".
Current domain context: "${currentContext || 'general'}".
Categorize this task or request into:
1. title: concise task title
2. quadrant: "Q1" | "Q2" | "Q3" | "Q4"
3. priority: "P1" | "P2" | "P3" | "P4"
4. domain: "georgetown" | "health" | "finance" | "work" | "relationships" | "general"
5. coachInsight: 1-2 sentence coaching wisdom explaining why it belongs here and how to execute it efficiently.
Return JSON format: { "title": string, "quadrant": "Q1"|"Q2"|"Q3"|"Q4", "priority": "P1"|"P2"|"P3"|"P4", "domain": string, "coachInsight": string }`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.json(JSON.parse(jsonMatch[0]));
        }
      } catch (err) {
        console.warn("Gemini prioritization error, falling back:", err);
      }
    }

    // High quality rule-based fallback if GEMINI_API_KEY is not configured
    const lower = (note || "").toLowerCase();
    let quadrant = "Q2";
    let priority = "P2";
    let domain = currentContext || "general";
    let insight = "Placed in Q2 for proactive deep focus.";

    if (lower.includes("urgent") || lower.includes("due today") || lower.includes("exam") || lower.includes("overdue") || lower.includes("asap") || lower.includes("crisis")) {
      quadrant = "Q1";
      priority = "P1";
      insight = "Critical urgency detected. Execute immediately to protect your standards.";
    } else if (lower.includes("routine") || lower.includes("errand") || lower.includes("reply") || lower.includes("email") || lower.includes("quick")) {
      quadrant = "Q3";
      priority = "P3";
      insight = "Quick operational item. Knock this out in a batch or delegate.";
    } else if (lower.includes("maybe") || lower.includes("someday") || lower.includes("look into") || lower.includes("backlog")) {
      quadrant = "Q4";
      priority = "P4";
      insight = "Low priority item parked in Q4 so it does not distract your core momentum.";
    }

    if (lower.includes("georgetown") || lower.includes("class") || lower.includes("reading") || lower.includes("econ") || lower.includes("calc") || lower.includes("course") || lower.includes("professor")) {
      domain = "georgetown";
    } else if (lower.includes("workout") || lower.includes("gym") || lower.includes("bench") || lower.includes("squat") || lower.includes("water") || lower.includes("protein") || lower.includes("weight") || lower.includes("sleep")) {
      domain = "health";
    } else if (lower.includes("debt") || lower.includes("income") || lower.includes("budget") || lower.includes("pay") || lower.includes("bank") || lower.includes("money") || lower.includes("invest")) {
      domain = "finance";
    } else if (lower.includes("call") || lower.includes("mom") || lower.includes("dad") || lower.includes("friend") || lower.includes("anniversary") || lower.includes("family")) {
      domain = "relationships";
    }

    return res.json({
      title: note,
      quadrant,
      priority,
      domain,
      coachInsight: insight,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to prioritize" });
  }
});

// tRPC Router with superjson transformer matching client configuration
const t = initTRPC.create({ transformer: superjson });

let savedSnapshot: any = null;

const appRouter = t.router({
  auth: t.router({
    me: t.procedure.query(() => ({
      id: 1,
      openId: "guest-user",
      name: "Prince",
      email: "princeyvon30@gmail.com",
      role: "user",
      loginMethod: "pin",
    })),
    logout: t.procedure.mutation(() => ({ success: true })),
  }),
  calendar: t.router({
    status: t.procedure.input(z.any().optional()).query(() => ({
      connected: false,
      email: null,
      lastSynced: null,
    })),
    list: t.procedure.input(z.any().optional()).query(() => []),
    sync: t.procedure.input(z.any().optional()).mutation(() => ({
      imported: 0,
      removed: 0,
    })),
    create: t.procedure.input(z.any().optional()).mutation(() => ({
      success: true,
      event: null,
    })),
    update: t.procedure.input(z.any().optional()).mutation(() => ({
      success: true,
    })),
    delete: t.procedure.input(z.any().optional()).mutation(() => ({
      success: true,
    })),
  }),
  dashboard: t.router({
    load: t.procedure.input(z.any().optional()).query(() => savedSnapshot),
    save: t.procedure.input(z.any().optional()).mutation(({ input }) => {
      savedSnapshot = input;
      return { success: true };
    }),
  }),
  dailyRewind: t.router({
    status: t.procedure.input(z.any().optional()).query(() => ({
      enabled: false,
      eligible: false,
      completedToday: false,
      dismissedToday: false,
    })),
    setEnabled: t.procedure.input(z.any().optional()).mutation(() => ({ success: true })),
    dismiss: t.procedure.input(z.any().optional()).mutation(() => ({ success: true })),
    complete: t.procedure.input(z.any().optional()).mutation(() => ({ success: true })),
  }),
  advice: t.router({
    performance: t.procedure.input(z.any().optional()).mutation(() => ({
      text: "Prioritize your Georgetown Bank Runs deliverables and maintain steady daily focus blocks.",
    })),
    coach: t.procedure.input(z.any().optional()).mutation(() => ({
      text: "Outstanding progress. Protect your high-leverage Q2 deep work sessions from minor logistical noise.",
    })),
    ideas: t.procedure.input(z.any().optional()).mutation(() => ({
      text: "Consider mapping out your weekly economic problem set milestones early to avoid crunch time.",
    })),
    voiceUpdate: t.procedure.input(z.any().optional()).mutation(() => ({
      text: "Voice action processed and synchronized to your priority tracking matrix.",
    })),
  }),
  voice: t.router({
    transcribe: t.procedure.input(z.any().optional()).mutation(() => ({
      text: "",
    })),
  }),
  ai: t.router({
    chat: t.procedure.input(z.any().optional()).mutation(async ({ input }) => {
      const ai = getAI();
      const messages = input?.messages || [];
      const lastMsg = messages[messages.length - 1]?.content || "Hello";
      if (ai) {
        try {
          const res = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: lastMsg,
          });
          if (res.text) return res.text;
        } catch (e) {
          console.warn("Gemini chat error:", e);
        }
      }
      return "I am your productivity assistant. How can I help you today?";
    }),
  }),
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
  })
);

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist", "public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

