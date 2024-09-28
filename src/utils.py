# src/utils.py
import hashlib

def compute_hash(rule: str) -> str:
    """
    Вычисляет SHA256 хеш для строки правила.
    """
    return hashlib.sha256(rule.encode('utf-8')).hexdigest()
