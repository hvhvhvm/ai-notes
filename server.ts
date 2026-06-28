import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ai-notes-saicharanreddykandi-7709s-projects.vercel.app"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());

// Increase body parser limits for base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure DB file exists with beautiful sample data on first start
interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 representation or raw string
}

interface Note {
  id: string;
  title: string;
  content: string;
  folder: string; // 'College' | 'AI' | 'Startup' | 'Fitness' | 'Travel' | 'Uncategorized'
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  userId?: string;
}

interface DB {
  notes: Note[];
}

const SAMPLE_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Quantum Physics & Wave Mechanics",
    content: `# Lecture 3: Wave-Particle Duality and Schrödinger Equation

Welcome to the physics study notes. This document contains key derivations and summaries for the upcoming mid-term exam.

## 1. De Broglie Wavelength
The wave-particle duality is expressed by:
$$\\lambda = \\frac{h}{p}$$
where:
* $h$ is Planck's constant ($6.626 \\times 10^{-34}\\text{ J s}$)
* $p$ is the momentum ($mv$)

## 2. Schrödinger Wave Equation
The time-independent Schrödinger equation is:
$$\\hat{H}\\psi = E\\psi$$

Or in position space:
$$-\\frac{\\hbar^2}{2m} \\frac{d^2\\psi}{dx^2} + V(x)\\psi = E\\psi$$

### Important Postulates:
1. The wave function $\\psi(x)$ must be single-valued, continuous, and normalizable.
2. The probability of finding a particle in the interval $[a, b]$ is given by:
   $$P = \\int_{a}^{b} |\\psi(x)|^2 dx$$

## 3. Exam Topics to Focus On:
- [x] Derivation of Infinite Square Well energy levels
- [ ] Quantum tunneling coefficients
- [x] Normalization of gaussian wave packets
- [ ] Harmonic Oscillator ladder operators

Feel free to ask the AI Knowledge Assistant to summarize these notes or generate a practice quiz!`,
    folder: "College",
    favorite: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    attachments: [
      {
        id: "att-1",
        name: "Syllabus_Physics301.txt",
        type: "text/plain",
        size: 432,
        data: "Course: PHYS 301 - Quantum Mechanics I\nInstructor: Dr. Angela Vance\nOffice Hours: Mon/Wed 2-4 PM\n\nWeekly Topics:\nWeek 1: Experimental Origins of Quantum Mechanics\nWeek 2: Wave Mechanics and Wave Functions\nWeek 3: Schrödinger Equation & Infinite Wells\nWeek 4: Quantum Harmonic Oscillator\nWeek 5: Mid-term Examination (July 15)\n\nGrading Criteria:\nHomework: 30%\nMid-term: 35%\nFinal Project: 35%"
      }
    ]
  },
  {
    id: "note-2",
    title: "AI Agent Architecture with LLMs",
    content: `# Core Patterns of Autonomous AI Agents

AI Agents go beyond simple prompt-response loops. They employ planning, memory, and tool usage to execute complex workflows.

## 1. The Agent Loop
An agent consists of three fundamental layers:
1. **Planning**: Decomposing complex tasks into smaller sub-goals (e.g., Chain of Thought, ReAct).
2. **Memory**: Short-term (in-context conversation) and Long-term (retrieval-augmented vector storage).
3. **Tools**: External APIs, code execution runtimes, search engines, and document readers.

\`\`\`
   +------------------+
   |   User Prompt    |
   +--------+---------+
            |
            v
   +--------+---------+      +-------------------+
   |   Planning &     | <---> |  Memory           |
   |   Reasoning Loop |      |  (Short/Long term)|
   +--------+---------+      +-------------------+
            |
            +------------+
            |            |
            v            v
      +-----+----+  +----+----+
      | Tool Use |  | Final   |
      | (APIs)   |  | Answer  |
      +----------+  +---------+
\`\`\`

## 2. ReAct Framework
ReAct (Reasoning and Acting) structures the agent prompt as:
- **Thought**: The reasoning step explaining what the agent is doing.
- **Action**: The specific tool call to execute.
- **Observation**: The output returned by the tool.

## 3. Current State of the Art
* **LangGraph**: Stateful, multi-agent orchestrator.
* **AutoGPT / CrewAI**: Multi-agent workspaces where specialists collaborate on user tasks.
* **Tool Calling**: Native JSON output support by models like Gemini 3.5.`,
    folder: "AI",
    favorite: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    attachments: []
  },
  {
    id: "note-3",
    title: "SaaS Launch Checklist",
    content: `# Memora Startup Execution Plan

Detailed timeline for shipping the product to beta testers and preparing the Product Hunt launch.

## Phase 1: MVP Hardening
- [x] Complete local persistence model
- [x] Implement rich text markdown editor with markdown rendering
- [x] Add floating AI Knowledge Assistant drawer
- [ ] Connect multi-workspace organization folders
- [ ] Deploy test container on Cloud Run

## Phase 2: Landing Page & Lead Gen
* **Pitch Deck**: Simple 10-slide deck summarizing the AI knowledge base concept.
* **Slogan**: *"Every note is an interactive AI-powered second brain."*
* **Pricing Models**:
  - **Free Tier**: 5 active notes, 10 AI queries/day.
  - **Premium Tier**: Unlimited notes, 20MB attachments, unlimited Gemini-3.5 queries ($9/mo).

## Phase 3: Launch Strategy
1. **Hacker News**: Post an elegant "Show HN: Memora" thread detailing our tech stack.
2. **Product Hunt**: Launch on a Tuesday at 12:01 AM PST.
3. **Twitter/X**: Share short screen recordings demonstrating drag-and-drop PDF attachments and rapid AI flashcard creation.`,
    folder: "Startup",
    favorite: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    attachments: []
  },
  {
    id: "note-4",
    title: "Kyoto Itinerary & Travel Prep",
    content: `# Kyoto Exploration Guide: Autumn 2026

Notes on historical sights, local dining, and transportation options for our 5-day stay.

## 1. Sights to See
* **Fushimi Inari Shrine**: Early morning visit to beat the crowds (6:30 AM arrival).
* **Kinkaku-ji (Golden Pavilion)**: Golden hour photography (around 4:00 PM).
* **Arashiyama Bamboo Grove**: Beautiful scenery, includes walk through Tenryu-ji temple.
* **Gion District**: Walk in the late evening, look for traditional tea houses.

## 2. Packing Essentials
- [ ] Pasmo/Suica card loaded on phone
- [ ] Comfortable walking shoes (target: 20,000 steps/day)
- [ ] Lightweight rain jacket
- [ ] Japanese electrical adapter (flat 2-pin)

## 3. Traditional Food List
- [x] Kyoto-style Kaiseki dinner (Pre-booked at Gion Karyo)
- [ ] Fresh Matcha in Uji
- [ ] Yudofu (Simmered tofu specialty)
- [ ] Nishiki Market street snacks`,
    folder: "Travel",
    favorite: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    attachments: []
  }
];

