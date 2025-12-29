import re
from typing import Optional


class MerchantNormalizer:
    """Normalize and clean merchant names"""
    
    # Patterns to remove from merchant names
    REMOVE_PATTERNS = [
        r'\d{10,}',  # Long numbers (transaction IDs)
        r'#\d+',  # Store numbers
        r'\*+',  # Asterisks
        r'\s+\d{5,}\s+',  # ZIP codes
        r'\s+[A-Z]{2}\s+',  # State codes
        r'\d{2}/\d{2}',  # Dates
        r'POS\s+',  # Point of sale prefix
        r'DEBIT\s+',  # Debit prefix
        r'PURCHASE\s+',  # Purchase prefix
    ]
    
    # Known merchant mappings (for common variations)
    MERCHANT_MAPPINGS = {
        "mcdonald": "McDonald's",
        "mcdonalds": "McDonald's",
        "starbucks": "Starbucks",
        "amazon": "Amazon",
        "amzn": "Amazon",
        "walmart": "Walmart",
        "target": "Target",
        "whole foods": "Whole Foods",
        "trader joe": "Trader Joe's",
        "cvs": "CVS Pharmacy",
        "walgreens": "Walgreens",
        "shell": "Shell",
        "chevron": "Chevron",
        "uber": "Uber",
        "lyft": "Lyft",
        "netflix": "Netflix",
        "spotify": "Spotify",
    }
    
    def normalize(self, description: str) -> Optional[str]:
        """
        Normalize a merchant name from transaction description.
        
        Args:
            description: Raw transaction description
            
        Returns:
            Normalized merchant name or None if can't extract
        """
        if not description:
            return None
        
        # Clean the description
        cleaned = description
        
        # Remove common patterns
        for pattern in self.REMOVE_PATTERNS:
            cleaned = re.sub(pattern, ' ', cleaned, flags=re.IGNORECASE)
        
        # Remove extra whitespace
        cleaned = ' '.join(cleaned.split())
        cleaned = cleaned.strip()
        
        if not cleaned:
            return None
        
        # Check for known merchants
        cleaned_lower = cleaned.lower()
        for key, value in self.MERCHANT_MAPPINGS.items():
            if key in cleaned_lower:
                return value
        
        # Return cleaned version with title case
        return cleaned.title()
    
    def group_similar_merchants(self, descriptions: list[str]) -> dict[str, list[str]]:
        """
        Group similar merchant names together.
        
        Args:
            descriptions: List of transaction descriptions
            
        Returns:
            Dict mapping normalized merchant to list of original descriptions
        """
        groups = {}
        
        for desc in descriptions:
            normalized = self.normalize(desc)
            if normalized:
                if normalized not in groups:
                    groups[normalized] = []
                groups[normalized].append(desc)
        
        return groups
