# CV Chatbot

Ask me anything. Powered by Asaf Rubin's CV, professional history, and biography.

This is a public chatbot that answers recruiter-style questions about Asaf Rubin's background, experience, skills, research, and interests in a deliberately human voice.

## What It Does

- Answers questions about education, career history, projects, research, and professional interests
- Grounds answers on Markdown/text files in `data/`
- Selects the most relevant sections of the training document per question to keep responses fast
- Refuses to invent unsupported facts
- Runs locally with Node's built-in HTTP server and deploys cleanly to Vercel serverless functions

## Tech

- Static HTML/CSS/JS frontend in `public/index.html`
- Shared chat logic in `lib/chat.js`
- Vercel API function in `api/chat.js`
- Local HTTP server in `server.js`
- OpenAI Responses API, defaulting to `gpt-5.4-mini`

## Local Run

```bash
git clone https://github.com/asafrubin00/asaf-cv-chatbot.git
cd asaf-cv-chatbot
npm install
cp .env.example .env
npm run dev
```

Set `OPENAI_API_KEY` in `.env` before chatting locally.

## Vercel Deploy

1. Import the repository into Vercel.
2. Add `OPENAI_API_KEY` as a production environment variable.
3. Optionally set `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `OPENAI_TEXT_VERBOSITY`, and `OPENAI_MAX_OUTPUT_TOKENS`.
4. Deploy.

## Updating Asaf's Information

Replace, edit, or add Markdown/text files in `data/`, for example:

- `data/bio.md`
- `data/cv.md`
- `data/cv-product.md`
- `data/cv-strategy.md`

If there are multiple CV versions, keep the filenames and headings clear so the chatbot can distinguish positioning language from shared facts.
