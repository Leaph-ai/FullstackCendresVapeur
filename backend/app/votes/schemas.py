from pydantic import BaseModel


class VoteStatusResponse(BaseModel):
    product_id: int
    likes_count: int
    liked: bool
