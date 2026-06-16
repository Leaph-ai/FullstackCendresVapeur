from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.routes import products, carts, orders, discounts

# Création de l'application
app = FastAPI(
    title="Cendres et Vapeur API"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# Schema de test
# ==========================

class TypePayload(BaseModel):
    content: str

# ==========================
# Routes de test
# ==========================

@app.get("/")
def read_root():
    return {
        "message": "API Cendres et Vapeur opérationnelle"
    }

@app.post("/getdata")
async def create_secret(payload: TypePayload):

    with open("output_file.txt", "a") as f:
        now = datetime.now()
        f.write(
            f"{now.strftime('%d/%m/%Y %H:%M')} : {payload.content}\n"
        )

    return payload

# ==========================
# Routers Ecommerce
# ==========================

app.include_router(products.router)
app.include_router(carts.router)
app.include_router(orders.router)
app.include_router(discounts.router)