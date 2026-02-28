import { useCallback, useMemo, useState } from 'react';

import { formatNumber } from '@/utils/formatting';
import { safeFloat } from '@/utils/global';

export const TPSL_BASE_UNITS = ['$', '%'] as const;

export type TPSLBaseUnit = (typeof TPSL_BASE_UNITS)[number];

export type TpSlLeg = 'tp' | 'sl';

export interface TPSLInputBindings {
  title: string;
  price: string;
  gain: string;
  baseUnit: TPSLBaseUnit;
  pricePlaceholder: string;
  gainPlaceholder: string;
  isStopLoss: boolean;
  placedPrice?: string;
  expectedGain?: string;
  onPriceChange: (value: string) => void;
  onGainChange: (value: string) => void;
  onUnitChange: (unit: TPSLBaseUnit) => void;
  cancelOrder?: () => void;
}

export interface ConfigureAmountSliderBindings {
  value: number;
  min: number;
  max: number;
  step: number;
  marks: { value: number }[];
  onChange: (value: number) => void;
}

export interface ConfigureAmountBindings {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  slider: ConfigureAmountSliderBindings;
  amount: string;
  onAmountChange: (value: string) => void;
  baseCurrency: string;
}

export interface LimitPriceBindings {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  tpLimitPrice: string;
  onTpLimitPriceChange: (value: string) => void;
  slLimitPrice: string;
  onSlLimitPriceChange: (value: string) => void;
}

export interface TpSlUIBindings {
  tpInput: TPSLInputBindings;
  slInput: TPSLInputBindings;
  configureAmount: ConfigureAmountBindings;
  limitPrice: LimitPriceBindings;
}

export interface UseTPSLParams {
  basePrice: number;
  leverage: number;
  orderSize?: number | string;
  instrumentName?: string;
  tpOrderPlacedPrice?: string;
  slOrderPlacedPrice?: string;
  initialTpPrice?: string;
  initialTpGain?: string;
  initialSlPrice?: string;
  initialSlGain?: string;
  initialBaseUnit?: TPSLBaseUnit;
  initialConfigureAmount?: boolean;
  initialConfiguredAmount?: string;
  initialConfiguredAmountSlider?: number;
  initialUseLimitPrice?: boolean;
  initialTpLimitPrice?: string;
  initialSlLimitPrice?: string;
  onCancelTPOrder?: () => void;
  onCancelSLOrder?: () => void;
}

export interface UseTPSLResult {
  ui: TpSlUIBindings;
  state: {
    tpPrice: string;
    tpGain: string;
    slPrice: string;
    slGain: string;
    baseUnit: TPSLBaseUnit;
    configureAmount: boolean;
    configuredAmount: string;
    configuredAmountSlider: number;
    useLimitPrice: boolean;
    tpLimitPrice: string;
    slLimitPrice: string;
    baseCurrency: string;
    tpOrderPlacedPrice?: string;
    slOrderPlacedPrice?: string;
  };
  derived: {
    expectedProfit?: string;
    expectedLoss?: string;
    maxPositionSize: number;
  };
  helpers: {
    calculateOrderPriceFromTrigger: (triggerPx: string, slippage?: number) => string;
    getOrderSizeForPlacement: (defaultSize: number | string) => string;
  };
}

const formatPriceValue = (value: number) => {
  if (!Number.isFinite(value)) return '';
  return Math.round(value).toString();
};

const formatGainValue = (value: number) => {
  if (!Number.isFinite(value)) return '';
  const fixed = value.toFixed(2);
  return fixed === '-0.00' ? '0.00' : fixed;
};

