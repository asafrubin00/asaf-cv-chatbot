# Asaf CV Chatbot

A small public chatbot that answers questions about Asaf Rubin using **only** a CV + bio knowledge base (with a deliberately human voice).

**Live demo:** https://asaf-cv-chatbot.onrender.com

## What it does
- Answers recruiter-style questions (experience, education, skills, interests)
- Grounds answers on local files: `data/cv.md` and `data/bio.md`
- Avoids making things up when the info isn’t present

## Tech
- Node.js + Express
- OpenRouter (LLM API)
- Render for hosting

## Local run
```bash
npm install
node server.js

