from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Statement, Transaction, StatementStatus
from app.services.parsers import parser_registry
from app.services.deduplication import calculate_transaction_hash, is_duplicate
import logging

logger = logging.getLogger(__name__)


def process_statement(statement_id: str, db: Session) -> None:
    """
    Process a PDF statement: extract transactions and save to database.
    This function should be called by a background worker.
    """
    try:
        # Get statement
        statement = db.query(Statement).filter(Statement.id == statement_id).first()
        if not statement:
            logger.error(f"Statement {statement_id} not found")
            return
        
        # Update status to processing
        statement.status = StatementStatus.PROCESSING
        db.commit()
        
        # Get appropriate parser
        parser_type = statement.bank_profile.parser_type.value
        parser = parser_registry.get_parser(parser_type)
        
        # Parse PDF
        logger.info(f"Parsing statement {statement_id} with {parser_type} parser")
        start_date, end_date, parsed_transactions = parser.parse(statement.file_path)
        
        # Update statement date range
        statement.statement_start_date = start_date
        statement.statement_end_date = end_date
        
        # Process transactions
        new_count = 0
        duplicate_count = 0
        
        for parsed_txn in parsed_transactions:
            # Determine amount for hash calculation
            amount = parsed_txn.debit if parsed_txn.debit else parsed_txn.credit
            if amount is None:
                logger.warning(f"Transaction without amount: {parsed_txn.description}")
                continue
            
            # Calculate hash for deduplication
            txn_hash = calculate_transaction_hash(
                bank_profile_id=statement.bank_profile_id,
                transaction_date=parsed_txn.transaction_date,
                description=parsed_txn.description,
                amount=amount
            )
            
            # Check for duplicates
            if is_duplicate(db, txn_hash):
                duplicate_count += 1
                logger.debug(f"Duplicate transaction: {parsed_txn.description}")
                continue
            
            # Create new transaction
            transaction = Transaction(
                bank_profile_id=statement.bank_profile_id,
                statement_id=statement.id,
                transaction_hash=txn_hash,
                transaction_date=parsed_txn.transaction_date,
                description=parsed_txn.description,
                debit=parsed_txn.debit,
                credit=parsed_txn.credit,
                balance=parsed_txn.balance
            )
            db.add(transaction)
            new_count += 1
        
        # Mark as completed
        statement.status = StatementStatus.COMPLETED
        statement.processed_at = datetime.utcnow()
        db.commit()
        
        logger.info(
            f"Statement {statement_id} processed successfully: "
            f"{new_count} new transactions, {duplicate_count} duplicates"
        )
        
        # TODO: Trigger AI analysis for new transactions
        # from app.workers.tasks import analyze_transactions_task
        # analyze_transactions_task.delay(str(statement.bank_profile_id))
    
    except Exception as e:
        logger.error(f"Error processing statement {statement_id}: {str(e)}", exc_info=True)
        
        # Mark as failed
        statement = db.query(Statement).filter(Statement.id == statement_id).first()
        if statement:
            statement.status = StatementStatus.FAILED
            statement.error_message = str(e)
            db.commit()
