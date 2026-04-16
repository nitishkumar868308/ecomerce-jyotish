export type PaymentGateway = "PAYU" | "CASHFREE" | "PAYGLOCAL" | "COD" | "WALLET";

export interface PaymentInitResponse {
  success: boolean;
  orderId: string;
  paymentUrl?: string;
  sessionId?: string;
  data?: Record<string, unknown>;
}

export interface PaymentVerifyResponse {
  success: boolean;
  orderId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  transactionId?: string;
}