let memoryDB: DB | null = null;

function readDB(): DB {
  if (memoryDB) {
    return memoryDB;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      memoryDB = JSON.parse(content);
      return memoryDB!;
    }
  } catch (err) {
    console.error("Error reading database file, resetting to samples:", err);
  }
  
  // Initialize with sample notes
  const initialDB: DB = { notes: SAMPLE_NOTES };
  writeDB(initialDB);
  memoryDB = initialDB;
  return initialDB;
}

function writeDB(data: DB) {
  memoryDB = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Lazy loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel in the Settings menu of the AI Studio UI.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Initialize Supabase admin/auth helper for token validation on backend
const supabaseUrl = (process.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const hasBackendSupabase = 
  !!supabaseUrl && 
  supabaseUrl !== "https://your-project.supabase.co" && 
  !!supabaseAnonKey && 
  supabaseAnonKey !== "your-anon-key";

const backendSupabase = hasBackendSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Middleware to authenticate requests
const authenticateUser = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Allow CORS preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized access. Please log in."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Missing authentication token"
    });
  }

  if (backendSupabase) {
    try {
      const {
        data: { user },
        error,
      } = await backendSupabase.auth.getUser(token);

      if (error || !user) {
        if (token.startsWith("usr-")) {
          (req as any).userId = token;
          (req as any).userEmail =
            token === "usr-demo"
              ? "demo@memora.ai"
              : "user@example.com";
          return next();
        }

        return res.status(401).json({
          error: "Invalid session or login credentials"
        });
      }

      (req as any).userId = user.id;
      (req as any).userEmail = user.email;

      return next();

    } catch (err) {
      console.error(err);
      return res.status(401).json({
        error: "Authentication check failed"
      });
    }
  } else {
    (req as any).userId = token;
    (req as any).userEmail =
      token === "usr-demo"
        ? "demo@memora.ai"
        : "user@example.com";

    return next();
  }
};
// REST API Endpoints

