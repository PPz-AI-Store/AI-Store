import type { Product } from "./products";

const MIN_CHARGE_CNY = 0.1;
const MARKUP_THRESHOLD_CNY = 0.1;
const MARKUP_MULTIPLIER = 1.5;

/** 新用户体验余额 */
export const TRIAL_BALANCE_CNY = 0.1;

export type PriceBreakdown = {
  costCny: number;
  chargeCny: number;
  /** 是否按成本价出售（未加价） */
  atCost: boolean;
  /** 加价比例说明 */
  markupNote?: string;
};

/** 根据成本计算向用户收取的价格 */
export function calculateChargePrice(costCny: number): PriceBreakdown {
  if (costCny < MARKUP_THRESHOLD_CNY) {
    return {
      costCny,
      chargeCny: costCny,
      atCost: true,
    };
  }
  return {
    costCny,
    chargeCny: roundMoney(costCny * MARKUP_MULTIPLIER),
    atCost: false,
    markupNote: `成本 ≥ ¥${MARKUP_THRESHOLD_CNY}，按成本价 150% 出售`,
  };
}

export type PayLaterCharge = {
  /** 实际向用户收取的金额 */
  chargeAmount: number;
  /** 超出成本的部分充值到余额 */
  balanceCredit: number;
};

/**
 * 先用后付：价格低于 0.1 元时先收 0.1 元，差额充入余额
 */
export function calculatePayLaterCharge(costCny: number): PayLaterCharge {
  const { chargeCny } = calculateChargePrice(costCny);
  if (chargeCny < MIN_CHARGE_CNY) {
    return {
      chargeAmount: MIN_CHARGE_CNY,
      balanceCredit: roundMoney(MIN_CHARGE_CNY - chargeCny),
    };
  }
  return { chargeAmount: chargeCny, balanceCredit: 0 };
}

export function getProductPricing(product: Product): PriceBreakdown {
  return calculateChargePrice(product.costCny);
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 10000) / 10000;
}

export function formatCny(amount: number): string {
  if (amount === 0) return "¥0.00";
  if (amount < 0.01) return `¥${amount.toFixed(4)}`;
  if (amount < 1) return `¥${amount.toFixed(4)}`;
  return `¥${amount.toFixed(2)}`;
}
