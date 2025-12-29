from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import math
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, BankProfile, Transaction, TransactionAIMetadata
from app.schemas import (
    TransactionResponse,
    TransactionListResponse,
    TransactionUpdate,
    CategoryOverride,
    AIMetadataResponse,
)

router = APIRouter()


@router.get("/profiles/{profile_id}/transactions", response_model=TransactionListResponse)
async def list_transactions(
    profile_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List transactions with filtering and pagination"""
    # Verify profile ownership
    profile = db.query(BankProfile).filter(
        BankProfile.id == profile_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank profile not found"
        )
    
    # Build query
    query = db.query(Transaction).filter(Transaction.bank_profile_id == profile_id)
    
    # Apply filters
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    if category:
        query = query.join(TransactionAIMetadata).filter(
            TransactionAIMetadata.category == category
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    transactions = query.order_by(
        Transaction.transaction_date.desc()
    ).offset(offset).limit(page_size).all()
    
    # Convert to response format
    transaction_responses = []
    for txn in transactions:
        ai_metadata = None
        if txn.ai_metadata:
            ai_metadata = AIMetadataResponse(
                category=txn.ai_metadata.category,
                category_confidence=txn.ai_metadata.category_confidence,
                normalized_merchant=txn.ai_metadata.normalized_merchant,
                is_recurring=txn.ai_metadata.is_recurring,
                recurrence_frequency=txn.ai_metadata.recurrence_frequency,
                next_expected_date=txn.ai_metadata.next_expected_date,
                is_anomaly=txn.ai_metadata.is_anomaly,
                anomaly_score=txn.ai_metadata.anomaly_score,
                anomaly_reason=txn.ai_metadata.anomaly_reason,
                user_override=txn.ai_metadata.user_override
            )
        
        transaction_responses.append(TransactionResponse(
            id=txn.id,
            bank_profile_id=txn.bank_profile_id,
            statement_id=txn.statement_id,
            transaction_hash=txn.transaction_hash,
            transaction_date=txn.transaction_date,
            description=txn.description,
            debit=txn.debit,
            credit=txn.credit,
            balance=txn.balance,
            created_at=txn.created_at,
            updated_at=txn.updated_at,
            ai_metadata=ai_metadata
        ))
    
    total_pages = math.ceil(total / page_size)
    
    return TransactionListResponse(
        transactions=transaction_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction details"""
    transaction = db.query(Transaction).join(BankProfile).filter(
        Transaction.id == transaction_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    ai_metadata = None
    if transaction.ai_metadata:
        ai_metadata = AIMetadataResponse(
            category=transaction.ai_metadata.category,
            category_confidence=transaction.ai_metadata.category_confidence,
            normalized_merchant=transaction.ai_metadata.normalized_merchant,
            is_recurring=transaction.ai_metadata.is_recurring,
            recurrence_frequency=transaction.ai_metadata.recurrence_frequency,
            next_expected_date=transaction.ai_metadata.next_expected_date,
            is_anomaly=transaction.ai_metadata.is_anomaly,
            anomaly_score=transaction.ai_metadata.anomaly_score,
            anomaly_reason=transaction.ai_metadata.anomaly_reason,
            user_override=transaction.ai_metadata.user_override
        )
    
    return TransactionResponse(
        id=transaction.id,
        bank_profile_id=transaction.bank_profile_id,
        statement_id=transaction.statement_id,
        transaction_hash=transaction.transaction_hash,
        transaction_date=transaction.transaction_date,
        description=transaction.description,
        debit=transaction.debit,
        credit=transaction.credit,
        balance=transaction.balance,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
        ai_metadata=ai_metadata
    )


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update transaction details"""
    transaction = db.query(Transaction).join(BankProfile).filter(
        Transaction.id == transaction_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Update fields
    if update_data.description is not None:
        transaction.description = update_data.description
    if update_data.debit is not None:
        transaction.debit = update_data.debit
    if update_data.credit is not None:
        transaction.credit = update_data.credit
    if update_data.balance is not None:
        transaction.balance = update_data.balance
    
    db.commit()
    db.refresh(transaction)
    
    ai_metadata = None
    if transaction.ai_metadata:
        ai_metadata = AIMetadataResponse(
            category=transaction.ai_metadata.category,
            category_confidence=transaction.ai_metadata.category_confidence,
            normalized_merchant=transaction.ai_metadata.normalized_merchant,
            is_recurring=transaction.ai_metadata.is_recurring,
            recurrence_frequency=transaction.ai_metadata.recurrence_frequency,
            next_expected_date=transaction.ai_metadata.next_expected_date,
            is_anomaly=transaction.ai_metadata.is_anomaly,
            anomaly_score=transaction.ai_metadata.anomaly_score,
            anomaly_reason=transaction.ai_metadata.anomaly_reason,
            user_override=transaction.ai_metadata.user_override
        )
    
    return TransactionResponse(
        id=transaction.id,
        bank_profile_id=transaction.bank_profile_id,
        statement_id=transaction.statement_id,
        transaction_hash=transaction.transaction_hash,
        transaction_date=transaction.transaction_date,
        description=transaction.description,
        debit=transaction.debit,
        credit=transaction.credit,
        balance=transaction.balance,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
        ai_metadata=ai_metadata
    )


@router.put("/transactions/{transaction_id}/category", response_model=TransactionResponse)
async def override_category(
    transaction_id: str,
    category_data: CategoryOverride,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Override AI-assigned category"""
    transaction = db.query(Transaction).join(BankProfile).filter(
        Transaction.id == transaction_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Update or create AI metadata
    if transaction.ai_metadata:
        transaction.ai_metadata.category = category_data.category
        transaction.ai_metadata.user_override = True
    else:
        metadata = TransactionAIMetadata(
            transaction_id=transaction.id,
            category=category_data.category,
            user_override=True
        )
        db.add(metadata)
    
    db.commit()
    db.refresh(transaction)
    
    ai_metadata = None
    if transaction.ai_metadata:
        ai_metadata = AIMetadataResponse(
            category=transaction.ai_metadata.category,
            category_confidence=transaction.ai_metadata.category_confidence,
            normalized_merchant=transaction.ai_metadata.normalized_merchant,
            is_recurring=transaction.ai_metadata.is_recurring,
            recurrence_frequency=transaction.ai_metadata.recurrence_frequency,
            next_expected_date=transaction.ai_metadata.next_expected_date,
            is_anomaly=transaction.ai_metadata.is_anomaly,
            anomaly_score=transaction.ai_metadata.anomaly_score,
            anomaly_reason=transaction.ai_metadata.anomaly_reason,
            user_override=transaction.ai_metadata.user_override
        )
    
    return TransactionResponse(
        id=transaction.id,
        bank_profile_id=transaction.bank_profile_id,
        statement_id=transaction.statement_id,
        transaction_hash=transaction.transaction_hash,
        transaction_date=transaction.transaction_date,
        description=transaction.description,
        debit=transaction.debit,
        credit=transaction.credit,
        balance=transaction.balance,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
        ai_metadata=ai_metadata
    )
