export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export type RentDueSummary = {
  is_due: boolean;
  invoice_id?: string;
  invoice_number?: string;
  amount: number;
  currency: string;
  due_date?: string;
  status?: InvoiceStatus;
  days_overdue?: number;
  billing_period_start?: string;
  billing_period_end?: string;
};

export type RentDueItem = {
  lease_id: string;
  property_title: string;
  rent_due: RentDueSummary;
};

export type InvoiceListItem = {
  id: string;
  lease_id: string;
  property_title: string;
  invoice_number: string;
  amount: string;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  billing_period_start: string;
  billing_period_end: string;
  description: string;
  paid_at: string | null;
  created_at: string;
};

export type PaymentHistoryItem = {
  id: string;
  lease_id: string;
  invoice_number: string;
  property_title: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  phone_number: string | null;
  mpesa_receipt_number: string | null;
  mpesa_transaction_date: string | null;
  completed_at: string | null;
  receipt_number: string | null;
  receipt_id: string | null;
  created_at: string;
};

export type PayRentResponse = {
  payment_id: string;
  status: string;
  amount: number;
  currency: string;
  invoice_number: string;
  checkout_request_id: string | null;
  dev_mode?: boolean;
};

export type PaymentReceipt = {
  id: string;
  receipt_number: string;
  invoice_number: string;
  payment_amount: string;
  payment_currency: string;
  mpesa_receipt_number: string;
  completed_at: string | null;
  receipt_file_url: string | null;
  emailed_at: string | null;
  created_at: string;
};

export type LandlordIncomeSummary = {
  month: string;
  total_collected: string;
  currency: string;
  payment_count: number;
  pending_invoices: number;
  overdue_invoices: number;
};

export type LandlordCollectedPayment = {
  id: string;
  tenant_name: string;
  property_title: string;
  invoice_number: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  mpesa_receipt_number: string | null;
  completed_at: string | null;
  created_at: string;
};
