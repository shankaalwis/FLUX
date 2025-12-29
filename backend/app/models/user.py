import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    bank_profiles = relationship("BankProfile", back_populates="user", cascade="all, delete-orphan")


class ParserType(str, enum.Enum):
    """Supported parser types"""
    GENERIC = "generic"
    CHASE = "chase"
    BOFA = "bofa"
    WELLS_FARGO = "wells_fargo"
    CITI = "citi"


class BankProfile(Base):
    """Bank profile model"""
    __tablename__ = "bank_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bank_name = Column(String, nullable=False)
    parser_type = Column(SQLEnum(ParserType), nullable=False, default=ParserType.GENERIC)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="bank_profiles")
    statements = relationship("Statement", back_populates="bank_profile", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="bank_profile", cascade="all, delete-orphan")


class StatementStatus(str, enum.Enum):
    """Statement processing status"""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Statement(Base):
    """Statement model"""
    __tablename__ = "statements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_profile_id = Column(UUID(as_uuid=True), ForeignKey("bank_profiles.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    statement_start_date = Column(DateTime, nullable=True)
    statement_end_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(StatementStatus), nullable=False, default=StatementStatus.QUEUED)
    error_message = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    bank_profile = relationship("BankProfile", back_populates="statements")
    transactions = relationship("Transaction", back_populates="statement", cascade="all, delete-orphan")
