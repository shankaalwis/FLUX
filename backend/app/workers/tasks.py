from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.pdf_service import process_statement
from app.services.ai.ai_pipeline import AIPipeline
from app.models import Transaction
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="process_statement_task")
def process_statement_task(statement_id: str):
    """
    Background task to process a PDF statement.
    
    Args:
        statement_id: ID of the statement to process
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting processing of statement {statement_id}")
        process_statement(statement_id, db)
        logger.info(f"Completed processing of statement {statement_id}")
        
        # Trigger AI analysis
        analyze_transactions_task.delay(statement_id)
        
    except Exception as e:
        logger.error(f"Error in process_statement_task: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()


@celery_app.task(name="analyze_transactions_task")
def analyze_transactions_task(statement_id: str):
    """
    Background task to analyze transactions from a statement.
    
    Args:
        statement_id: ID of the statement whose transactions to analyze
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting AI analysis for statement {statement_id}")
        
        # Get all transactions from this statement
        transactions = db.query(Transaction).filter(
            Transaction.statement_id == statement_id
        ).all()
        
        if not transactions:
            logger.warning(f"No transactions found for statement {statement_id}")
            return
        
        # Run AI analysis
        pipeline = AIPipeline()
        pipeline.analyze_batch(transactions, db)
        
        logger.info(f"Completed AI analysis for statement {statement_id}")
        
    except Exception as e:
        logger.error(f"Error in analyze_transactions_task: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()


@celery_app.task(name="regenerate_insights_task")
def regenerate_insights_task(bank_profile_id: str):
    """
    Background task to regenerate insights for a bank profile.
    
    Args:
        bank_profile_id: ID of the bank profile
    """
    db = SessionLocal()
    try:
        logger.info(f"Regenerating insights for profile {bank_profile_id}")
        
        # Get all transactions for the profile
        transactions = db.query(Transaction).filter(
            Transaction.bank_profile_id == bank_profile_id
        ).all()
        
        # Re-analyze all transactions
        pipeline = AIPipeline()
        pipeline.analyze_batch(transactions, db)
        
        logger.info(f"Completed insight regeneration for profile {bank_profile_id}")
        
    except Exception as e:
        logger.error(f"Error in regenerate_insights_task: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()
