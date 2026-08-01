"""
Per-session document context, used so follow-up questions stay grounded in
the originally extracted text (not just the simplified summary).

Redis is optional. Running Redis costs almost nothing on this hardware, but
requiring it for local dev adds setup friction for no real benefit at this
scale (single dev instance, free-tier API caps you at a handful of
requests/minute anyway). If REDIS_URL is set, use it; otherwise fall back
to an in-process dict, which is fine until you actually deploy multiple
backend workers.
"""
import json
import time
import threading

from app.config import get_config

cfg = get_config()

_lock = threading.Lock()
_memory_store = {}  # session_id -> (expires_at, data_dict)

_redis_client = None
if cfg.REDIS_URL:
    try:
        import redis
        _redis_client = redis.from_url(cfg.REDIS_URL, decode_responses=True)
        _redis_client.ping()
    except Exception:
        _redis_client = None  # fall back silently to memory store


def set_context(session_id: str, data: dict):
    if _redis_client:
        _redis_client.setex(
            f"ctx:{session_id}", cfg.CONTEXT_TTL_SECONDS, json.dumps(data)
        )
        return
    with _lock:
        _memory_store[session_id] = (time.time() + cfg.CONTEXT_TTL_SECONDS, data)


def get_context(session_id: str) -> dict | None:
    if _redis_client:
        raw = _redis_client.get(f"ctx:{session_id}")
        return json.loads(raw) if raw else None
    with _lock:
        entry = _memory_store.get(session_id)
        if not entry:
            return None
        expires_at, data = entry
        if time.time() > expires_at:
            del _memory_store[session_id]
            return None
        return data


def append_history(session_id: str, question: str, answer: str):
    ctx = get_context(session_id) or {}
    history = ctx.get("history", [])
    history.append({"question": question, "answer": answer})
    ctx["history"] = history
    set_context(session_id, ctx)
