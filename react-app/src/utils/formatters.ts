export const formatCurrency = (amount: number): string => {
    return `£${amount.toFixed(2)}`;
};

export const convertSqMToSqFt = (sqm: number): number => {
    return Math.round(sqm * 10.764);
}; 