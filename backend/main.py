from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import time

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from config import settings

app = FastAPI(title="AI Workflow Automation Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

WorkflowType = Literal["meeting_summary", "email_triage", "data_extraction", "report"]

class RunRequest(BaseModel):
    workflow: WorkflowType
    input: str

class RunResponse(BaseModel):
    workflow: str
    output: str
    tool_calls: list[str]
    duration_ms: int

def get_llm():
    return ChatAnthropic(
        model=settings.MODEL_NAME,
        api_key=settings.ANTHROPIC_API_KEY,
    )

PROMPTS = {
    "meeting_summary": "Summarize these meeting notes into action items, decisions, and key points:\n\n{input}",
    "email_triage":    "Classify this email (priority/category) and draft a reply. Return JSON:\n\n{input}",
    "data_extraction": "Extract all structured data as JSON from:\n\n{input}",
    "report":          "Generate a professional formatted report from:\n\n{input}",
}

@app.get("/")
def root():
    return {"status": "ok", "message": "AI Workflow Agent API"}

@app.get("/workflows")
def list_workflows():
    return {"workflows": list(PROMPTS.keys())}

@app.post("/run", response_model=RunResponse)
async def run_workflow(req: RunRequest):
    start = time.time()
    try:
        llm = get_llm()
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert AI automation agent."),
            ("human", PROMPTS[req.workflow]),
        ])
        chain = prompt | llm
        result = chain.invoke({"input": req.input})
        duration = int((time.time() - start) * 1000)
        return RunResponse(
            workflow=req.workflow,
            output=result.content,
            tool_calls=[req.workflow],
            duration_ms=duration,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "healthy", "model": settings.MODEL_NAME}
