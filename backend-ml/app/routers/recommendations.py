from fastapi import APIRouter
from pydantic import BaseModel
from app.models.collaborative_filter import get_model
import redis as redis_lib
import json
import os

router = APIRouter()

_redis = redis_lib.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True,
)


class RatingItem(BaseModel):
    userId: str
    productId: str
    rating: int


class TrainRequest(BaseModel):
    ratings: list[RatingItem]


@router.post("/train")
async def train(body: TrainRequest):
    model = get_model()
    ratings = [r.model_dump() for r in body.ratings]
    result = model.train(ratings)
    # Invalidate all recommendation caches
    for key in _redis.scan_iter("recs:*"):
        _redis.delete(key)
    return result


@router.get("/recommendations/user/{user_id}")
async def recommendations_for_user(user_id: str, top_n: int = 10):
    cache_key = f"ml:recs:user:{user_id}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    model = get_model()
    product_ids = model.recommend_for_user(user_id, top_n)
    result = {"userId": user_id, "productIds": product_ids, "cached": False}
    _redis.set(cache_key, json.dumps(result), ex=1800)
    return result


@router.get("/recommendations/similar/{product_id}")
async def similar_products(product_id: str, top_n: int = 8):
    cache_key = f"ml:recs:product:{product_id}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    model = get_model()
    product_ids = model.similar_products(product_id, top_n)
    result = {"productId": product_id, "similarProductIds": product_ids}
    _redis.set(cache_key, json.dumps(result), ex=3600)
    return result


@router.get("/health")
async def health():
    model = get_model()
    return {
        "status": "ok",
        "model_trained": model.trained,
        "users": len(model.user_ids),
        "products": len(model.product_ids),
    }
