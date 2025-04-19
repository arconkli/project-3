export interface CampaignFormData {
  title: string;
  brief: {
    original: string;
    repurposed: string;
  };
  goal?: string;
  platforms: {
    tiktok: boolean;
    instagram: boolean;
    youtube: boolean;
    twitter: boolean;
  };
  contentType: 'original' | 'repurposed' | 'both';
  budgetAllocation: {
    original: number;
    repurposed: number;
  };
  startDate: string;
  endDate: string;
  budget: string;
  payoutRate: {
    original: string;
    repurposed: string;
  };
  hashtags: {
    original: string;
    repurposed: string;
  };
  guidelines: {
    original: string[];
    repurposed: string[];
  };
  assets: File[];
  paymentMethod: string;
  termsAccepted: boolean;
}

export interface Step {
  title: string;
  subtitle: string;
  isComplete: (data: CampaignFormData) => boolean;
}

export interface ViewEstimates {
  originalViews: number;
  repurposedViews: number;
  totalViews: number;
}

export interface FieldErrors {
  [key: string]: string;
}