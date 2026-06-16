from fastapi import APIRouter

router = APIRouter(
    prefix="/carts",
    tags=["Carts"]
)

@router.get("/{user_id}")
def get_cart(user_id: int):
    pass

@router.post("/{user_id}/items")
def add_item(user_id: int):
    pass

@router.delete("/{user_id}/items/{item_id}")
def remove_item(
    user_id: int,
    item_id: int
):
    pass