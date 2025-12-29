import hashlib
from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid


def calculate_transaction_hash(
    bank_profile_id: uuid.UUID,
    transaction_date: datetime,
    description: str,
    amount: Decimal
) -> str:
    """
    Calculate a deterministic hash for transaction deduplication.
    
    Same transaction = same hash, ensuring we don't insert duplicates
    when processing overlapping statements.
    """
    # Normalize inputs
    normalized_date = transaction_date.strftime("%Y-%m-%d")
    normalized_desc = description.strip().lower()
    normalized_amount = str(abs(amount))
    
    # Create hash input
    hash_input = f"{bank_profile_id}|{normalized_date}|{normalized_desc}|{normalized_amount}"
    
    # Generate SHA256 hash
    return hashlib.sha256(hash_input.encode()).hexdigest()


def is_duplicate(db, transaction_hash: str) -> bool:
    """Check if a transaction with this hash already exists"""
    from app.models import Transaction
    existing = db.query(Transaction).filter(
        Transaction.transaction_hash == transaction_hash
    ).first()
    return existing is not None
