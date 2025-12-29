import re
from datetime import datetime
from decimal import Decimal
from typing import List, Tuple, Optional
import PyPDF2
import pytesseract
from pdf2image import convert_from_path
from app.services.parsers.base_parser import BaseParser, ParsedTransaction


class GenericParser(BaseParser):
    """Generic PDF parser with OCR fallback"""
    
    def extract_text(self, pdf_path: str) -> str:
        """Extract text from PDF, with OCR fallback for scanned documents"""
        try:
            # Try digital PDF extraction first
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                # If we got substantial text, return it
                if len(text.strip()) > 100:
                    return text
            
            # Fall back to OCR for scanned PDFs
            return self._extract_text_ocr(pdf_path)
        
        except Exception as e:
            # If digital extraction fails, try OCR
            return self._extract_text_ocr(pdf_path)
    
    def _extract_text_ocr(self, pdf_path: str) -> str:
        """Extract text using OCR"""
        try:
            # Convert PDF to images
            images = convert_from_path(pdf_path)
            
            # Extract text from each image
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
            
            return text
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def extract_date_range(self, text: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """Extract statement date range using common patterns"""
        # Common date patterns
        date_patterns = [
            r'Statement Period[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+to\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'From[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+To[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*-\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._parse_date(match.group(1))
                    end_date = self._parse_date(match.group(2))
                    return start_date, end_date
                except:
                    continue
        
        return None, None
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string with multiple format attempts"""
        date_formats = [
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%m-%d-%Y",
            "%d-%m-%Y",
            "%m/%d/%y",
            "%d/%m/%y",
            "%Y-%m-%d",
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        raise ValueError(f"Could not parse date: {date_str}")
    
    def extract_transactions(self, text: str) -> List[ParsedTransaction]:
        """Extract transactions using pattern matching"""
        transactions = []
        
        # Common transaction pattern:
        # Date | Description | Debit | Credit | Balance
        # Example: 01/15/2024  GROCERY STORE  45.23  1,234.56
        
        # Pattern for transaction lines
        # Matches: date, description, amounts (debit/credit/balance)
        pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+([A-Za-z0-9\s\-\*\#\.]+?)\s+([\d,]+\.\d{2})\s*([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?'
        
        for match in re.finditer(pattern, text):
            try:
                date_str = match.group(1)
                description = match.group(2).strip()
                
                # Parse amounts
                amounts = []
                for i in range(3, 6):
                    if match.group(i):
                        amount_str = match.group(i).replace(',', '')
                        amounts.append(Decimal(amount_str))
                    else:
                        amounts.append(None)
                
                # Determine which amounts are debit, credit, balance
                # This is heuristic-based and may need adjustment per bank
                debit = None
                credit = None
                balance = None
                
                if len(amounts) >= 3 and amounts[2] is not None:
                    # Pattern: debit, credit, balance
                    debit = amounts[0]
                    credit = amounts[1]
                    balance = amounts[2]
                elif len(amounts) >= 2 and amounts[1] is not None:
                    # Pattern: amount, balance
                    # Assume debit if description suggests expense
                    if self._is_expense_description(description):
                        debit = amounts[0]
                    else:
                        credit = amounts[0]
                    balance = amounts[1]
                else:
                    # Single amount - assume debit
                    debit = amounts[0]
                
                transaction = ParsedTransaction(
                    transaction_date=self._parse_date(date_str),
                    description=description,
                    debit=debit,
                    credit=credit,
                    balance=balance
                )
                transactions.append(transaction)
            
            except Exception:
                # Skip malformed transactions
                continue
        
        return transactions
    
    def _is_expense_description(self, description: str) -> bool:
        """Heuristic to determine if description suggests an expense"""
        expense_keywords = [
            'purchase', 'payment', 'withdrawal', 'debit', 'fee',
            'store', 'shop', 'restaurant', 'gas', 'grocery'
        ]
        description_lower = description.lower()
        return any(keyword in description_lower for keyword in expense_keywords)
