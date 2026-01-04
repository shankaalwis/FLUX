// src/utils/transaction-aggregator.ts

import { Transaction } from '@/types/database';
import { format, startOfMonth, subMonths } from 'date-fns';

export interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
}

/**
 * Aggregate transactions into monthly income/expense data
 */
export function aggregateMonthlyData(
    transactions: Transaction[],
    monthsCount: number = 12
): MonthlyData[] {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    // Initialize last N months
    for (let i = monthsCount - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(startOfMonth(date), 'yyyy-MM');
        const label = format(date, 'MMM');
        monthlyMap.set(key, { income: 0, expenses: 0 });
    }

    // Aggregate transactions
    transactions.forEach((transaction) => {
        const monthKey = format(new Date(transaction.transaction_date), 'yyyy-MM');
        const existing = monthlyMap.get(monthKey);

        if (existing) {
            if (transaction.transaction_type === 'credit') {
                existing.income += Math.abs(transaction.amount);
            } else {
                existing.expenses += Math.abs(transaction.amount);
            }
        }
    });

    // Convert to array
    return Array.from(monthlyMap.entries())
        .map(([key, data]) => ({
            month: format(new Date(key), 'MMM'),
            income: data.income,
            expenses: data.expenses,
        }));
}

/**
 * Calculate weekly balance trend
 */
export function calculateWeeklyBalance(
    transactions: Transaction[],
    initialBalance: number = 0
): Array<{ date: string; balance: number }> {
    // Sort by date
    const sorted = [...transactions].sort(
        (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    let balance = initialBalance;
    const weeklyData: Array<{ date: string; balance: number }> = [];

    sorted.forEach((transaction, index) => {
        if (transaction.transaction_type === 'credit') {
            balance += Math.abs(transaction.amount);
        } else {
            balance -= Math.abs(transaction.amount);
        }

        // Sample every ~week worth of transactions
        if (index % Math.max(1, Math.floor(sorted.length / 4)) === 0) {
            weeklyData.push({
                date: format(new Date(transaction.transaction_date), 'MMM dd'),
                balance,
            });
        }
    });

    return weeklyData.length > 0 ? weeklyData : [{ date: 'Now', balance: initialBalance }];
}
