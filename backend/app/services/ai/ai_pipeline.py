from sqlalchemy.orm import Session
from typing import List
from app.models import Transaction, TransactionAIMetadata
from app.services.ai.categorizer import TransactionCategorizer
from app.services.ai.merchant_normalizer import MerchantNormalizer
from app.services.ai.recurrence_detector import RecurrenceDetector
from app.services.ai.anomaly_detector import AnomalyDetector
import logging

logger = logging.getLogger(__name__)


class AIPipeline:
    """Orchestrates all AI analysis for transactions"""
    
    def __init__(self):
        self.categorizer = TransactionCategorizer()
        self.merchant_normalizer = MerchantNormalizer()
        self.recurrence_detector = RecurrenceDetector()
        self.anomaly_detector = AnomalyDetector()
    
    def analyze_transaction(
        self,
        transaction: Transaction,
        db: Session,
        all_user_transactions: List[Transaction] = None
    ) -> TransactionAIMetadata:
        """
        Run complete AI analysis on a single transaction.
        
        Args:
            transaction: Transaction to analyze
            db: Database session
            all_user_transactions: All transactions for the user (for context)
            
        Returns:
            TransactionAIMetadata object
        """
        # Get all user transactions if not provided
        if all_user_transactions is None:
            all_user_transactions = db.query(Transaction).filter(
                Transaction.bank_profile_id == transaction.bank_profile_id
            ).all()
        
        # 1. Categorize
        category, category_confidence = self.categorizer.categorize(transaction)
        
        # 2. Normalize merchant
        normalized_merchant = self.merchant_normalizer.normalize(transaction.description)
        
        # 3. Check for recurrence
        is_recurring = False
        recurrence_frequency = None
        next_expected_date = None
        
        if normalized_merchant:
            # Get similar transactions
            similar_txns = [
                t for t in all_user_transactions
                if t.ai_metadata and t.ai_metadata.normalized_merchant == normalized_merchant
            ]
            
            if len(similar_txns) >= 2:
                is_recurring, recurrence_frequency, next_expected_date = \
                    self.recurrence_detector.detect_recurrence(similar_txns, normalized_merchant)
        
        # 4. Detect anomalies
        is_anomaly, anomaly_score, anomaly_reason = \
            self.anomaly_detector.detect_anomaly(transaction, all_user_transactions)
        
        # Create or update AI metadata
        if transaction.ai_metadata:
            metadata = transaction.ai_metadata
            # Don't override if user has manually set category
            if not metadata.user_override:
                metadata.category = category
                metadata.category_confidence = category_confidence
            metadata.normalized_merchant = normalized_merchant
            metadata.is_recurring = is_recurring
            metadata.recurrence_frequency = recurrence_frequency
            metadata.next_expected_date = next_expected_date
            metadata.is_anomaly = is_anomaly
            metadata.anomaly_score = anomaly_score
            metadata.anomaly_reason = anomaly_reason
        else:
            metadata = TransactionAIMetadata(
                transaction_id=transaction.id,
                category=category,
                category_confidence=category_confidence,
                normalized_merchant=normalized_merchant,
                is_recurring=is_recurring,
                recurrence_frequency=recurrence_frequency,
                next_expected_date=next_expected_date,
                is_anomaly=is_anomaly,
                anomaly_score=anomaly_score,
                anomaly_reason=anomaly_reason,
                user_override=False
            )
        
        return metadata
    
    def analyze_batch(
        self,
        transactions: List[Transaction],
        db: Session
    ) -> None:
        """
        Analyze a batch of transactions and save results.
        
        Args:
            transactions: List of transactions to analyze
            db: Database session
        """
        if not transactions:
            return
        
        logger.info(f"Analyzing {len(transactions)} transactions")
        
        # Get all user transactions for context
        bank_profile_id = transactions[0].bank_profile_id
        all_user_transactions = db.query(Transaction).filter(
            Transaction.bank_profile_id == bank_profile_id
        ).all()
        
        # Analyze each transaction
        for txn in transactions:
            try:
                metadata = self.analyze_transaction(txn, db, all_user_transactions)
                
                if txn.ai_metadata is None:
                    db.add(metadata)
                
            except Exception as e:
                logger.error(f"Error analyzing transaction {txn.id}: {str(e)}", exc_info=True)
                continue
        
        # Commit all changes
        db.commit()
        logger.info(f"Completed analysis of {len(transactions)} transactions")
