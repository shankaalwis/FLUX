export const formatCurrency = (amount: number, currency = 'LKR') => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount).replace('LKR', 'Rs.');
};

/** Format a number as a plain amount string, always showing 2 decimal places. e.g. 1234 → "1,234.00" */
export const formatAmount = (amount: number): string =>
    amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatCompactNumber = (number: number) => {
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

export const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
};
