from fastapi import APIRouter

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/")
def create_order():
    pass

@router.get("/{order_id}")
def get_order(order_id: int):
    pass

@router.get("/user/{user_id}")
def get_user_orders(user_id: int):
    pass