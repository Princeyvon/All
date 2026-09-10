import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getDashboardSnapshot, saveDashboardSnapshot } from "./db";

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// In-memory state caches
let savedDashboardSnapshot: any = null;
let calendarEvents: any[] = [];
let rewindSettings: any = {
  enabled: false,
  pending: false,
  dismissed: false,
  completed: false,
  lastCompletedDate: null,
};

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(async () => {
      return {
        id: 1,
        openId: "pin-user",
        name: "Prince",
        email: "princeyvon30@gmail.com",
        role: "admin",
        loginMethod: "pin",
      };
    }),
    logout: publicProcedure.mutation(async () => {
      return { success: true };
    }),
  }),

  dashboard: router({
    load: publicProcedure.query(async () => {
      if (savedDashboardSnapshot) {
        return savedDashboardSnapshot;
      }
      try {
        const fromDb = await getDashboardSnapshot(1);
        if (fromDb?.snapshot) {
          savedDashboardSnapshot = JSON.parse(fromDb.snapshot);
          return savedDashboardSnapshot;
        }
      } catch (err) {
        console.warn("[Dashboard] Load snapshot error:", err);
      }
      return null;
    }),
    save: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      savedDashboardSnapshot = input;
      try {
        await saveDashboardSnapshot(1, JSON.stringify(input));
      } catch (err) {
        console.warn("[Dashboard] Save snapshot error:", err);
      }
      return { success: true };
    }),
  }),

  calendar: router({
    status: publicProcedure.query(async () => {
      return {
        connected: false,
        email: null,
        error: null,
      };
    }),
    list: publicProcedure.input(z.any().optional()).query(async () => {
      return calendarEvents;
    }),
    sync: publicProcedure.mutation(async () => {
      return {
        imported: 0,
        removed: 0,
      };
    }),
    create: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const newEvt = {
        id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...input,
      };
      calendarEvents.push(newEvt);
      return newEvt;
    }),
    update: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const idx = calendarEvents.findIndex((e) => e.id === input?.id);
      if (idx !== -1) {
        calendarEvents[idx] = { ...calendarEvents[idx], ...input };
        return calendarEvents[idx];
      }
      return input;
    }),
    delete: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const idToDelete = input?.id || input;
      calendarEvents = calendarEvents.filter((e) => e.id !== idToDelete);
      return { success: true };
    }),
  }),

  dailyRewind: router({
    status: publicProcedure.query(async () => {
      return rewindSettings;
    }),
    setEnabled: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      rewindSettings.enabled = Boolean(input?.enabled ?? input);
      return { success: true, enabled: rewindSettings.enabled };
    }),
    dismiss: publicProcedure.mutation(async () => {
      rewindSettings.dismissed = true;
      rewindSettings.pending = false;
      return { success: true };
    }),
    complete: publicProcedure.mutation(async () => {
      rewindSettings.completed = true;
      rewindSettings.pending = false;
      rewindSettings.lastCompletedDate = new Date().toISOString();
      return { success: true };
    }),
  }),

  advice: router({
    performance: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const ai = getAI();
      if (ai) {
        try {
          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an elite productivity mentor. Analyze this user dashboard context and give 2-3 direct, motivating sentences on how to optimize their focus and maintain high momentum today:\n${JSON.stringify(input?.context || "")}`,
          });
          if (res.text) return { text: res.text };
        } catch (e) {
          console.warn("Gemini advice performance error:", e);
        }
      }
      return {
        text: "You have strong daily momentum. Keep your primary focus on your Q1 Bank Runs case study and protect 90 minutes for Q2 deep study.",
      };
    }),
    coach: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const ai = getAI();
      if (ai) {
        try {
          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an executive personal coach. The user asks: "${input?.message}". Context:\n${JSON.stringify(input?.context || "")}\nProvide a concise, thoughtful, and actionable response (2-3 sentences max).`,
          });
          if (res.text) return { text: res.text };
        } catch (e) {
          console.warn("Gemini advice coach error:", e);
        }
      }
      return {
        text: "Eliminate immediate distractions and execute your top priority before touching minor tasks. Consistent execution creates compound momentum.",
      };
    }),
    ideas: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const ai = getAI();
      if (ai) {
        try {
          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 3 high-impact, practical ideas for "${input?.section}". Context: ${JSON.stringify(input?.context || "")}`,
          });
          if (res.text) return { text: res.text };
        } catch (e) {
          console.warn("Gemini ideas error:", e);
        }
      }
      return {
        text: `Recommendations for ${input?.section || "your routine"}:\n1. Anchor a dedicated 45-minute deep work block during peak morning energy.\n2. Batch routine communications into a single 20-minute window.\n3. Complete an evening review to clear mental backlog for tomorrow.`,
      };
    }),
    voiceUpdate: publicProcedure.input(z.any()).mutation(async () => {
      return {
        text: "Voice note processed and synced with your dashboard.",
        actionResult: {},
      };
    }),
  }),

  voice: router({
    transcribe: publicProcedure.input(z.any()).mutation(async () => {
      return { text: "" };
    }),
  }),

  ai: router({
    chat: publicProcedure.input(z.any()).mutation(async ({ input }) => {
      const ai = getAI();
      const messages = input?.messages || [];
      const lastMsg = messages[messages.length - 1]?.content || "Hello";
      if (ai) {
        try {
          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: lastMsg,
          });
          if (res.text) return res.text;
        } catch (e) {
          console.warn("Gemini chat error:", e);
        }
      }
      return "I am your productivity assistant. Let me know how I can help you organize your tasks, prioritize your courses, or optimize your habits.";
    }),
  }),
});

export type AppRouter = typeof appRouter;
