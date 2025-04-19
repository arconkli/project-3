export const formatMoney = (amount: number, minimumFractionDigits = 0, maximumFractionDigits = 0) => {
  // Safely handle various input types
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  
  // Check if the input already has a dollar sign to prevent double $ signs
  if (typeof amount === 'string' && amount.startsWith('$')) {
    // Remove the dollar sign and parse the numeric part
    const numericValue = parseFloat(amount.substring(1).replace(/,/g, ''));
    if (isNaN(numericValue)) {
      return '$0';
    }
    amount = numericValue;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatCurrency = (amount: number): string => {
  // Apply the same safeguards as formatMoney
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  
  // Check if the input already has a dollar sign to prevent double $ signs
  if (typeof amount === 'string' && amount.startsWith('$')) {
    // Remove the dollar sign and parse the numeric part
    const numericValue = parseFloat(amount.substring(1).replace(/,/g, ''));
    if (isNaN(numericValue)) {
      return '$0';
    }
    amount = numericValue;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};