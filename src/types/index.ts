export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';
export type UserRole = 'USER' | 'ADMIN';
export type RequestStatus = 'CREATED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';
export type PaymentType = 'WATER' | 'HEATING' | 'OTHER';
export type PaymentProvider = 'MOCK' | 'YOOKASSA';
export type MeterType = 'COLD_WATER' | 'HOT_WATER' | 'HEATING';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type Dashboard = {
  users: number;
  activeUsers: number;
  blockedUsers: number;
  activeMeters: number;
  openRequests: number;
  pendingPayments: number;
  overduePayments: number;
  paidPayments: number;
  totalPaidAmount: number;
  totalDebtAmount: number;
  readingsToday: number;
  readingsThisMonth: number;
  newUsersThisMonth: number;
  recentPayments: Array<{
    id: string;
    billingMonth: string;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
    user?: { phone: string; fullAddress: string; contractNumber: string };
  }>;
  recentReadings: Array<{
    id: string;
    value: number;
    createdAt: string;
    meter: {
      title: string;
      serialNumber: string;
      user?: { phone: string; fullAddress: string; contractNumber: string };
    };
  }>;
};

export type User = {
  id: string;
  phone: string;
  fullAddress: string;
  contractNumber: string;
  heatedArea?: number | null;
  phoneVerified?: boolean;
  status: UserStatus;
  role: UserRole;
  createdAt?: string;
  meters: { id: string }[];
  payments: { amount: number; status: PaymentStatus; billingMonth: string; type?: PaymentType }[];
};

export type SealRequest = {
  id: string;
  comment?: string | null;
  preferredDate?: string | null;
  status: RequestStatus;
  adminComment?: string | null;
  createdAt: string;
  user?: { id: string; phone: string; fullAddress: string };
  meter?: { id: string; title: string; serialNumber: string } | null;
};

export type MeterReplacement = {
  id: string;
  reason: string;
  comment?: string | null;
  status: RequestStatus;
  adminComment?: string | null;
  createdAt: string;
  newTitle: string;
  newSerialNumber: string;
  initialReading: number;
  user?: { id: string; phone: string; fullAddress: string };
  oldMeter?: { id: string; title: string; serialNumber: string };
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
};

export type Payment = {
  id: string;
  billingMonth: string;
  type?: PaymentType;
  provider?: PaymentProvider | null;
  externalPaymentId?: string | null;
  paymentUrl?: string | null;
  amount: number;
  consumption: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    phone: string;
    fullAddress: string;
    contractNumber: string;
    heatedArea?: number | null;
    status: UserStatus;
  };
};

export type CurrentUser = {
  id: string;
  phone: string;
  fullAddress: string;
  contractNumber: string;
  heatedArea?: number | null;
  phoneVerified?: boolean;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
};

export type Meter = {
  id: string;
  title: string;
  serialNumber: string;
  type: MeterType;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    phone: string;
    fullAddress: string;
    contractNumber: string;
    heatedArea?: number | null;
  };
  readings: {
    id: string;
    value: number;
    createdAt: string;
  }[];
};

export type AdminReading = {
  id: string;
  value: number;
  createdAt: string;
  meter: {
    id: string;
    title: string;
    serialNumber: string;
    type: MeterType;
    user?: {
      id: string;
      phone: string;
      fullAddress: string;
      contractNumber: string;
      heatedArea?: number | null;
    };
  };
};

export type HeatingSetting = {
  id: string;
  effectiveFromMonth: string;
  tariffPerUnit: number;
  normPerSquareMeter: number;
  seasonCoefficient: number;
  commonAreaCoefficient: number;
  lossCoefficient: number;
  createdAt: string;
  updatedAt: string;
};

export type HeatingCalculationLine = {
  id: string;
  billingMonth: string;
  method: string;
  area: number;
  previousReading?: number | null;
  currentReading?: number | null;
  rawConsumption: number;
  finalConsumption: number;
  normPerSquareMeter: number;
  seasonCoefficient: number;
  commonAreaCoefficient: number;
  lossCoefficient: number;
  tariffPerUnit: number;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    fullAddress: string;
    contractNumber: string;
    heatedArea?: number | null;
  };
  meter?: {
    id: string;
    title: string;
    serialNumber: string;
    type: MeterType;
  } | null;
};

export type HeatingGenerateResult = {
  message: string;
  billingMonth: string;
  created: number;
  skipped: { meterId: string; reason: string }[];
  runId: string;
};

export type ContractRegistryItem = {
  id: string;
  contractNumber: string;
  fullAddress: string;
  heatedArea?: number | null;
  phone?: string | null;
  isActive: boolean;
  boundUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserChangeRequest = {
  id: string;
  userId: string;
  fullAddress?: string | null;
  contractNumber?: string | null;
  heatedArea?: number | null;
  comment?: string | null;
  status: ChangeRequestStatus;
  adminComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    phone: string;
    fullAddress: string;
    contractNumber: string;
    heatedArea?: number | null;
    status: UserStatus;
  };
  reviewedBy?: { id: string; phone: string } | null;
};

export type AuditLog = {
  id: string;
  actorUserId?: string | null;
  actorPhone?: string | null;
  actorRole?: string | null;
  method: string;
  path: string;
  action: string;
  statusCode?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  request?: unknown;
  response?: unknown;
  error?: string | null;
  createdAt: string;
};
