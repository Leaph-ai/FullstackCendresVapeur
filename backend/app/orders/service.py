import logging
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.config import Settings
from app.logs.service import LogService
from app.orders.schemas import OrderCreate
from app.services.mail import send_email
from models.cart import Cart
from models.cart_item import CartItem
from models.discount_code import DiscountCode
from models.order import Order
from models.order_item import OrderItem

ORDER_STATUS_PENDING = "pending"
EDITOR_ROLE_LEVEL = 2

logger = logging.getLogger(__name__)


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class OrderService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    def create_order(self, user_id: int, payload: OrderCreate) -> Order:
        cart = (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(Cart.user_id == user_id)
            .first()
        )
        if cart is None or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Panier vide.",
            )

        for item in cart.items:
            if item.product is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Produit {item.product_id} introuvable.",
                )
            if item.quantity > item.product.stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Stock insuffisant pour « {item.product.name} » "
                        f"(demandé : {item.quantity}, disponible : {item.product.stock})."
                    ),
                )

        subtotal = Decimal("0")
        for item in cart.items:
            unit_price = Decimal(str(item.product.price))
            subtotal += unit_price * item.quantity

        discount_code = None
        if payload.discount_code is not None:
            discount_code = (
                self.db.query(DiscountCode)
                .filter(DiscountCode.code == payload.discount_code.upper())
                .first()
            )
            if discount_code is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Code de réduction introuvable.",
                )
            if not discount_code.active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Code de réduction inactif.",
                )

        total_amount = subtotal
        if discount_code is not None:
            percentage = Decimal(str(discount_code.percentage))
            total_amount = _money(subtotal * (Decimal("1") - percentage / Decimal("100")))

        order = Order(
            user_id=user_id,
            discount_code_id=discount_code.id if discount_code else None,
            total_amount=total_amount,
            status=ORDER_STATUS_PENDING,
        )
        self.db.add(order)
        self.db.flush()

        for item in cart.items:
            unit_price = Decimal(str(item.product.price))
            self.db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                )
            )
            item.product.stock -= item.quantity

        for item in list(cart.items):
            self.db.delete(item)

        self.db.commit()
        order = self._fetch_order(order.id)
        try:
            LogService(self.db).add_log(
                user_id,
                f"commande: #{order.id} passée — {order.total_amount} ⚙",
            )
        except Exception:  # noqa: BLE001 — le logging ne doit jamais casser la commande
            logger.exception("Échec d'écriture du log de la commande %s", order.id)
        self._send_confirmation_email(order)
        return order

    def get_order(self, order_id: int, requesting_user_id: int, role_level: int) -> Order:
        order = self._fetch_order(order_id)
        self._ensure_order_access(order, requesting_user_id, role_level)
        return order

    def list_user_orders(
        self,
        user_id: int,
        requesting_user_id: int,
        role_level: int,
    ) -> list[Order]:
        if user_id != requesting_user_id and role_level < EDITOR_ROLE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé aux commandes de cet utilisateur.",
            )
        return (
            self.db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
            .all()
        )

    def delete_order(self, order_id: int, role_level: int) -> None:
        if role_level < EDITOR_ROLE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès réservé aux éditeurs et administrateurs.",
            )

        order = self._fetch_order(order_id)
        for item in order.items:
            if item.product is not None:
                item.product.stock += item.quantity

        self.db.delete(order)
        self.db.commit()

    def _send_confirmation_email(self, order: Order) -> None:
        if order.user is None:
            logger.warning(
                "Impossible d'envoyer la confirmation de commande %s : utilisateur introuvable.",
                order.id,
            )
            return

        try:
            send_email(
                self.settings,
                to=order.user.email,
                subject=f"Confirmation de commande #{order.id} — Cendres & Vapeur",
                body=self._build_confirmation_email_body(order),
            )
        except Exception:
            logger.exception(
                "Échec de l'envoi de la confirmation de commande %s à %s.",
                order.id,
                order.user.email,
            )

    def _build_confirmation_email_body(self, order: Order) -> str:
        lines = [
            "Merci pour votre commande !",
            "",
            f"Numéro de commande : #{order.id}",
            f"Statut : {order.status}",
            f"Montant total : {order.total_amount} €",
            "",
            "Articles :",
        ]
        for item in order.items:
            product_name = item.product.name if item.product else f"Produit #{item.product_id}"
            lines.append(f"  - {product_name} x{item.quantity} — {item.unit_price} € / unité")
        lines.extend(["", "À bientôt sur Cendres & Vapeur."])
        return "\n".join(lines)

    def _fetch_order(self, order_id: int) -> Order:
        order = (
            self.db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.user),
            )
            .filter(Order.id == order_id)
            .first()
        )
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commande introuvable.",
            )
        return order

    def _ensure_order_access(
        self,
        order: Order,
        requesting_user_id: int,
        role_level: int,
    ) -> None:
        if order.user_id != requesting_user_id and role_level < EDITOR_ROLE_LEVEL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès non autorisé à cette commande.",
            )
