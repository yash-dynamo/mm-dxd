const DEFAULT_THRESHOLD_PERCENTAGE = 0.15;
const DEFAULT_FLASH_DURATION_MS = 600;

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

export interface OrderbookFlashConfig {
  thresholdPercentage: number;
  flashDuration: number;
}

export const getOrderbookFlashConfig = (): OrderbookFlashConfig => {
  const thresholdPercentage = clamp(
    parseNumber(process.env.NEXT_PUBLIC_ORDERBOOK_FLASH_THRESHOLD, DEFAULT_THRESHOLD_PERCENTAGE),
    0,
    1,
  );

  const flashDuration = Math.max(
    0,
    parseNumber(process.env.NEXT_PUBLIC_ORDERBOOK_FLASH_DURATION, DEFAULT_FLASH_DURATION_MS),
  );

  return {
    thresholdPercentage,
    flashDuration,
  };
};
