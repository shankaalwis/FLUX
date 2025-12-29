from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
from decimal import Decimal
from app.models import Transaction


class RecurrenceDetector:
    """Detect recurring transactions (subscriptions, bills)"""
    
    def __init__(self, tolerance_days: int = 3):
        """
        Args:
            tolerance_days: Number of days tolerance for recurring pattern detection
        """
        self.tolerance_days = tolerance_days
    
    def detect_recurrence(
        self,
        transactions: List[Transaction],
        merchant: str
    ) -> Tuple[bool, Optional[str], Optional[datetime]]:
        """
        Detect if transactions from a merchant are recurring.
        
        Args:
            transactions: List of transactions from the same merchant
            merchant: Normalized merchant name
            
        Returns:
            Tuple of (is_recurring, frequency, next_expected_date)
        """
        if len(transactions) < 2:
            return False, None, None
        
        # Sort by date
        sorted_txns = sorted(transactions, key=lambda t: t.transaction_date)
        
        # Calculate intervals between transactions
        intervals = []
        for i in range(1, len(sorted_txns)):
            delta = (sorted_txns[i].transaction_date - sorted_txns[i-1].transaction_date).days
            intervals.append(delta)
        
        if not intervals:
            return False, None, None
        
        # Check for consistent intervals
        avg_interval = sum(intervals) / len(intervals)
        
        # Check if intervals are consistent (within tolerance)
        consistent = all(
            abs(interval - avg_interval) <= self.tolerance_days
            for interval in intervals
        )
        
        if not consistent:
            return False, None, None
        
        # Determine frequency
        frequency = self._determine_frequency(avg_interval)
        
        if frequency is None:
            return False, None, None
        
        # Calculate next expected date
        last_date = sorted_txns[-1].transaction_date
        next_date = last_date + timedelta(days=int(avg_interval))
        
        return True, frequency, next_date
    
    def _determine_frequency(self, avg_days: float) -> Optional[str]:
        """Determine frequency label from average interval"""
        if 6 <= avg_days <= 8:
            return "weekly"
        elif 13 <= avg_days <= 16:
            return "bi-weekly"
        elif 28 <= avg_days <= 32:
            return "monthly"
        elif 88 <= avg_days <= 95:
            return "quarterly"
        elif 360 <= avg_days <= 370:
            return "yearly"
        else:
            return None
    
    def find_recurring_patterns(
        self,
        all_transactions: List[Transaction]
    ) -> Dict[str, Dict]:
        """
        Find all recurring patterns in a list of transactions.
        
        Args:
            all_transactions: All transactions to analyze
            
        Returns:
            Dict mapping merchant to recurrence info
        """
        # Group by normalized merchant and similar amount
        merchant_groups = defaultdict(list)
        
        for txn in all_transactions:
            # Use normalized merchant if available, otherwise description
            merchant = (
                txn.ai_metadata.normalized_merchant 
                if txn.ai_metadata and txn.ai_metadata.normalized_merchant
                else txn.description
            )
            
            # Group by merchant and similar amount (within 10%)
            amount = txn.debit if txn.debit else txn.credit
            if amount:
                key = f"{merchant}_{int(amount)}"
                merchant_groups[key].append(txn)
        
        # Detect recurrence for each group
        recurring_patterns = {}
        
        for key, txns in merchant_groups.items():
            is_recurring, frequency, next_date = self.detect_recurrence(txns, key)
            
            if is_recurring:
                recurring_patterns[key] = {
                    "merchant": txns[0].ai_metadata.normalized_merchant if txns[0].ai_metadata else txns[0].description,
                    "frequency": frequency,
                    "next_expected_date": next_date,
                    "transaction_count": len(txns),
                    "average_amount": sum(
                        (t.debit if t.debit else t.credit) for t in txns
                    ) / len(txns)
                }
        
        return recurring_patterns
