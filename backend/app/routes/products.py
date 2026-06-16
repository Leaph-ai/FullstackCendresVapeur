from fastapi import APIRouter

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("/")
def get_products():
    pass

@router.get("/{product_id}")
def get_product(product_id: int):
    pass

@router.post("/")
def create_product():
    pass

@router.put("/{product_id}")
def update_product(product_id: int):
    pass

@router.delete("/{product_id}")
def delete_product(product_id: int):
    pass