export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type PaymentHistoryItem = {
  id: string;
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
  created_at: string;
};

export type PayRentResponse = {
  payment_id: string;
  status: string;
  amount: number;
  currency: string;
  invoice_number: string;
  checkout_request_id: string | null;
};
