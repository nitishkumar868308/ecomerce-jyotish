export interface WalletTransaction {
  id: number;
  userId: number;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balance: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}
