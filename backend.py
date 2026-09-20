import os
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI

load_dotenv()

app = FastAPI(title="CoopSkill Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    user_context: Dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/chat")
def chat_with_skill_bot(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Set it before starting the chatbot API.",
        )

    user_context = payload.user_context or {}
    context_summary = ""

    if user_context:
        context_summary = (
            "User context:\n"
            + "\n".join(
                f"- {key}: {value}"
                for key, value in user_context.items()
            )
            + "\n"
        )

    system_prompt = (
        "You are a skill-coaching chatbot for a learning platform. "
        "Give helpful, concise, and encouraging responses. "
        "Use the user context to personalize the advice. "
        "Focus on skill gaps, strengths, next learning steps, and course recommendations. "
        "Do not claim to know personal private data beyond the provided context.\n\n"
        f"{context_summary}"
    )

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload.message},
        ],
        temperature=0.7,
        max_tokens=500,
    )

    reply = completion.choices[0].message.content.strip()
    return {"reply": reply}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)
