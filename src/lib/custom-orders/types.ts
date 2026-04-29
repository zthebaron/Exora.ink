/**
 * Shared types for the custom (manually-entered) orders dashboard.
 */

export type CustomOrderStatus =
  | "pending"
  | "processing"
  | "on-hold"
  | "completed"
  | "cancelled";

export interface CustomOrderItemInput {
  id?: string;
  name: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  total?: number;
  notes?: string | null;
  position?: number;
}

export interface CustomOrderInput {
  status?: CustomOrderStatus;
  source?: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCompany?: string | null;
  shippingAddress?: string | null;
  total?: number;
  currency?: string;
  paymentMethod?: string | null;
  paymentReceived?: boolean;
  customerNote?: string | null;
  internalNotes?: string | null;
  dueDate?: string | null; // ISO date string
  createdBy?: string | null;
  items?: CustomOrderItemInput[];
}

export interface CustomOrderWithItems {
  id: string;
  orderNumber: string;
  status: CustomOrderStatus;
  source: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCompany: string | null;
  shippingAddress: string | null;
  total: number;
  currency: string;
  paymentMethod: string | null;
  paymentReceived: boolean;
  customerNote: string | null;
  internalNotes: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
    notes: string | null;
    position: number;
  }>;
}

export const CUSTOM_ORDER_STATUSES: CustomOrderStatus[] = [
  "pending",
  "processing",
  "on-hold",
  "completed",
  "cancelled",
];