export const useTPSL = ({
  basePrice,
  leverage,
  orderSize,
  instrumentName,
  tpOrderPlacedPrice,
  slOrderPlacedPrice,
  initialTpPrice = '',
  initialTpGain = '',
  initialSlPrice = '',
  initialSlGain = '',
  initialBaseUnit = '%',
  initialConfigureAmount = false,
  initialConfiguredAmount = '',
  initialConfiguredAmountSlider = 0,
  initialUseLimitPrice = false,
  initialTpLimitPrice = '',
  initialSlLimitPrice = '',
  onCancelTPOrder,
  onCancelSLOrder,
}: UseTPSLParams): UseTPSLResult => {
  const [tpPrice, setTpPrice] = useState<string>(initialTpPrice);
  const [tpGain, setTpGain] = useState<string>(initialTpGain);
  const [slPrice, setSlPrice] = useState<string>(initialSlPrice);
  const [slGain, setSlGain] = useState<string>(initialSlGain);
  const [baseUnit, setBaseUnit] = useState<TPSLBaseUnit>(initialBaseUnit);

  const [configureAmount, setConfigureAmount] = useState<boolean>(initialConfigureAmount);
  const [configuredAmount, setConfiguredAmount] = useState<string>(initialConfiguredAmount);
  const [configuredAmountSlider, setConfiguredAmountSlider] = useState<number>(
    initialConfiguredAmountSlider,
  );

  const [useLimitPrice, setUseLimitPrice] = useState<boolean>(initialUseLimitPrice);
  const [tpLimitPrice, setTpLimitPrice] = useState<string>(initialTpLimitPrice);
  const [slLimitPrice, setSlLimitPrice] = useState<string>(initialSlLimitPrice);

  const isLong = safeFloat(orderSize ?? 0) > 0;
  const positionValue = Math.abs(safeFloat(orderSize ?? 0) * basePrice);
  const maxPositionSize = Math.abs(safeFloat(orderSize ?? 0));
  const baseCurrency = instrumentName?.split('-')[0] ?? '';

  const calculateDollarPnl = useCallback(
    (priceValue: number) => {
      if (!basePrice) return 0;
      const priceChange = priceValue - basePrice;
      if (positionValue && positionValue > 0) {
        const actualPnl = (priceChange / basePrice) * positionValue;
        return isLong ? actualPnl : -actualPnl;
      }
      const directionMultiplier = isLong ? 1 : -1;
      return priceChange * directionMultiplier;
    },
    [basePrice, positionValue, isLong],
  );

  const calculatePercentPnl = useCallback(
    (priceValue: number) => {
      if (!basePrice || !leverage) return 0;
      const pricePercentChange = ((priceValue - basePrice) / basePrice) * 100;
      const directionMultiplier = isLong ? 1 : -1;
      return pricePercentChange * leverage * directionMultiplier;
    },
    [basePrice, leverage, isLong],
  );

  const calculatePriceFromDollarPnl = useCallback(
    (dollarPnl: number) => {
      if (!basePrice) return basePrice;
      if (positionValue && positionValue > 0) {
        const directionMultiplier = isLong ? 1 : -1;
        const priceChange = (dollarPnl / positionValue) * basePrice * directionMultiplier;
        return basePrice + priceChange;
      }
      const directionMultiplier = isLong ? 1 : -1;
      return basePrice + dollarPnl * directionMultiplier;
    },
    [basePrice, positionValue, isLong],
  );

  const calculatePriceFromPercentPnl = useCallback(
    (percentPnl: number) => {
      if (!basePrice || !leverage) return basePrice;
      const directionMultiplier = isLong ? 1 : -1;
      const effectivePercent = (percentPnl / leverage) * directionMultiplier;
      return basePrice * (1 + effectivePercent / 100);
    },
    [basePrice, leverage, isLong],
  );

  const recomputeGainForLeg = useCallback(
    (leg: TpSlLeg, unit: TPSLBaseUnit, priceStr: string) => {
      const priceValue = safeFloat(priceStr ?? 0);
      if (!basePrice || !priceValue) return '';

      const roundedPrice = Math.round(priceValue);
      const signedMultiplier = leg === 'sl' ? -1 : 1;

      if (unit === '$') {
        const pnl = calculateDollarPnl(roundedPrice);
        return formatGainValue(pnl * signedMultiplier);
      }

      const pnlPercent = calculatePercentPnl(roundedPrice);
      return formatGainValue(pnlPercent * signedMultiplier);
    },
    [basePrice, calculateDollarPnl, calculatePercentPnl],
  );

  const updateLegPrice = useCallback(
    (leg: TpSlLeg, priceStr: string) => {
      // Same validation as limit price input
      const value = priceStr.replaceAll(',', '');
      const isValidInput = value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value);
      if (!isValidInput) return;

      const setPrice = leg === 'tp' ? setTpPrice : setSlPrice;
      const setGain = leg === 'tp' ? setTpGain : setSlGain;

      // If empty, just a period, or ends with period - preserve input as-is (allow typing decimals)
      if (value === '' || value === '.' || value.endsWith('.')) {
        setPrice(value);
        setGain('');
        return;
      }

      const priceValue = safeFloat(value);

      if (!basePrice || !priceValue) {
        setPrice(value);
        setGain('');
        return;
      }

      // Store the user's input as-is (preserve decimals), calculate gain from numeric value
      const signedMultiplier = leg === 'sl' ? -1 : 1;

      if (baseUnit === '$') {
        const pnl = calculateDollarPnl(priceValue);
        setPrice(value);
        setGain(formatGainValue(pnl * signedMultiplier));
        return;
      }

      const pnlPercent = calculatePercentPnl(priceValue);
      setPrice(value);
      setGain(formatGainValue(pnlPercent * signedMultiplier));
    },
    [basePrice, baseUnit, calculateDollarPnl, calculatePercentPnl],
  );

  const updateLegGain = useCallback(
    (leg: TpSlLeg, gainStr: string) => {
      // Same validation as limit price input
      const value = gainStr.replaceAll(',', '');
      const isValidInput = value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value);
      if (!isValidInput) return;

      const setPrice = leg === 'tp' ? setTpPrice : setSlPrice;
      const setGain = leg === 'tp' ? setTpGain : setSlGain;

      // If empty, just a period, or ends with period - preserve input as-is (allow typing decimals)
      if (value === '' || value === '.' || value.endsWith('.')) {
        setGain(value);
        setPrice('');
        return;
      }

      const gainValue = safeFloat(value);

      if (!basePrice || gainValue === null || gainValue === undefined) {
        setGain(value);
        setPrice('');
        return;
      }

      const signedMultiplier = leg === 'sl' ? -1 : 1;
      const adjustedGain = gainValue * signedMultiplier;

      let calculatedPrice: number;
      if (baseUnit === '$') {
        calculatedPrice = calculatePriceFromDollarPnl(adjustedGain);
      } else {
        calculatedPrice = calculatePriceFromPercentPnl(adjustedGain);
      }

      const roundedPrice = formatPriceValue(calculatedPrice);
      setGain(value);
      setPrice(roundedPrice);
    },
    [basePrice, baseUnit, calculatePriceFromDollarPnl, calculatePriceFromPercentPnl],
  );

  const handleBaseUnitChange = useCallback(
    (unit: TPSLBaseUnit) => {
      setBaseUnit(unit);
      setTpGain(recomputeGainForLeg('tp', unit, tpPrice));
      setSlGain(recomputeGainForLeg('sl', unit, slPrice));
    },
    [recomputeGainForLeg, tpPrice, slPrice],
  );

  const expectedProfit = useMemo(() => {
    const tp = safeFloat(tpOrderPlacedPrice ?? tpPrice);
    if (!basePrice || !tp) return undefined;

    if (baseUnit === '$') {
      const pnl = calculateDollarPnl(tp);
      return formatNumber(pnl, {
        currency: '$',
        decimals: 0,
        useGrouping: true,
      });
    }

    const pnlPercent = calculatePercentPnl(tp);
    return formatNumber(pnlPercent, {
      isPercentage: true,
      decimals: 0,
      useGrouping: false,
    });
  }, [basePrice, tpPrice, tpOrderPlacedPrice, baseUnit, calculateDollarPnl, calculatePercentPnl]);

  const expectedLoss = useMemo(() => {
    const sl = safeFloat(slOrderPlacedPrice ?? slPrice);
    if (!basePrice || !sl) return undefined;

    if (baseUnit === '$') {
      const pnl = calculateDollarPnl(sl);
      return formatNumber(pnl, {
        currency: '$',
        decimals: 0,
        useGrouping: true,
      });
    }

    const pnlPercent = calculatePercentPnl(sl);
    return formatNumber(pnlPercent, {
      isPercentage: true,
      decimals: 0,
      useGrouping: false,
    });
  }, [basePrice, slPrice, slOrderPlacedPrice, baseUnit, calculateDollarPnl, calculatePercentPnl]);

  const sliderConfig = useMemo(() => {
    const min = 0;
    const step = maxPositionSize > 0 ? maxPositionSize / 100 : 0.0001;
    const marks =
      maxPositionSize > 0
        ? Array.from({ length: 6 }, (_, i) => ({ value: (i / 5) * maxPositionSize }))
        : [];

    return {
      min,
      max: maxPositionSize,
      step,
      marks,
    };
  }, [maxPositionSize]);

  const handleSliderChange = useCallback(
    (value: number) => {
      const clampedValue = Math.min(maxPositionSize, Math.max(0, value));
      setConfiguredAmountSlider(clampedValue);
      setConfiguredAmount(
        formatNumber(clampedValue, {
          useContractSize: true,
          instrument_name: instrumentName,
          preserveDecimalString: true,
        }),
      );
    },
    [instrumentName, maxPositionSize],
  );

  const handleConfigureAmountChange = useCallback(
    (value: string) => {
      setConfiguredAmount(value);
      const numValue = safeFloat(value);
      if (numValue >= 0) {
        const clampedValue = Math.min(maxPositionSize, Math.max(0, numValue));
        setConfiguredAmountSlider(clampedValue);
      }
    },
    [maxPositionSize],
  );

  const handleConfigureAmountToggle = useCallback((enabled: boolean) => {
    setConfigureAmount(enabled);
    if (!enabled) {
      setConfiguredAmount('');
      setConfiguredAmountSlider(0);
    }
  }, []);

  const handleLimitPriceToggle = useCallback((enabled: boolean) => {
    setUseLimitPrice(enabled);
    if (!enabled) {
      setTpLimitPrice('');
      setSlLimitPrice('');
    }
  }, []);

  const handleTpLimitPriceChange = useCallback((valueStr: string) => {
    // Same validation as limit price input
    const value = valueStr.replaceAll(',', '');
    const isValidInput = value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value);
    if (isValidInput) {
      setTpLimitPrice(value);
    }
  }, []);

  const handleSlLimitPriceChange = useCallback((valueStr: string) => {
    // Same validation as limit price input
    const value = valueStr.replaceAll(',', '');
    const isValidInput = value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value);
    if (isValidInput) {
      setSlLimitPrice(value);
    }
  }, []);

  const calculateOrderPriceFromTrigger = useCallback(
    (triggerPx: string, slippage: number = 0.06) => {
      const triggerPrice = Number(triggerPx);
      if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) {
        return triggerPx;
      }

      const multiplier = isLong ? 1 - slippage : 1 + slippage;
      const orderPrice = triggerPrice * multiplier;

      return formatNumber(orderPrice, {
        useTickSize: true,
        instrument_name: instrumentName,
        useGrouping: false,
        preserveDecimalString: true,
      });
    },
    [instrumentName, isLong],
  );

  const getOrderSizeForPlacement = useCallback(
    (defaultSize: number | string) => {
      if (configureAmount && configuredAmount) {
        return formatNumber(configuredAmount, {
          useContractSize: true,
          instrument_name: instrumentName,
          useGrouping: false,
          preserveDecimalString: true,
        });
      }

      return typeof defaultSize === 'string'
        ? String(Math.abs(Number(defaultSize)))
        : String(Math.abs(defaultSize));
    },
    [configureAmount, configuredAmount, instrumentName],
  );

  const tpInput: TPSLInputBindings = {
    title: 'Take Profit Price',
    price: tpPrice,
    gain: tpGain,
    baseUnit,
    pricePlaceholder: 'TP Price',
    gainPlaceholder: 'Profit',
    isStopLoss: false,
    placedPrice: tpOrderPlacedPrice,
    expectedGain: expectedProfit,
    onPriceChange: (value) => updateLegPrice('tp', value),
    onGainChange: (value) => updateLegGain('tp', value),
    onUnitChange: handleBaseUnitChange,
    cancelOrder: onCancelTPOrder,
  };

  const slInput: TPSLInputBindings = {
    title: 'Stop Loss Price',
    price: slPrice,
    gain: slGain,
    baseUnit,
    pricePlaceholder: 'SL Price',
    gainPlaceholder: 'Loss',
    isStopLoss: true,
    placedPrice: slOrderPlacedPrice,
    expectedGain: expectedLoss,
    onPriceChange: (value) => updateLegPrice('sl', value),
    onGainChange: (value) => updateLegGain('sl', value),
    onUnitChange: handleBaseUnitChange,
    cancelOrder: onCancelSLOrder,
  };

  const configureAmountBindings: ConfigureAmountBindings = {
    enabled: configureAmount,
    onToggle: handleConfigureAmountToggle,
    slider: {
      value: configuredAmountSlider,
      min: sliderConfig.min,
      max: sliderConfig.max,
      step: sliderConfig.step,
      marks: sliderConfig.marks,
      onChange: handleSliderChange,
    },
    amount: configuredAmount,
    onAmountChange: handleConfigureAmountChange,
    baseCurrency,
  };

  const limitPriceBindings: LimitPriceBindings = {
    enabled: useLimitPrice,
    onToggle: handleLimitPriceToggle,
    tpLimitPrice,
    onTpLimitPriceChange: handleTpLimitPriceChange,
    slLimitPrice,
    onSlLimitPriceChange: handleSlLimitPriceChange,
  };

  return {
    ui: {
      tpInput,
      slInput,
      configureAmount: configureAmountBindings,
      limitPrice: limitPriceBindings,
    },
    state: {
      tpPrice,
      tpGain,
      slPrice,
      slGain,
      baseUnit,
      configureAmount,
      configuredAmount,
      configuredAmountSlider,
      useLimitPrice,
      tpLimitPrice,
      slLimitPrice,
      baseCurrency,
      tpOrderPlacedPrice,
      slOrderPlacedPrice,
    },
    derived: {
      expectedProfit,
      expectedLoss,
      maxPositionSize,
    },
    helpers: {
      calculateOrderPriceFromTrigger,
      getOrderSizeForPlacement,
    },
  };
};
