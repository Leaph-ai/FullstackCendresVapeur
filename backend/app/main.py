import asyncio
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth.router import router as auth_router
from app.config import get_settings
from app.air.ticker import run_air_ticker
from app.copper.ticker import run_copper_ticker
from app.errors.handlers import register_error_handlers
from app.routes import air, carts, categories, chat, contact, copper, discounts, dev_mail, orders, products, users, votes, files

from app.logs.router import router as logs_router

settings = get_settings()

Path("uploads").mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    copper_task = asyncio.create_task(run_copper_ticker(settings))
    air_task = asyncio.create_task(run_air_ticker(settings))
    yield
    for task in (copper_task, air_task):
        task.cancel()
    for task in (copper_task, air_task):
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Cendres et Vapeur API", lifespan=lifespan)

register_error_handlers(app)

app.include_router(logs_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)

class TypePayload(BaseModel):
    content: str


@app.get("/")
def read_root():
    return {"message": "API Cendres et Vapeur opérationnelle"}


@app.post("/getdata")
async def create_secret(payload: TypePayload):
    with open("output_file.txt", "a") as f:
        now = datetime.now()
        f.write(f"{now.strftime('%d/%m/%Y %H:%M')} : {payload.content}\n")
    return payload


app.include_router(products.router)
app.include_router(users.router)
app.include_router(carts.router)
app.include_router(orders.router)
app.include_router(discounts.router)
app.include_router(dev_mail.router)
app.include_router(votes.router)
app.include_router(chat.router)
app.include_router(copper.router)
app.include_router(air.router)
app.include_router(files.router)
app.include_router(categories.router)
app.include_router(contact.router)
