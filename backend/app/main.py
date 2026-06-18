from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth.router import router as auth_router
from app.config import get_settings
from app.routes import carts, discounts, dev_mail, orders, products, votes

settings = get_settings()

app = FastAPI(title="Cendres et Vapeur API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(carts.router)
app.include_router(orders.router)
app.include_router(discounts.router)
app.include_router(dev_mail.router)
app.include_router(votes.router)
