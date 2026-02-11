import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = "USD"): string {
  // If currency is KRW or JPY, remove decimals
  const isNoDecimal = currency === "KRW" || currency === "JPY";

  // Map of common currencies to locales/symbols if needed (Intl handles most)
  // For KRW, we might want 'ko-KR' locale but 'en-US' with currency code is also fine for global apps.
  // Let's stick to en-US for consistent number formatting (comma usage) but use correct currency code.

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: isNoDecimal ? 0 : 2,
    minimumFractionDigits: isNoDecimal ? 0 : 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
