import re
from typing import Dict, Tuple
from app.models import Transaction


class TransactionCategorizer:
    """Rule-based transaction categorization with confidence scoring"""
    
    # Category keywords and patterns
    CATEGORY_RULES = {
        "Food & Dining": {
            "keywords": ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "dining", 
                        "mcdonald", "starbucks", "subway", "chipotle", "grocery", "supermarket",
                        "whole foods", "trader joe", "safeway", "kroger"],
            "confidence": 0.85
        },
        "Transportation": {
            "keywords": ["uber", "lyft", "taxi", "gas", "fuel", "shell", "chevron", "exxon",
                        "parking", "metro", "transit", "airline", "flight"],
            "confidence": 0.85
        },
        "Shopping": {
            "keywords": ["amazon", "walmart", "target", "ebay", "store", "shop", "retail",
                        "clothing", "apparel", "fashion"],
            "confidence": 0.75
        },
        "Utilities": {
            "keywords": ["electric", "water", "gas company", "utility", "power", "energy",
                        "internet", "cable", "phone", "wireless", "verizon", "at&t", "comcast"],
            "confidence": 0.90
        },
        "Entertainment": {
            "keywords": ["netflix", "spotify", "hulu", "disney", "movie", "theater", "cinema",
                        "game", "steam", "playstation", "xbox"],
            "confidence": 0.85
        },
        "Healthcare": {
            "keywords": ["pharmacy", "cvs", "walgreens", "hospital", "medical", "doctor",
                        "clinic", "health", "dental", "vision"],
            "confidence": 0.90
        },
        "Income": {
            "keywords": ["salary", "payroll", "deposit", "direct dep", "payment received",
                        "transfer from", "refund"],
            "confidence": 0.85
        },
        "Transfer": {
            "keywords": ["transfer", "venmo", "paypal", "zelle", "cash app", "wire"],
            "confidence": 0.80
        },
        "Fees & Charges": {
            "keywords": ["fee", "charge", "interest", "penalty", "overdraft", "atm fee"],
            "confidence": 0.95
        },
        "Subscriptions": {
            "keywords": ["subscription", "membership", "monthly", "annual fee"],
            "confidence": 0.85
        },
    }
    
    def categorize(self, transaction: Transaction) -> Tuple[str, float]:
        """
        Categorize a transaction and return (category, confidence).
        
        Returns:
            Tuple of (category_name, confidence_score)
        """
        description = transaction.description.lower()
        
        # Check if it's income (credit transaction)
        if transaction.credit and not transaction.debit:
            for keyword in self.CATEGORY_RULES["Income"]["keywords"]:
                if keyword in description:
                    return "Income", self.CATEGORY_RULES["Income"]["confidence"]
        
        # Check other categories
        best_match = None
        best_confidence = 0.0
        
        for category, rules in self.CATEGORY_RULES.items():
            if category == "Income":
                continue  # Already checked
            
            for keyword in rules["keywords"]:
                if keyword in description:
                    if rules["confidence"] > best_confidence:
                        best_match = category
                        best_confidence = rules["confidence"]
                    break
        
        if best_match:
            return best_match, best_confidence
        
        # Default category
        if transaction.debit:
            return "Other Expenses", 0.50
        else:
            return "Other Income", 0.50
    
    def batch_categorize(self, transactions: list[Transaction]) -> Dict[str, Tuple[str, float]]:
        """
        Categorize multiple transactions.
        
        Returns:
            Dict mapping transaction_id to (category, confidence)
        """
        results = {}
        for txn in transactions:
            category, confidence = self.categorize(txn)
            results[str(txn.id)] = (category, confidence)
        return results
