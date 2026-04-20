export interface ConsultationSplitInput {
  gross: number;
  gstPercent: number;
  commissionPercent: number;
}

export interface ConsultationSplit {
  gross: number;
  gstPercent: number;
  commissionPercent: number;
  gstAmount: number;
  afterTax: number;
  commissionAmount: number;
  astrologerAmount: number;
  platformAmount: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function calculateConsultationSplit(
  input: ConsultationSplitInput,
): ConsultationSplit {
  const gross = Math.max(0, Number.isFinite(input.gross) ? input.gross : 0);
  const gstPercent = clampPercent(input.gstPercent);
  const commissionPercent = clampPercent(input.commissionPercent);

  const gstAmount = round2((gross * gstPercent) / 100);
  const afterTax = round2(gross - gstAmount);
  const commissionAmount = round2((afterTax * commissionPercent) / 100);
  const astrologerAmount = round2(afterTax - commissionAmount);
  const platformAmount = commissionAmount;

  return {
    gross: round2(gross),
    gstPercent,
    commissionPercent,
    gstAmount,
    afterTax,
    commissionAmount,
    astrologerAmount,
    platformAmount,
  };
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}
