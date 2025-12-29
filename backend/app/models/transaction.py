import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Boolean, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Transaction(Base):
    """Transaction model"""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_profile_id = Column(UUID(as_uuid=True), ForeignKey("bank_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    statement_id = Column(UUID(as_uuid=True), ForeignKey("statements.id", ondelete="CASCADE"), nullable=False)
    transaction_hash = Column(String, unique=True, nullable=False, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    description = Column(String, nullable=False)
    debit = Column(Numeric(12, 2), nullable=True)
    credit = Column(Numeric(12, 2), nullable=True)
    balance = Column(Numeric(12, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    bank_profile = relationship("BankProfile", back_populates="transactions")
    statement = relationship("Statement", back_populates="transactions")
    ai_metadata = relationship("TransactionAIMetadata", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_transactions_profile_date', 'bank_profile_id', 'transaction_date'),
    )


class TransactionAIMetadata(Base):
    """AI metadata for transactions"""
    __tablename__ = "transaction_ai_metadata"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), unique=True, nullable=False)
    category = Column(String, nullable=True, index=True)
    category_confidence = Column(Float, nullable=True)
    normalized_merchant = Column(String, nullable=True)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_frequency = Column(String, nullable=True)
    next_expected_date = Column(DateTime, nullable=True)
    is_anomaly = Column(Boolean, default=False, nullable=False)
    anomaly_score = Column(Float, nullable=True)
    anomaly_reason = Column(String, nullable=True)
    user_override = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="ai_metadata")


class Category(Base):
    """Category reference table"""
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
