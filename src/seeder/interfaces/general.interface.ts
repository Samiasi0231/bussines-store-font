import { Permissions } from '../../shared/enums/permissions.enum';
import { ICountry } from '../../shared/interfaces/country.interface';

export interface IBusiness {
  id?: string;
  name: string;
  countryOfIncorporation?: ICountry;
  // status?: BusinessStatus;
  // industry: IBusinessIndustry;
  registrationNumber?: string;
  addressUtilityDoc?: string;
  certificateOfIncorporationDoc?: string;
  identificationDoc?: string;
  memorandumAndArticlesOfAssociationDoc?: string;
  operationLicenseDoc?: string;
  stakeholders?: IStakeholder[] | any[]; // stakeholders, - directors, shareholders, ultimate beneficial holder, authorized representative
  users?: IUser[] | IUserString[];
  // riskLevel?: RiskLevel;
  email: string;
  website?: string;
  socialMediaType?: string;
  socialMediaHandle?: string;
  leadSource?: string;
  isBlacklisted?: boolean;
  // additionalInfo?: IAdditionalInfo[];
  // activities: IBusinessActivities;
  // stakeholderPep: IPepInfo;
  // stakeholderRelativePep: IPepInfo;
  contactPerson: IContactPerson;
  incorporationType: string;
  dateOfCommencingOperation: Date;
  dateOfRegistration: Date;
  phone: string;
  tradingName?: string;
  natureOfBusiness: string;
  isRegAddressSameAsOperational: boolean;
  regCountry: ICountry;
  regCity: string;
  regStateRegion: string;
  regZipCode: string;
  regAddress: string;
  opCountry: ICountry;
  opCity: string;
  opStateRegion: string;
  opZipCode: string;
  opAddress: string;
  proofOfAddressDoc: string;
  // registrationFormDoc: string;
  currentOperatingStatusDoc: string;
  // payoutCountries: string[];
  businessSummary: string;
  averageMonthlyTransactionVolume: string;
  totalValueOfBusinessAssets: string;
  annualRevenueForLastYear: string;
  mainPurposeOfAccountCreation: string;
  estimatedMonthlyTransactionVolume: string;
  numberOfEmployees: number;
  sourceOfCapital: string;
  sourceOfWealth: string;
  sourceOfFunds: string;
  payoutCurrencies: string[];
  payoutCountries: string[];

  approvedBy?: any;
  declinedBy?: any;
  verifiedBy?: any;
  rejectedBy?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBusinessIndustry {
  name: string;
  description: string;
  // risk: RiskLevel;
  fraudulentConcerns: number;
  complianceConcerns: number;
  marketVolatility: number;
  reputationConcerns: number;
  paymentProcessingChallenges: number;
  cyberSecurityRisks: number;
  globalSanctions: number;
  score: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface IStakeholder {
  id?: string;
  business?: IBusiness;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
  bvn?: string;
  nin?: string;
  isPoliticallyExposed: boolean;
  nationality: ICountry;
  country: ICountry;
  region: string;
  address: string;
  city: string;
  zipCode: string;
  copyLetterOfAuthorizationDoc: string;
  isDirectorAUbo: boolean;

  proofOfAddressDoc: string;
  governmentIdNumber: string;
  idNumber: string;
  idDateOfIssue: string;
  idExpiryDate: string;
  idType: string;
  idDoc: string;
  countryOfIssue: string;
  // type: StakeholderType;
  isSignificantController: boolean;
  percentageOwnership: string;
  // title: string; => use type
  company: IStakeholderCompany;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface IStakeholderCompany {
  name: string;
  regNum: string;
  countryOfIncorp: string;
  country: string;
  region: string;
  address: string;
  city: string;
  zipCode: string;
  proofOfAddressCompany: string;
}

export interface IStakeholderDto
  extends Omit<IStakeholder, 'nationality' | 'country'> {
  nationalityId: string;
  countryId: string;
}

export interface IContactPerson {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface IUser<T = any, S = any, U = IBusiness> {
  id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  password: string;
  role: T;
  permissions: S[];
  businesses?: U[];
  isLocked: boolean;
  isBlacklisted?: boolean;
  isBlocked?: boolean;
  isActivated: boolean;
  shouldChangePassword: boolean;
  verifyToken?: string;
}

export type IUserString = IUser<string, string, string>;
export type IPrincipal = IUserString;

export interface IRole {
  id?: string;
  name: string;
  code: string;
  isAdmin: boolean;
  isActive: boolean;
  isEditable: boolean;
  permissions: IPermission[];
  updatedAt?: Date;
  createdAt?: Date;
}

export interface IPermission {
  id?: string;
  name: string;
  group?: string;
  code: Permissions;
  isAdmin: boolean;
}
