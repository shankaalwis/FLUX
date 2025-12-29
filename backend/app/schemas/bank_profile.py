from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional
from app.models.user import ParserType


class BankProfileBase(BaseModel):
    """Base bank profile schema"""
    bank_name: str
    parser_type: ParserType = ParserType.GENERIC


class BankProfileCreate(BankProfileBase):
    """Bank profile creation schema"""
    pass


class BankProfileUpdate(BaseModel):
    """Bank profile update schema"""
    bank_name: Optional[str] = None
    parser_type: Optional[ParserType] = None


class BankProfileResponse(BankProfileBase):
    """Bank profile response schema"""
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime
    transaction_count: Optional[int] = 0
    earliest_transaction: Optional[datetime] = None
    latest_transaction: Optional[datetime] = None
    
    class Config:
        from_attributes = True
