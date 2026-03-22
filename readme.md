# ⚡ AI Workflow Automation Agent

I built this because I wanted to understand how tools like n8n and Zapier actually work under the hood — so I built one from scratch.

It's a visual workflow canvas where each node is a real AI-powered step. You connect them together and the agent figures out what to do — summarize a meeting, triage emails, extract data from documents, generate reports — all powered by Claude AI.

---

## What it looks like

A drag-and-drop canvas with animated pipelines. Each node lights up as it runs, and you can watch the AI reasoning stream in real time in the log panel on the right.

---

## Workflows I built

**Meeting Summary** — paste in raw meeting notes, get back a clean breakdown of action items, decisions, and key discussion points. No more re-reading 2-hour transcripts.

**Email Triage** — drop in an email, the agent classifies it by priority, figures out what category it falls into, and drafts a reply. Useful when you have 200 unread emails.

**Data Extraction** — give it any unstructured text (invoices, reports, web pages) and it pulls out structured JSON. No regex, no manual parsing.

**Report Generator** — feed it raw data and it writes a proper formatted report. Saves hours of copy-pasting numbers into slides.

---

## How it works
```
input → LLM reasoning → tool selection → API call → response
```

The frontend is a React canvas built with SVG — no external diagramming library, everything is hand-rolled. The backend is a FastAPI server that runs LangChain chains and calls Claude AI.

---

## Tech stack

- **Frontend** — React 18, Vite, SVG canvas
- **Backend** — Python, FastAPI, LangChain
- **AI** — Claude (Anthropic) via LangChain
- **Pattern** — ReAct agent loop, n8n-style node pipeline

---

## Running it locally

You'll need an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
```bash
# Backend
cd backend
pip install -r requirements.txt
# add ANTHROPIC_API_KEY to .env
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` and hit **▶ RUN WORKFLOW**.

---

## What I learned

Building this taught me how agent loops actually work — the LLM doesn't just answer questions, it reasons about what tool to use, calls it, observes the result, and decides what to do next. That feedback loop is what makes it feel intelligent rather than just autocomplete.

Also spent way too long fighting Windows PATH issues. But that's a story for another day.