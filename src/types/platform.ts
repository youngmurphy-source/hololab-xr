/**
 * HoloLab XR — Shared Platform Domain Contracts
 * Multi-School Virtual Science Education Platform
 */

export type Role = 'platform_admin' | 'school_admin' | 'teacher' | 'student';
export type Department = 'chemistry' | 'biology' | 'physics';
export type SchoolStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'disabled';
export type LabStatus = 'active' | 'archived' | 'suspended';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';
export type ProductType = 'reusable_equipment' | 'consumable_reagent' | 'experiment_bundle' | 'digital_kit';
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentStatus = 'initiated' | 'verified' | 'failed' | 'refunded';
export type TransactionType = 'purchase_credit' | 'experiment_consumption' | 'spill_loss' | 'grant' | 'reversal';

export interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  countryCode: string;
  status: SchoolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolMembership {
  id: string;
  schoolId: string;
  userId: string;
  role: Role;
  status: string;
  joinedAt: string;
}

export interface StudentProfile {
  userId: string;
  schoolId: string;
  admissionNumber: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface StudentLab {
  id: string;
  studentId: string;
  schoolId: string;
  name: string;
  status: LabStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LabSpace {
  id: string;
  labId: string;
  department: Department;
  sceneConfig: Record<string, unknown>;
  createdAt: string;
}

export interface LabSession {
  id: string;
  labSpaceId: string;
  studentId: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  stateSnapshot?: Record<string, unknown>;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  department: Department;
  category: string;
  description: string;
  assetKey?: string;
  productType: ProductType;
  priceMinor: number; // e.g., kobo for NGN (100 kobo = 1 NGN)
  currency: string;
  stockQuantity?: number;
  published: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface Order {
  id: string;
  studentId: string;
  schoolId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalMinor: number;
  totalMinor: number;
  currency: string;
  idempotencyKey: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Payment {
  id: string;
  orderId?: string;
  studentId: string;
  provider: 'paystack' | 'flutterwave' | 'mock_gateway';
  providerReference: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  verifiedAt?: string;
  createdAt: string;
}

export interface StudentInventoryItem {
  id: string;
  studentId: string;
  productId: string;
  productName: string;
  productType: ProductType;
  department: Department;
  quantity: number;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  studentId: string;
  productId: string;
  orderItemId?: string;
  transactionType: TransactionType;
  quantityDelta: number;
  createdAt: string;
}

export interface ExperimentObservation {
  id: string;
  attemptId: string;
  observationType: string;
  observation: Record<string, unknown>;
  recordedAt: string;
}

export interface ExperimentAttempt {
  id: string;
  studentId: string;
  experimentVersionId: string;
  labSessionId?: string;
  status: AttemptStatus;
  score?: number;
  startedAt: string;
  completedAt?: string;
  resultSummary?: Record<string, unknown>;
  observations?: ExperimentObservation[];
}

export interface Assignment {
  id: string;
  schoolId: string;
  classId: string;
  teacherId: string;
  experimentId: string;
  title: string;
  dueAt?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptId?: string;
  status: 'submitted' | 'graded';
  submittedAt: string;
}

export interface Grade {
  id: string;
  submissionId: string;
  teacherId: string;
  score: number;
  feedback?: string;
  gradedAt: string;
}
