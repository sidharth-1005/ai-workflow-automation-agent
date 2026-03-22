import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    MODEL_NAME = os.getenv("MODEL_NAME", "claude-haiku-4-5-20251001")

settings = Settings()

print("API KEY LOADED:", settings.ANTHROPIC_API_KEY[:10] if settings.ANTHROPIC_API_KEY else "EMPTY!")