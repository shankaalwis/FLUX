import numpy as np
from typing import List, Tuple, Optional
from decimal import Decimal
from app.models import Transaction


class AnomalyDetector:
    """Detect anomalous transactions with explanations"""
    
    def __init__(self, z_score_threshold: float = 3.0):
        """
        Args:
            z_score_threshold: Z-score threshold for anomaly detection
        """
        self.z_score_threshold = z_score_threshold
    
    def detect_anomaly(
        self,
        transaction: Transaction,
        user_transactions: List[Transaction]
    ) -> Tuple[bool, float, Optional[str]]:
        """
        Detect if a transaction is anomalous.
        
        Args:
            transaction: Transaction to check
            user_transactions: All user's transactions for context
            
        Returns:
            Tuple of (is_anomaly, anomaly_score, reason)
        """
        reasons = []
        scores = []
        
        # Check 1: Unusually large amount
        amount_anomaly, amount_score, amount_reason = self._check_amount_anomaly(
            transaction, user_transactions
        )
        if amount_anomaly:
            reasons.append(amount_reason)
            scores.append(amount_score)
        
        # Check 2: Unusual merchant
        merchant_anomaly, merchant_score, merchant_reason = self._check_merchant_anomaly(
            transaction, user_transactions
        )
        if merchant_anomaly:
            reasons.append(merchant_reason)
            scores.append(merchant_score)
        
        # Check 3: Unusual category spending
        category_anomaly, category_score, category_reason = self._check_category_anomaly(
            transaction, user_transactions
        )
        if category_anomaly:
            reasons.append(category_reason)
            scores.append(category_score)
        
        # Determine overall anomaly
        is_anomaly = len(reasons) > 0
        overall_score = max(scores) if scores else 0.0
        combined_reason = " ".join(reasons) if reasons else None
        
        return is_anomaly, overall_score, combined_reason
    
    def _check_amount_anomaly(
        self,
        transaction: Transaction,
        user_transactions: List[Transaction]
    ) -> Tuple[bool, float, Optional[str]]:
        """Check if transaction amount is anomalous"""
        amount = transaction.debit if transaction.debit else transaction.credit
        if not amount:
            return False, 0.0, None
        
        # Get all amounts of same type (debit/credit)
        amounts = []
        for txn in user_transactions:
            txn_amount = txn.debit if transaction.debit else txn.credit
            if txn_amount:
                amounts.append(float(txn_amount))
        
        if len(amounts) < 10:
            return False, 0.0, None
        
        # Calculate z-score
        mean = np.mean(amounts)
        std = np.std(amounts)
        
        if std == 0:
            return False, 0.0, None
        
        z_score = abs((float(amount) - mean) / std)
        
        if z_score > self.z_score_threshold:
            anomaly_score = min(z_score / 10.0, 1.0)  # Normalize to 0-1
            reason = f"Amount ${amount:.2f} is {z_score:.1f} standard deviations from your average."
            return True, anomaly_score, reason
        
        return False, 0.0, None
    
    def _check_merchant_anomaly(
        self,
        transaction: Transaction,
        user_transactions: List[Transaction]
    ) -> Tuple[bool, float, Optional[str]]:
        """Check if merchant is unusual for the user"""
        # Get normalized merchant
        merchant = (
            transaction.ai_metadata.normalized_merchant
            if transaction.ai_metadata and transaction.ai_metadata.normalized_merchant
            else transaction.description
        )
        
        # Check if this merchant appears in user's history
        merchant_count = 0
        for txn in user_transactions:
            txn_merchant = (
                txn.ai_metadata.normalized_merchant
                if txn.ai_metadata and txn.ai_metadata.normalized_merchant
                else txn.description
            )
            if merchant.lower() in txn_merchant.lower() or txn_merchant.lower() in merchant.lower():
                merchant_count += 1
        
        # If first time with this merchant and amount is significant
        if merchant_count == 1:  # Only this transaction
            amount = transaction.debit if transaction.debit else transaction.credit
            if amount and float(amount) > 100:
                reason = f"First transaction with merchant '{merchant}'."
                return True, 0.6, reason
        
        return False, 0.0, None
    
    def _check_category_anomaly(
        self,
        transaction: Transaction,
        user_transactions: List[Transaction]
    ) -> Tuple[bool, float, Optional[str]]:
        """Check if spending in this category is unusual"""
        if not transaction.ai_metadata or not transaction.ai_metadata.category:
            return False, 0.0, None
        
        category = transaction.ai_metadata.category
        amount = transaction.debit if transaction.debit else transaction.credit
        
        if not amount:
            return False, 0.0, None
        
        # Get all amounts in same category
        category_amounts = []
        for txn in user_transactions:
            if txn.ai_metadata and txn.ai_metadata.category == category:
                txn_amount = txn.debit if txn.debit else txn.credit
                if txn_amount:
                    category_amounts.append(float(txn_amount))
        
        if len(category_amounts) < 5:
            return False, 0.0, None
        
        # Calculate z-score for category
        mean = np.mean(category_amounts)
        std = np.std(category_amounts)
        
        if std == 0:
            return False, 0.0, None
        
        z_score = abs((float(amount) - mean) / std)
        
        if z_score > self.z_score_threshold:
            anomaly_score = min(z_score / 10.0, 1.0)
            reason = f"Spending ${amount:.2f} in '{category}' is unusually high for you."
            return True, anomaly_score, reason
        
        return False, 0.0, None
