export interface CompanyProfile {
  name: string;
  turnoverCr: string; // Using string to handle inputs
  experienceYears: number;
  capacityUtilization: number;
  officeLocations: string[];
  certifications: string[];
  pastProjects: string;
  updatedAt?: string;
}

export type TenderStatus = 'Analyzing' | 'Active' | 'Submitted' | 'Won' | 'Lost' | 'Archived';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface BidStrategy {
  marginPercent: number;
  bidAmount: number;
  winProbability: number;
  rationale: string;
}

export interface BidLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitRate: number;
  total: number;
  rationale: string;
}

export interface CostCalculator {
  material: number;
  labour: number;
  transport: number;
  siteExpenses: number;
  consultancy: number;
  customCosts?: { id: string; name: string; value: number }[];
  profitPercent: number;
  gstPercent: number;
  tdsPercent: number;
  contingencyPercent: number;
  finalBidValue?: number;
  
  lineItems?: BidLineItem[];
  strategies?: {
    conservative: BidStrategy;
    recommended: BidStrategy;
    aggressive: BidStrategy;
  };
  benchmarkingNote?: string;
  selectedStrategy?: 'conservative' | 'recommended' | 'aggressive' | 'custom';
}

export interface TenderAnalysis {
  matchScore: number;
  matchRationale: {
    turnover: string;
    experience: string;
    certifications: string;
    location: string;
  };
  baseValueEstimated: number;
  bidValueBands: {
    conservative: { min: number; max: number; rationale: string };
    recommended: { min: number; max: number; rationale: string };
    aggressive: { min: number; max: number; rationale: string };
  };
  safeMarginTargetPercent: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  winProbability: number;
  recommendationDecision: 'Participate' | 'Participate with Caution' | 'Avoid';
  recommendationReason: string;
  scopeSummary: string;
  prosCons: { pros: string[]; cons: string[] };
  criticalDates: {
    preBidMeeting: string;
    queryDeadline: string;
    submissionDeadline: string;
    executionDuration: string;
  };
  roadmap: string[];
  winningStrategy: string[];
  checklists: {
    mandatory: { name: string; reason: string }[];
    optional: { name: string; reason: string }[];
  };
}

export interface GeneratedDocuments {
  [key: string]: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CheckedDocuments {
  [docName: string]: boolean;
}

export interface AdditionalDocument {
  id: string;
  name: string;
  type: string;
  content?: string;
  fileUrl?: string;
  applied: boolean;
  dateAdded: string;
}

export interface TenderRecord {
  id: string;
  userId: string;
  projectName: string;
  originalTitle: string;
  authority: string;
  tenderNumber: string;
  status: TenderStatus;
  createdAt: string;
  updatedAt: string;
  analysis: TenderAnalysis;
  calculator: CostCalculator;
  checkedMandatory: CheckedDocuments;
  checkedOptional: CheckedDocuments;
  generatedDocs: GeneratedDocuments;
  additionalDocuments?: AdditionalDocument[];
}