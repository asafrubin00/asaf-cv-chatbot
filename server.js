const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Simple in-memory conversation store (per process)
const conversations = new Map();
const MAX_TURNS = 10;

function getHistory(sessionId) {
  if (!conversations.has(sessionId)) conversations.set(sessionId, []);
  return conversations.get(sessionId);
}

function loadDocs() {
app.get("/_debug/docs", (req, res) => {
  res.json(loadDocs());
});

  const cv = fs.existsSync("./data/cv.md") ? fs.readFileSync("./data/cv.md", "utf8") : "";
  const bio = fs.existsSync("./data/bio.md") ? fs.readFileSync("./data/bio.md", "utf8") : "";
  return { cv, bio };
}

function systemPrompt({ cv, bio }) {
  return `
You are Asaf Rubin speaking in FIRST PERSON ("I").

You must answer recruiter questions using ONLY the information contained in the documents below.
When the user asks for factual details (dates, titles, employers, education, locations, responsibilities, achievements):
- Include a short line at the end: "Evidence: …" with 1–2 brief quotes copied verbatim from the CV/BIO.
- If you cannot find supporting text in the CV/BIO, say you can't verify it from the documents and ask ONE clarifying question.
- Do not guess or infer missing dates/titles.
If the answer is not supported by the documents, you MUST say so clearly (in my voice) and then:
- offer what you CAN say based on the documents, and/or
- ask a single helpful follow-up question to get the missing info.

Do NOT invent facts, dates, titles, employers, achievements, locations, or skills.
If uncertain, say you are uncertain.

Tone / voice:
- Default to concise, clear answers (2–4 short paragraphs max).
- Dry, understated humour is welcome, but do not ramble.
- Expand only if the question clearly invites depth.
- Avoid corporate buzzword soup. Avoid sounding like customer support.
- If the user asks for a short answer, be genuinely short.

Documents:

[CV]
${cv}

[BIO]
${bio}
`.trim();
}

app.post("/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ reply: "Server error: missing OPENROUTER_API_KEY." });
    }

    const userQuestion = (req.body && req.body.message ? String(req.body.message) : "").trim();
    const sessionId = req.headers["x-session-id"] || "default";
    const history = getHistory(sessionId);

// append user message
history.push({ role: "user", content: userQuestion });
// keep only last MAX_TURNS turns (user + assistant)
if (history.length > MAX_TURNS * 2) {
  history.splice(0, history.length - MAX_TURNS * 2);
}

    if (!userQuestion) {
      return res.json({ reply: "Give me a question and I’ll do my best not to embarrass us." });
    }

    const { cv, bio } = loadDocs();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional but recommended by OpenRouter for attribution/analytics:
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Asaf CV Chatbot",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
       { role: "system", content: systemPrompt({ cv, bio }) },
       ...history,
       ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({
        reply: `OpenRouter error (${response.status}). Raw response:\n${errText}`,
      });
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I got a response back, but it was oddly empty. A rare moment of silence for me.";
      history.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ reply: `Server error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