// 1. Get all notes
app.get("/api/notes", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  
  // Filter notes that belong to this user
  let userNotes = db.notes.filter((n) => n.userId === userId);
  
  // If user has no notes, seed them with personal copies of sample notes
  if (userNotes.length === 0) {
    const userSamples = SAMPLE_NOTES.map((sample) => ({
      ...sample,
      id: `note-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    db.notes.push(...userSamples);
    writeDB(db);
    userNotes = userSamples;
  }
  
  res.json(userNotes);
});

// 2. Get single note
app.get("/api/notes/:id", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const note = db.notes.find((n) => n.id === req.params.id && n.userId === userId);
  if (!note) {
    return res.status(404).json({ error: "Note not found or unauthorized" });
  }
  res.json(note);
});

// 3. Create new note
app.post("/api/notes", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const { title, content, folder } = req.body;
  const newNote: Note = {
    id: `note-${Date.now()}`,
    title: title || "Untitled Note",
    content: content || "",
    folder: folder || "Uncategorized",
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: [],
    userId: userId
  };
  db.notes.unshift(newNote);
  writeDB(db);
  res.status(201).json(newNote);
});

// 4. Update note (Autosave endpoint)
app.put("/api/notes/:id", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const noteIndex = db.notes.findIndex((n) => n.id === req.params.id && n.userId === userId);
  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found or unauthorized" });
  }

  const existingNote = db.notes[noteIndex];
  const { title, content, folder, favorite } = req.body;

  db.notes[noteIndex] = {
    ...existingNote,
    title: title !== undefined ? title : existingNote.title,
    content: content !== undefined ? content : existingNote.content,
    folder: folder !== undefined ? folder : existingNote.folder,
    favorite: favorite !== undefined ? favorite : existingNote.favorite,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json(db.notes[noteIndex]);
});

// 5. Delete note
app.delete("/api/notes/:id", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const initialLength = db.notes.length;
  
  db.notes = db.notes.filter((n) => !(n.id === req.params.id && n.userId === userId));
  
  if (db.notes.length === initialLength) {
    return res.status(404).json({ error: "Note not found or unauthorized" });
  }

  writeDB(db);
  res.json({ success: true, message: "Note deleted successfully" });
});

// 6. Upload attachment
app.post("/api/notes/:id/attachments", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const noteIndex = db.notes.findIndex((n) => n.id === req.params.id && n.userId === userId);
  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found or unauthorized" });
  }

  const { name, type, size, data } = req.body;
  if (!name || !type || !data) {
    return res.status(400).json({ error: "Missing attachment fields (name, type, data)" });
  }

  const newAttachment: Attachment = {
    id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    type,
    size: size || 0,
    data
  };

  db.notes[noteIndex].attachments.push(newAttachment);
  db.notes[noteIndex].updatedAt = new Date().toISOString();
  writeDB(db);

  res.status(201).json(newAttachment);
});

// 7. Delete attachment
app.delete("/api/notes/:id/attachments/:attachmentId", authenticateUser, (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const noteIndex = db.notes.findIndex((n) => n.id === req.params.id && n.userId === userId);
  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found or unauthorized" });
  }

  const initialCount = db.notes[noteIndex].attachments.length;
  db.notes[noteIndex].attachments = db.notes[noteIndex].attachments.filter(
    (att) => att.id !== req.params.attachmentId
  );

  if (db.notes[noteIndex].attachments.length === initialCount) {
    return res.status(404).json({ error: "Attachment not found" });
  }

  db.notes[noteIndex].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, message: "Attachment deleted" });
});

// 8. AI Chat & Query proxy route
app.post("/api/notes/:id/ask-ai", authenticateUser, async (req, res) => {
  const db = readDB();
  const userId = (req as any).userId;
  const note = db.notes.find((n) => n.id === req.params.id && n.userId === userId);
  if (!note) {
    return res.status(404).json({ error: "Note not found or unauthorized" });
  }

  const { message, quickAction, chatHistory } = req.body;
  if (!message && !quickAction) {
    return res.status(400).json({ error: "Message or quick action required" });
  }

  try {
    const ai = getGeminiClient();

    // Compile document attachments for context
    let attachmentsContext = "";
    const textAttachments = note.attachments.filter(
      (att) => att.type.startsWith("text/") || att.name.endsWith(".txt") || att.name.endsWith(".md")
    );

    textAttachments.forEach((att) => {
      // Decode base64 if it's text data
      let rawText = "";
      try {
        if (att.data.includes("base64,")) {
          rawText = Buffer.from(att.data.split("base64,")[1], "base64").toString("utf-8");
        } else {
          rawText = att.data;
        }
      } catch (e) {
        rawText = "[Unreadable text attachment]";
      }
      attachmentsContext += `\n--- ATTACHMENT FILENAME: ${att.name} ---\n${rawText}\n`;
    });

    // Prepare media files (images) to pass as inline data to Gemini-3.5-flash
    const imageAttachments = note.attachments.filter((att) => att.type.startsWith("image/"));
    const imageParts = imageAttachments.map((att) => {
      let base64Data = "";
      if (att.data.includes("base64,")) {
        base64Data = att.data.split("base64,")[1];
      } else {
        base64Data = att.data;
      }
      return {
        inlineData: {
          mimeType: att.type,
          data: base64Data
        }
      };
    });

    // Determine target system instruction based on role
    const systemInstruction = `You are "Memora Knowledge Assistant", an advanced, friendly, and precise AI companion built inside Memora.
Your purpose is to help the user master their knowledge by answering questions, summarizing information, and generating custom learning aids (such as flashcards, study notes, or quizzes) exclusively based on the provided Note and its attached files.

### CURRENT CONTEXT NOTE:
- Title: ${note.title}
- Folder: ${note.folder}
- Note Content:
"""
${note.content}
"""

### ASSOCIATED ATTACHMENTS (TEXT CONTENT):
${attachmentsContext || "No text attachments associated with this note."}

### INSTRUCTIONS:
1. Ground your knowledge in the Note Content and Attachments context provided above.
2. If the user asks about attached images, they are supplied inline. Analyze and reference them.
3. Be professional, direct, elegant, and format all mathematical equations, tables, code blocks, checklists, or summaries in beautiful Markdown.
4. If a quick action is requested (e.g. summarizing, explaining, creating flashcards), format the output with strong visual hierarchy so it looks like a premium study card or study guide.
5. If the answer cannot be found in the note or its attachments, politely state that, but offer the best logical answer or connection using general reasoning while keeping the primary focus on the provided note.`;

    let finalPrompt = "";
    if (quickAction) {
      switch (quickAction) {
        case "Summarize":
          finalPrompt = "Please generate an elegant executive summary of this note. Use key bullet points, highlight central concepts, and present a modern, easily scannable layout.";
          break;
        case "Explain":
          finalPrompt = "Explain the complex concepts in this note simply and clearly, breaking them down into digestible blocks with examples as if teaching a student.";
          break;
        case "Rewrite":
          finalPrompt = "Please rewrite or polish the notes content to make it highly professional, structured, and cohesive, maintaining all critical information but improving the flow, syntax, and clarity.";
          break;
        case "Create Flashcards":
          finalPrompt = "Generate a set of premium, high-impact Q&A Study Flashcards from this note. Format each flashcard clearly (e.g., 'Card 1: Front: ... | Back: ...') so the user can easily study them.";
          break;
        case "Generate Quiz":
          finalPrompt = "Generate an interactive study quiz based on this note. Include 4-5 multiple choice or short answer questions. Do not show the answers immediately, put them at the absolute bottom or invite the user to answer.";
          break;
        case "Create Study Notes":
          finalPrompt = "Create structured, beautifully formatted Study Notes with a glossary of key terms, core equations/concepts, and a quick reference index based on this file.";
          break;
        case "Best Exam Answer":
          finalPrompt = "Analyze the key scientific or semantic arguments in this note and construct the absolute best academic exam answer or essay response summarizing these points perfectly.";
          break;
        case "Find Information":
          finalPrompt = "Extract and list all discrete facts, figures, websites, citations, or action items found inside this note and its attachments in a clean table format.";
          break;
        case "Explain Images":
          if (imageAttachments.length === 0) {
            finalPrompt = "The user wants to analyze images in this note, but no image attachments are currently found. Tell the user how to drag-and-drop or upload images to this note so you can analyze them.";
          } else {
            finalPrompt = "Please explain and detail the contents of the attached images, and explain how they relate to the overall theme of this note.";
          }
          break;
        default:
          finalPrompt = `Please perform this specific operation: ${quickAction}`;
      }
    } else {
      finalPrompt = message;
    }

    // Build chat structure if history is available, or do a direct multimodal generation
    // Since we want to support both text and images dynamically, let's build the contents parameter
    const contents: any[] = [];
    
    // Add past history if present and if we're not doing a standalone quick action
    if (chatHistory && chatHistory.length > 0 && !quickAction) {
      chatHistory.forEach((msg: { role: string; content: string }) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add the current prompt and any inline image attachments to the final user message
    const currentParts: any[] = [{ text: finalPrompt }];
    
    // Feed images directly to the parts array for multimodal analysis
    imageParts.forEach((part) => {
      currentParts.push(part);
    });

    contents.push({
      role: "user",
      parts: currentParts
    });

    // Execute generateContent using the correct SDK pattern
    // Execute generateContent using the correct SDK pattern
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });
    console.log("Gemini Response:", response);

    // FIX: Access response.text directly as a string property
    res.json({
      reply: response.text || "I was unable to generate a response.",
      actionUsed: quickAction || null
    });

  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred in the Memora Knowledge Assistant server.",
      details: error.stack
    });
  }
});


// Set up Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Memora] Express server running at http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
