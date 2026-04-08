from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import recommendations

load_dotenv()

app = FastAPI(
    title="Marketplace ML Service",
    description="Collaborative Filtering Recommendation Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router, tags=["recommendations"])


@app.get("/")
async def root():
    return {"service": "marketplace-ml", "status": "running"}
