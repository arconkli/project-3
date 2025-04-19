import { CampaignFormData, ViewEstimates } from './types';

// Calculate estimated views based on budget and rates
const _internalCalculateEstimatedViews = (
  budget: string,
  originalRate: string,
  repurposedRate: string,
  contentType: 'original' | 'repurposed' | 'both',
  budgetAllocation: { original: number; repurposed: number }
): ViewEstimates => {
  // Parse budget once and preserve exact value
  const budgetValue = parseFloat(budget);
  
  // Handle invalid budget values
  if (isNaN(budgetValue) || budgetValue <= 0) {
    return { originalViews: 0, repurposedViews: 0, totalViews: 0 };
  }
  
  const originalRateValue = parseFloat(originalRate) || 500;
  const repurposedRateValue = parseFloat(repurposedRate) || 250;

  if (contentType === 'original') {
    const views = (budgetValue / originalRateValue) * 1000000;
    return { originalViews: views, repurposedViews: 0, totalViews: views };
  } else if (contentType === 'repurposed') {
    const views = (budgetValue / repurposedRateValue) * 1000000;
    return { originalViews: 0, repurposedViews: views, totalViews: views };
  } else {
    // For 'both' content type, use exact percentages without rounding
    const originalPercent = budgetAllocation.original / 100;
    const repurposedPercent = budgetAllocation.repurposed / 100;
    
    // Calculate budgets without rounding
    const originalBudget = budgetValue * originalPercent;
    const repurposedBudget = budgetValue * repurposedPercent;
    
    const originalViews = (originalBudget / originalRateValue) * 1000000;
    const repurposedViews = (repurposedBudget / repurposedRateValue) * 1000000;

    return {
      originalViews,
      repurposedViews,
      totalViews: originalViews + repurposedViews,
    };
  }
};

// Format money values
const formatMoney = (amount: number) => {
  if (isNaN(amount) || amount === undefined || amount === null) {
    return '$0';
  }
  
  // Format with Intl.NumberFormat without using suffixes
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format numbers in millions
const formatMillions = (num: number) => {
  if (isNaN(num) || num === undefined || num === null) {
    return '0';
  }
  
  // Format with commas for thousands separators
  return new Intl.NumberFormat('en-US').format(Math.round(num));
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get today's date formatted as YYYY-MM-DD
const getToday = () => new Date().toISOString().split('T')[0];

// Get date 30 days from now
const getDefaultEndDate = () => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return thirtyDaysFromNow.toISOString().split('T')[0];
};

// Get initial form data
const getInitialFormData = (paymentMethodId?: string): CampaignFormData => ({
  title: '',
  brief: {
    original: '',
    repurposed: '',
  },
  platforms: {
    tiktok: false,
    instagram: false,
    youtube: false,
    twitter: false,
  },
  contentType: 'original',
  budgetAllocation: {
    original: 70,
    repurposed: 30,
  },
  startDate: getToday(),
  endDate: getDefaultEndDate(),
  budget: '1000',
  payoutRate: {
    original: '500',
    repurposed: '250',
  },
  hashtags: {
    original: '',
    repurposed: '',
  },
  guidelines: {
    original: [''],
    repurposed: [''],
  },
  assets: [],
  paymentMethod: paymentMethodId || '',
  termsAccepted: false
});

// Calculate Estimated Views (Keep existing function as it might be used elsewhere, e.g., UI preview)
const calculateEstimatedViews = (
  budget: string,
  payoutRateOriginal: string,
  payoutRateRepurposed: string,
  contentType: 'original' | 'repurposed' | 'both',
  budgetAllocation: { original: number; repurposed: number }
) => {
  const budgetValue = parseFloat(budget) || 0;
  const originalRate = parseFloat(payoutRateOriginal) || 0;
  const repurposedRate = parseFloat(payoutRateRepurposed) || 0;

  let totalViews = 0;
  let originalViews = 0;
  let repurposedViews = 0;

  // Simple example: Assume rate is per 1M views
  // This logic seems flawed based on original request, but we keep it for the UI display
  if (contentType === 'original') {
    if (originalRate > 0) {
      totalViews = (budgetValue / originalRate) * 1_000_000;
    }
    originalViews = totalViews;
  } else if (contentType === 'repurposed') {
    if (repurposedRate > 0) {
      totalViews = (budgetValue / repurposedRate) * 1_000_000;
    }
    repurposedViews = totalViews;
  } else if (contentType === 'both') {
    const originalBudgetAllocation = budgetValue * (budgetAllocation.original / 100);
    const repurposedBudgetAllocation = budgetValue * (budgetAllocation.repurposed / 100);
    
    if (originalRate > 0) {
      originalViews = (originalBudgetAllocation / originalRate) * 1_000_000;
    }
    if (repurposedRate > 0) {
      repurposedViews = (repurposedBudgetAllocation / repurposedRate) * 1_000_000;
    }
    totalViews = originalViews + repurposedViews;
  }

  return {
    totalViews: Math.round(totalViews),
    originalViews: Math.round(originalViews),
    repurposedViews: Math.round(repurposedViews),
  };
};

// NEW: Calculate View Targets for Saving to DB
export const calculateViewTargets = (
  budget: string,
  costPerMillionOriginal: string, // Using payoutRate as cost per million views
  costPerMillionRepurposed: string,
  contentType: 'original' | 'repurposed' | 'both',
  budgetAllocation: { original: number; repurposed: number }
): { total: number; original: number; repurposed: number } => {
  const budgetValue = parseFloat(budget) || 0;
  const cpmOriginal = parseFloat(costPerMillionOriginal) || 0;
  const cpmRepurposed = parseFloat(costPerMillionRepurposed) || 0;

  let totalTarget = 0;
  let originalTarget = 0;
  let repurposedTarget = 0;

  // Calculate total target based on an average or primary CPM if possible?
  // If 'both', maybe average the CPMs based on allocation? Or just use original?
  // Let's assume if 'both', the 'original' CPM is the primary driver for the total pot, or we need a separate total CPM field.
  // For simplicity, let's recalculate total based on split targets if type is 'both'.

  if (contentType === 'original') {
    if (cpmOriginal > 0) {
      totalTarget = Math.round((budgetValue / cpmOriginal) * 1_000_000);
    }
    originalTarget = totalTarget;
    repurposedTarget = 0;
  } else if (contentType === 'repurposed') {
    if (cpmRepurposed > 0) {
      totalTarget = Math.round((budgetValue / cpmRepurposed) * 1_000_000);
    }
    originalTarget = 0;
    repurposedTarget = totalTarget;
  } else if (contentType === 'both') {
    const originalBudgetAllocation = budgetValue * (budgetAllocation.original / 100);
    const repurposedBudgetAllocation = budgetValue * (budgetAllocation.repurposed / 100);
    
    if (cpmOriginal > 0) {
      originalTarget = Math.round((originalBudgetAllocation / cpmOriginal) * 1_000_000);
    }
    if (cpmRepurposed > 0) {
      repurposedTarget = Math.round((repurposedBudgetAllocation / cpmRepurposed) * 1_000_000);
    }
    // Recalculate total as the sum of the parts for 'both'
    totalTarget = originalTarget + repurposedTarget;
  }

  // Return targets rounded to the nearest whole number
  return {
    total: totalTarget,
    original: originalTarget,
    repurposed: repurposedTarget,
  };
};

// Export all functions once
export {
  calculateEstimatedViews,
  formatMoney,
  formatMillions,
  formatDate,
  getInitialFormData
};