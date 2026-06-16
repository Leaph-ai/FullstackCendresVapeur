from fastapi import APIRouter

router = APIRouter(
    prefix="/discounts",
    tags=["Discounts"]
)

@router.get("/")
def get_discount_codes():
    pass

@router.get("/{code}")
def get_discount_code(code: str):
    pass

@router.post("/")
def create_discount_code():
    pass
