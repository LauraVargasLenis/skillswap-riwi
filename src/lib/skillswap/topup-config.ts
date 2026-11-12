/** Example COP prices only. Real charging intentionally has no implementation. */
export const TEST_PACKAGES = [
  { minutes: 15, priceCop: 5000 },
  { minutes: 30, priceCop: 9000 },
  { minutes: 60, priceCop: 16000 },
] as const;
export const REAL_CHARGING_ENABLED = false;