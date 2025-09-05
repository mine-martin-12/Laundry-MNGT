export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    notation: "compact",
  }).format(amount);
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[^\d.-]/g, ''));
};