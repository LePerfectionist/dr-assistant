from fastapi import APIRouter

from . import (auth, documents, extraction, validation, chat, admin)


api_router = APIRouter(prefix="/api/v1")

# Include the new routers
api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(extraction.router)
api_router.include_router(validation.router)
api_router.include_router(admin.router)
api_router.include_router(chat.router)
