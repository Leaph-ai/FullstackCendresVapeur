from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.carts.schemas import CartItemCreate, CartResponse
from app.errors.codes import ErrorCode
from app.errors.exceptions import AppError
from models.cart import Cart
from models.cart_item import CartItem
from models.product import Product

EDITOR_ROLE_LEVEL = 2


class CartService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_cart(
        self,
        user_id: int,
        requesting_user_id: int,
        role_level: int,
    ) -> CartResponse:
        self._ensure_cart_access(user_id, requesting_user_id, role_level)

        cart = (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(Cart.user_id == user_id)
            .first()
        )
        if cart is None:
            return CartResponse(user_id=user_id, items=[])
        return cart

    def add_item(
        self,
        user_id: int,
        payload: CartItemCreate,
        requesting_user_id: int,
        role_level: int,
    ) -> CartResponse:
        self._ensure_cart_access(user_id, requesting_user_id, role_level)

        product = self.db.query(Product).filter(Product.id == payload.product_id).first()
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produit introuvable.",
            )

        cart = self._get_or_create_cart(user_id)
        existing_item = (
            self.db.query(CartItem)
            .filter(
                CartItem.cart_id == cart.id,
                CartItem.product_id == payload.product_id,
            )
            .first()
        )

        new_quantity = payload.quantity
        if existing_item is not None:
            new_quantity = existing_item.quantity + payload.quantity

        if new_quantity > product.stock:
            raise AppError.bad_request(
                ErrorCode.INSUFFICIENT_STOCK,
                (
                    f"Stock insuffisant pour « {product.name} » "
                    f"(demandé : {new_quantity}, disponible : {product.stock})."
                ),
            )

        if existing_item is not None:
            existing_item.quantity = new_quantity
        else:
            self.db.add(
                CartItem(
                    cart_id=cart.id,
                    product_id=payload.product_id,
                    quantity=payload.quantity,
                )
            )

        self.db.commit()
        return self.get_cart(user_id, requesting_user_id, role_level)

    def update_item_quantity(
        self,
        user_id: int,
        item_id: int,
        quantity: int,
        requesting_user_id: int,
        role_level: int,
    ) -> CartResponse:
        self._ensure_cart_access(user_id, requesting_user_id, role_level)

        cart = self.db.query(Cart).filter(Cart.user_id == user_id).first()
        if cart is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Panier introuvable.",
            )

        item = (
            self.db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.cart_id == cart.id)
            .first()
        )
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article introuvable dans le panier.",
            )

        product = item.product
        if product is not None and quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Stock insuffisant pour « {product.name} » "
                    f"(demandé : {quantity}, disponible : {product.stock})."
                ),
            )

        item.quantity = quantity
        self.db.commit()
        return self.get_cart(user_id, requesting_user_id, role_level)

    def remove_item(
        self,
        user_id: int,
        item_id: int,
        requesting_user_id: int,
        role_level: int,
    ) -> CartResponse:
        self._ensure_cart_access(user_id, requesting_user_id, role_level)

        cart = self.db.query(Cart).filter(Cart.user_id == user_id).first()
        if cart is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Panier introuvable.",
            )

        item = (
            self.db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.cart_id == cart.id)
            .first()
        )
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article introuvable dans le panier.",
            )

        self.db.delete(item)
        self.db.commit()
        return self.get_cart(user_id, requesting_user_id, role_level)

    def _get_or_create_cart(self, user_id: int) -> Cart:
        cart = self.db.query(Cart).filter(Cart.user_id == user_id).first()
        if cart is not None:
            return cart

        cart = Cart(user_id=user_id)
        self.db.add(cart)
        self.db.flush()
        return cart

    def _ensure_cart_access(
        self,
        user_id: int,
        requesting_user_id: int,
        role_level: int,
    ) -> None:
        if user_id != requesting_user_id and role_level < EDITOR_ROLE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé à ce panier.",
            )
