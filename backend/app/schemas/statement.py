from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional
from app.models.user import StatementStatus


class StatementBase(BaseModel):
    """Base statement schema"""
    filename: str


class StatementResponse(StatementBase):
    """Statement response schema"""
    id: UUID4
    bank_profile_id: UUID4
    file_path: str
    statement_start_date: Optional[datetime] = None
    statement_end_date: Optional[datetime] = None
    status: StatementStatus
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    transaction_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
