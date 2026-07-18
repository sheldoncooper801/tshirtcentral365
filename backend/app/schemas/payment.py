from pydantic import BaseModel


class CheckoutCreate(BaseModel):
    order_id: int
    payment_token: str


class CheckoutResponse(BaseModel):
    payment_id: str
    status: str
    order_id: int
