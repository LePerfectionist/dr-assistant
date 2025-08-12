from fastapi import FastAPI
from .routers import api_router
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from dotenv import load_dotenv
from .database import init_db
from app.routers import requests 
load_dotenv()
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
app = FastAPI(title="GenAI DR Utility")

@app.on_event("startup")
def on_startup():
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(requests.router, prefix="/api/v1")
@app.get("/")
def read_root():
    return {"message": "Welcome to the GenAI DR Utility API"}
