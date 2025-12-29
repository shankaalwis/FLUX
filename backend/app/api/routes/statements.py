from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os
import uuid
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models import User, BankProfile, Statement, Transaction, StatementStatus
from app.schemas import StatementResponse

router = APIRouter()


@router.post("/profiles/{profile_id}/statements", response_model=StatementResponse, status_code=status.HTTP_201_CREATED)
async def upload_statement(
    profile_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a PDF statement"""
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
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Validate file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE} bytes"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id), str(profile_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{file_id}.pdf")
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Create statement record
    statement = Statement(
        bank_profile_id=profile_id,
        filename=file.filename,
        file_path=file_path,
        status=StatementStatus.QUEUED
    )
    
    db.add(statement)
    db.commit()
    db.refresh(statement)
    
    # Trigger background processing task
    from app.workers.tasks import process_statement_task
    process_statement_task.delay(str(statement.id))
    
    return StatementResponse(
        id=statement.id,
        bank_profile_id=statement.bank_profile_id,
        filename=statement.filename,
        file_path=statement.file_path,
        status=statement.status,
        uploaded_at=statement.uploaded_at,
        transaction_count=0
    )


@router.get("/profiles/{profile_id}/statements", response_model=List[StatementResponse])
async def list_statements(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all statements for a bank profile"""
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
    
    statements = db.query(Statement).filter(
        Statement.bank_profile_id == profile_id
    ).order_by(Statement.uploaded_at.desc()).all()
    
    # Enrich with transaction counts
    result = []
    for statement in statements:
        count = db.query(func.count(Transaction.id)).filter(
            Transaction.statement_id == statement.id
        ).scalar()
        
        result.append(StatementResponse(
            id=statement.id,
            bank_profile_id=statement.bank_profile_id,
            filename=statement.filename,
            file_path=statement.file_path,
            statement_start_date=statement.statement_start_date,
            statement_end_date=statement.statement_end_date,
            status=statement.status,
            error_message=statement.error_message,
            uploaded_at=statement.uploaded_at,
            processed_at=statement.processed_at,
            transaction_count=count
        ))
    
    return result


@router.get("/statements/{statement_id}", response_model=StatementResponse)
async def get_statement(
    statement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statement details"""
    statement = db.query(Statement).join(BankProfile).filter(
        Statement.id == statement_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not statement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statement not found"
        )
    
    count = db.query(func.count(Transaction.id)).filter(
        Transaction.statement_id == statement.id
    ).scalar()
    
    return StatementResponse(
        id=statement.id,
        bank_profile_id=statement.bank_profile_id,
        filename=statement.filename,
        file_path=statement.file_path,
        statement_start_date=statement.statement_start_date,
        statement_end_date=statement.statement_end_date,
        status=statement.status,
        error_message=statement.error_message,
        uploaded_at=statement.uploaded_at,
        processed_at=statement.processed_at,
        transaction_count=count
    )


@router.delete("/statements/{statement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_statement(
    statement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a statement and its file"""
    statement = db.query(Statement).join(BankProfile).filter(
        Statement.id == statement_id,
        BankProfile.user_id == current_user.id
    ).first()
    
    if not statement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statement not found"
        )
    
    # Delete file
    if os.path.exists(statement.file_path):
        os.remove(statement.file_path)
    
    # Delete database record (cascades to transactions)
    db.delete(statement)
    db.commit()
    
    return None
