from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class CategoryBreakdown(BaseModel):
    """Category spending breakdown"""
    category: str
    total_spent: Decimal
    transaction_count: int
    percentage: float


class MonthlyTrend(BaseModel):
    """Monthly spending trend"""
    month: str
    year: int
    total_income: Decimal
    total_expenses: Decimal
    net: Decimal


class MerchantSpending(BaseModel):
    """Merchant spending data"""
    merchant: str
    total_spent: Decimal
    transaction_count: int
    average_transaction: Decimal


class CashflowPoint(BaseModel):
    """Cashflow timeline point"""
    date: datetime
    balance: Optional[Decimal] = None
    income: Decimal
    expenses: Decimal


class Insight(BaseModel):
    """AI-generated insight"""
    title: str
    description: str
    insight_type: str  # 'warning', 'info', 'success'
    confidence: float
    data: Optional[dict] = None


class AnalyticsSummary(BaseModel):
    """Overall analytics summary"""
    total_income: Decimal
    total_expenses: Decimal
    net_cashflow: Decimal
    transaction_count: int
    average_transaction: Decimal
    largest_expense: Decimal
    largest_income: Decimal
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None


class AnalyticsResponse(BaseModel):
    """Complete analytics response"""
    summary: AnalyticsSummary
    category_breakdown: List[CategoryBreakdown]
    monthly_trends: List[MonthlyTrend]
    top_merchants: List[MerchantSpending]
    cashflow: List[CashflowPoint]
    insights: List[Insight]
