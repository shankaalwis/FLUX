from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, BankProfile, Transaction
from app.schemas import (
    BankProfileCreate,
    BankProfileUpdate,
    BankProfileResponse,
)

router = APIRouter()


@router.get("", response_model=List[BankProfileResponse])
async def list_bank_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all bank profiles for the current user"""
    profiles = db.query(BankProfile).filter(
        BankProfile.user_id == current_user.id
    ).all()
    
    # Enrich with transaction stats
    result = []
    for profile in profiles:
        profile_dict = {
            "id": profile.id,
            "user_id": profile.user_id,
            "bank_name": profile.bank_name,
            "parser_type": profile.parser_type,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
        }
        
        # Get transaction stats
        stats = db.query(
            func.count(Transaction.id).label("count"),
            func.min(Transaction.transaction_date).label("earliest"),
            func.max(Transaction.transaction_date).label("latest")
        ).filter(
            Transaction.bank_profile_id == profile.id
        ).first()
        
        profile_dict["transaction_count"] = stats.count if stats.count else 0
        profile_dict["earliest_transaction"] = stats.earliest
        profile_dict["latest_transaction"] = stats.latest
        
        result.append(BankProfileResponse(**profile_dict))
    
    return result


@router.post("", response_model=BankProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_profile(
    profile_data: BankProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new bank profile"""
    new_profile = BankProfile(
        user_id=current_user.id,
        bank_name=profile_data.bank_name,
        parser_type=profile_data.parser_type
    )
    
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    return BankProfileResponse(
        id=new_profile.id,
        user_id=new_profile.user_id,
        bank_name=new_profile.bank_name,
        parser_type=new_profile.parser_type,
        created_at=new_profile.created_at,
        updated_at=new_profile.updated_at,
        transaction_count=0
    )


@router.get("/{profile_id}", response_model=BankProfileResponse)
async def get_bank_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific bank profile"""
    profile = db.query(BankProfile).filter(
        BankProfile.id == profile_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank profile not found"
        )
    
    # Get transaction stats
    stats = db.query(
        func.count(Transaction.id).label("count"),
        func.min(Transaction.transaction_date).label("earliest"),
        func.max(Transaction.transaction_date).label("latest")
    ).filter(
        Transaction.bank_profile_id == profile.id
    ).first()
    
    return BankProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        bank_name=profile.bank_name,
        parser_type=profile.parser_type,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        transaction_count=stats.count if stats.count else 0,
        earliest_transaction=stats.earliest,
        latest_transaction=stats.latest
    )


@router.put("/{profile_id}", response_model=BankProfileResponse)
async def update_bank_profile(
    profile_id: str,
    profile_data: BankProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a bank profile"""
    profile = db.query(BankProfile).filter(
        BankProfile.id == profile_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank profile not found"
        )
    
    # Update fields
    if profile_data.bank_name is not None:
        profile.bank_name = profile_data.bank_name
    if profile_data.parser_type is not None:
        profile.parser_type = profile_data.parser_type
    
    db.commit()
    db.refresh(profile)
    
    # Get transaction stats
    stats = db.query(
        func.count(Transaction.id).label("count"),
        func.min(Transaction.transaction_date).label("earliest"),
        func.max(Transaction.transaction_date).label("latest")
    ).filter(
        Transaction.bank_profile_id == profile.id
    ).first()
    
    return BankProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        bank_name=profile.bank_name,
        parser_type=profile.parser_type,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        transaction_count=stats.count if stats.count else 0,
        earliest_transaction=stats.earliest,
        latest_transaction=stats.latest
    )


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a bank profile"""
    profile = db.query(BankProfile).filter(
        BankProfile.id == profile_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank profile not found"
        )
    
    db.delete(profile)
    db.commit()
    
    return None
