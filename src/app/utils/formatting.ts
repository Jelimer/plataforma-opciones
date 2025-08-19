'use client';

/**
 * Formats a number using European/South American style (dots for thousands, comma for decimals).
 * @param value The number to format.
 * @param decimals The number of decimal places to show. Defaults to 2.
 * @returns A formatted string.
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
    if (isNaN(value)) {
        return 'N/A';
    }
    // Using 'de-DE' locale as it provides the desired format (e.g., 1.234,56)
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/**
 * Formats a number as a currency string.
 * @param value The number to format.
 * @returns A formatted currency string (e.g., $1.234,56).
 */
export const formatCurrency = (value: number): string => {
    if (isNaN(value)) {
        return 'N/A';
    }
    return `$${formatNumber(value)}`;
};
