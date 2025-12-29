from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional
from decimal import Decimal


class TransactionBase(BaseModel):
    """Base transaction schema"""
    transaction_date: datetime
    description: str
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    balance: Optional[Decimal] = None


class TransactionUpdate(BaseModel):
    """Transaction update schema"""
    description: Optional[str] = None
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    balance: Optional[Decimal] = None


class CategoryOverride(BaseModel):
    """Category override schema"""
    category: str


class AIMetadataResponse(BaseModel):
    """AI metadata response schema"""
    category: Optional[str] = None
    category_confidence: Optional[float] = None
    normalized_merchant: Optional[str] = None
    is_recurring: bool = False
    recurrence_frequency: Optional[str] = None
    next_expected_date: Optional[datetime] = None
    is_anomaly: bool = False
    anomaly_score: Optional[float] = None
    anomaly_reason: Optional[str] = None
    user_override: bool = False
    
    class Config:
        from_attributes = True


class TransactionResponse(TransactionBase):
    """Transaction response schema"""
    id: UUID4
    bank_profile_id: UUID4
    statement_id: UUID4
    transaction_hash: str
    created_at: datetime
    updated_at: datetime
    ai_metadata: Optional[AIMetadataResponse] = None
    
    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Transaction list response with pagination"""
    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
