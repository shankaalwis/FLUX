from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ParsedTransaction:
    """Parsed transaction data"""
    transaction_date: datetime
    description: str
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    balance: Optional[Decimal] = None


class BaseParser(ABC):
    """Abstract base class for PDF parsers"""
    
    @abstractmethod
    def extract_text(self, pdf_path: str) -> str:
        """
        Extract text from PDF.
        Should handle both digital PDFs and scanned PDFs (with OCR).
        """
        pass
    
    @abstractmethod
    def extract_date_range(self, text: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """
        Extract statement date range from text.
        Returns (start_date, end_date)
        """
        pass
    
    @abstractmethod
    def extract_transactions(self, text: str) -> List[ParsedTransaction]:
        """
        Extract transactions from statement text.
        Returns list of ParsedTransaction objects.
        """
        pass
    
    def parse(self, pdf_path: str) -> Tuple[Optional[datetime], Optional[datetime], List[ParsedTransaction]]:
        """
        Main parsing method that orchestrates the extraction.
        Returns (start_date, end_date, transactions)
        """
        text = self.extract_text(pdf_path)
        start_date, end_date = self.extract_date_range(text)
        transactions = self.extract_transactions(text)
        return start_date, end_date, transactions
