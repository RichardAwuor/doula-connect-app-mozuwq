
export type UserType = 'parent' | 'doula';
export type Language = 'english' | 'spanish';

export type ServiceCategory = 'birth' | 'postpartum';
export type FinancingType = 'self' | 'carrot' | 'medicaid';
export type SpokenLanguage = 'English' | 'Spanish' | 'Chinese' | 'Tagalog' | 'Arabic' | 'Hebrew' | 'Vietnamese';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type CertificationType = 
  | 'doula_certification'
  | 'basic_life_support'
  | 'liability_insurance'
  | 'covid_immunization'
  | 'infant_sleep'
  | 'other';

export interface DocumentUpload {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface Referee {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ParentProfile {
  id: string;
  userType: 'parent';
  firstName: string;
  lastName: string;
  state: string;
  town: string;
  zipCode: string;
  serviceCategories: ServiceCategory[];
  financingType: FinancingType[];
  servicePeriodStart: Date | null;
  servicePeriodEnd: Date | null;
  preferredLanguages: SpokenLanguage[];
  desiredDays: DayOfWeek[];
  desiredStartTime: Date | null;
  desiredEndTime: Date | null;
  acceptedTerms: boolean;
  subscriptionActive: boolean;
}

export interface DoulaProfile {
  id: string;
  userType: 'doula';
  firstName: string;
  lastName: string;
  paymentPreferences: FinancingType[];
  state: string;
  town: string;
  zipCode: string;
  driveDistance: number;
  spokenLanguages: SpokenLanguage[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  serviceCategories: ServiceCategory[];
  certifications: CertificationType[];
  profilePicture: DocumentUpload | null;
  certificationDocuments: DocumentUpload[];
  referees: Referee[];
  acceptedTerms: boolean;
  subscriptionActive: boolean;
  rating?: number;
  reviewCount?: number;
}

export type UserProfile = ParentProfile | DoulaProfile;
