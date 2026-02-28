import { useCallback, useMemo, useState, useEffect, ChangeEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserTradingDataStore, useTradingDataStore, useTradingPreferencesStore, useOrderbookDataStore } from '@/stores';
import { Ticker } from '@/types/trading';
import { getEstSlippage } from '../utils/get-est-slippage';
import { useTradeActions } from '../use-trade-actions';
import { useLimitPrice } from './use-limit-price';
import { formatNumber } from '@/utils/formatting';
import { usePathname } from 'next/navigation';
import { getBalance } from '@/utils/global';
import { useOrderSize } from './use-order-size';
import { getLiquidationPrice, getMaxValidSizeForLiquidation } from '@/utils/liquidation_price';

interface UsePlacementOrderParams {
  defaultMaxSize?: number;
  defaultReduceOnly?: boolean;
  defaultOrderSlider?: number;
  localLimitState?: boolean;
  // only for spot
  defaultSide?: 'b' | 's';
  positionPrice?: number;
  useMarkPriceForPosition?: boolean;
  isMarketClose?: boolean; //setOrderSizeFlag to detect market close modal
  isPositionClose?: boolean; // to detect position close modal
}

export const getMaxSize = (
  orderPrice: number,
  availableBalance: number,
  leverage: number,
  orderSizeMode: 'quote' | 'base',
  instrumentName: string,
  kind?: string,
  side?: 'b' | 's',
  feeRate?: number,
) => {
  let maxSizeWithoutFees = 0;

  const isSpot = kind === 'spot';
  const isSpotSell = isSpot && side === 's';

  if (orderSizeMode === 'quote') {
    if (isSpotSell) {
      maxSizeWithoutFees = availableBalance * orderPrice * leverage;
    } else {
      maxSizeWithoutFees = availableBalance * leverage;
    }
  } else {
    if (isSpotSell) {
      // Spot sell: availableBalance is already in base
      maxSizeWithoutFees = availableBalance * leverage;
    } else {
      // Spot buy or perps: availableBalance is in quote, convert to base
      maxSizeWithoutFees = (availableBalance / orderPrice) * leverage;
    }
  }

  // Subtract fees from maxSize
  // Fee rate is in percentage (e.g., 0.025 for 0.025%), so divide by 100
  // If fee is negative (rebate), use Math.abs() and still subtract
  let maxSizeWithFees = maxSizeWithoutFees;
  if (feeRate !== undefined) {
    const feeAmount = (maxSizeWithoutFees * Math.abs(feeRate)) / 100;
    maxSizeWithFees = maxSizeWithoutFees - feeAmount;
  }

  return Number(
    formatNumber(maxSizeWithFees, {
      useContractSize: true,
      instrument_name: instrumentName ?? '',
      useGrouping: false,
    }),
  );
};

export const getLimitPriceMarket = (
  ticker: Ticker | undefined,
  instrumentName: string,
  side: 'b' | 's',
  slippage: number,
): string => {

  slippage = (instrumentName == 'SILVER-PERP' || instrumentName == 'GOLD-PERP') ? 2 : slippage;

  const limitPrice = Number(ticker?.mark_price ?? ticker?.index_price ?? '0');
  // Cap slippage at 99% to prevent sell price from going to 0
  const effectiveSlippage = Math.min(slippage, 99);
  const slippageFactor = effectiveSlippage / 100;
  const delta = limitPrice * slippageFactor;
  const limitBuyPrice = formatNumber(limitPrice + delta, {
    useTickSize: true,
    instrument_name: instrumentName,
    useGrouping: false,
  });
  // Ensure sell price never goes below 1% of mark price
  const minSellPrice = limitPrice * 0.01;
  const rawSellPrice = limitPrice - delta;
  const limitSellPrice = formatNumber(Math.max(rawSellPrice, minSellPrice), {
    useTickSize: true,
    instrument_name: instrumentName,
    useGrouping: false,
  });

  return side === 'b' ? limitBuyPrice : limitSellPrice;
};

export const usePlacementOrder = (
  instrumentName?: string,
  {
    defaultReduceOnly = false,
    localLimitState = false,
    defaultSide = 'b',
    isMarketClose = false,
    isPositionClose = false,
  }: UsePlacementOrderParams = {},
) => {
  const {
    orderTypePersist,
    setorderTypePersist,
    reduceOnlyPersist,
    postOnlyPersist,
    timeInForcePersist,
    setreduceOnlyPersist,
    setpostOnlyPersist,
    settimeInForcePersist,
    orderSizeMode,
    setOrderSizeMode,
    maxSlippage,
  } = useTradingPreferencesStore();

  const [tab, setTab] = useState<'buy' | 'sell'>(defaultSide === 'b' ? 'buy' : 'sell');

  const { selectedInstrument, tickers, instruments } = useTradingDataStore(
    useShallow((state) => ({
      selectedInstrument: state.selectedInstrument,
      tickers: state.tickers,
      instruments: state.instruments,
    })),
  );

  if (!instrumentName) instrumentName = selectedInstrument;

  const {
    accountSummary,
    leverage: leverageState,
    positions,
    userFees,
    getFeeRatesRaw,
  } = useUserTradingDataStore(
    useShallow((state) => ({
      accountSummary: state.accountSummary,
      leverage: state.leverage,
      positions: state.positions,
      userFees: state.userFees,
      getFeeRatesRaw: state.getFeeRatesRaw,
    })),
  );

  const { updatePendingStatusOrders } = useUserTradingDataStore(
    useShallow((state) => ({
      updatePendingStatusOrders: state.updatePendingStatusOrders,
    })),
  );

  const pathname = usePathname();

  const ticker: Ticker | undefined = instrumentName ? tickers[instrumentName as string] : undefined;
  const instrument = instrumentName ? instruments[instrumentName as string] : undefined;
  const position = Object.values(positions).find(
    (position) => position.instrument === instrumentName,
  );
  const leverage = leverageState[instrumentName as string]?.leverage ?? 1;

  const [baseCurrency, quoteCurrency] = instrument?.price_index?.split('/') ?? [];

  const fallbackQuoteCurrency = quoteCurrency ?? 'USDC';
  const fallbackBaseCurrency = baseCurrency ?? 'BTC';
  const currentDenomination =
    orderSizeMode === 'quote' ? fallbackQuoteCurrency : fallbackBaseCurrency;

  const orderSizeDenominations = useMemo(
    () => [fallbackQuoteCurrency, fallbackBaseCurrency],
    [fallbackQuoteCurrency, fallbackBaseCurrency],
  );

  const handleOrderSizeDenominationChange = (value: string) => {
    if (value === fallbackQuoteCurrency) {
      setOrderSizeMode('quote');
    } else {
      setOrderSizeMode('base');
    }
  };

  const leverageValue: number = position ? Number(position.leverage) : leverage;

  const kind = instrument?.kind as string;

  const availableBalance = getBalance(
    kind,
    selectedInstrument,
    tab === 'buy' ? 'b' : 's',
    accountSummary,
  );

  const markPrice = Number(ticker?.mark_price ?? 0);
  const indexPrice = Number(ticker?.index_price ?? 0);

  // Get orderbook for slippage calculation
  const orderbook = useOrderbookDataStore((state) => state.orderbook);

  const [reduceOnly, setReduceOnly] = useState(defaultReduceOnly || reduceOnlyPersist || false);

  const [postOnly, setPostOnly] = useState(postOnlyPersist);
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC'>(timeInForcePersist);
  const [tpSl, setTpSl] = useState(false);
  const [placingOrder, setPlacingOrder] = useState<'b' | 's' | null>(null);

  // TP/SL state extraction
  const [tpPrice, setTpPrice] = useState('');
  const [tpGain, setTpGain] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [slGain, setSlGain] = useState('');
  const [baseUnit, setBaseUnit] = useState<'$' | '%'>('%');

  // Calculate effective slippage: Math.min(estSlippage, maxSlippage)
  // Negative slippage means better than expected (good), so use 0 or small value
  // Positive slippage means worse than expected (bad), so cap at maxSlippage
  const getEffectiveSlippage = useCallback(
    (side: 'b' | 's', orderSize: string | number) => {
      const referencePrice = Number(ticker?.mark_price ?? ticker?.index_price ?? 0);
      const estResult = getEstSlippage(orderbook, orderSize, side, referencePrice);
      if (estResult) {
        // Negative slippage = better fill than expected, use 0 (or very small value)
        if (estResult.slippagePercent < 0) {
          return 0;
        }
        // Positive slippage = worse fill, cap at maxSlippage
        return Math.min(estResult.slippagePercent, maxSlippage);
      }
      return maxSlippage; // fallback when orderbook unavailable or insufficient liquidity
    },
    [orderbook, ticker, maxSlippage],
  );

  const getLimitPriceMarketForSide = useCallback(
    (side: 'b' | 's', orderSize?: string | number) => {
      const effectiveSlippage = orderSize
        ? getEffectiveSlippage(side, orderSize)
        : maxSlippage;
      return getLimitPriceMarket(ticker, instrumentName as string, side, effectiveSlippage);
    },
    [ticker, instrumentName, maxSlippage, getEffectiveSlippage],
  );

  // Calculate maxSize based on position when reduceOnly or isPositionClose is true
  const positionBaseSize =
    (reduceOnly || isPositionClose) && position ? Math.abs(Number(position.size ?? 0)) : 0;

  // Determine if sides should be disabled for position close
  const isBuyDisabled = reduceOnly && Number(position?.size ?? 0) > 0;
  const isSellDisabled = isPositionClose && Number(position?.size ?? 0) < 0;

  const { placeOrder } = useTradeActions();

  const {
    limitPrice,
    error: limitPriceError,
    handleLimitPriceChange,
    handleGetMidPrice,
  } = useLimitPrice({
    instrumentName: instrumentName as string,
    ticker,
    localLimitState,
  });

  let orderPrice =
    orderTypePersist === 'market'
      ? Number(getLimitPriceMarketForSide(tab === 'buy' ? 'b' : 's'))
      : Number(String(limitPrice)?.replaceAll(',', '') ?? 0);

  // Calculate fee rate based on order type and instrument
  const isStableSpot = (kind === 'spot' && instrument?.stable_pair) ?? false;
  // TradingType is 'perps' | 'spot', default to 'spot' if kind is 'option' or undefined
  const tradingType: 'perps' | 'spot' = kind === 'perps' ? 'perps' : 'spot';
  const feeRates = getFeeRatesRaw(tradingType, userFees, isStableSpot);
  const feeRate = orderTypePersist === 'market' ? feeRates.takerRate : feeRates.makerRate;

  const maxSizeFromBalance =
    (reduceOnly || isPositionClose) && instrument?.kind !== 'spot'
      ? orderSizeMode === 'quote'
        ? positionBaseSize * markPrice
        : positionBaseSize
      : getMaxSize(
        orderPrice,
        availableBalance,
        leverageValue,
        orderSizeMode,
        instrumentName as string,
        kind,
        tab === 'buy' ? 'b' : 's',
        feeRate,
      );

  // For perps (not reduceOnly/positionClose), constrain maxSize based on liquidation validation
  // Slider should not go beyond the point where BOTH buy and sell fail
  const maxSize = useMemo(() => {
    // Skip constraint for spot, reduceOnly, or positionClose
    if (kind === 'spot' || reduceOnly || isPositionClose) {
      return maxSizeFromBalance;
    }

    const isMarket = orderTypePersist === 'market';

    // Convert maxSize to base if it's in quote mode (binary search needs base size)
    const maxSizeInBase =
      orderSizeMode === 'quote' ? maxSizeFromBalance / orderPrice : maxSizeFromBalance;

    // Create function to calculate limit price for any size (with size-specific slippage)
    // This ensures each size tested in binary search uses its own slippage calculation
    // Smaller sizes = less slippage = better entry prices = better liquidation prices
    const getLimitPriceForSize = (size: number, side: 'b' | 's'): number => {
      if (!isMarket) {
        return orderPrice; // Limit orders use fixed price
      }
      // For market orders, recalculate slippage for this specific size
      return Number(getLimitPriceMarketForSide(side, size));
    };

    // For backward compat, calculate initial limit prices (used as fallback if getLimitPriceFn not provided)
    const maxSizeInBaseForSlippage = maxSizeInBase;
    const initialLimitPriceLong = isMarket
      ? Number(getLimitPriceMarketForSide('b', maxSizeInBaseForSlippage))
      : orderPrice;
    const initialLimitPriceShort = isMarket
      ? Number(getLimitPriceMarketForSide('s', maxSizeInBaseForSlippage))
      : orderPrice;

    const constrainedMaxInBase = getMaxValidSizeForLiquidation(
      accountSummary,
      instrumentName as string,
      markPrice,
      initialLimitPriceLong,
      initialLimitPriceShort,
      leverageValue,
      isMarket,
      instrument?.margin_tiers ?? [],
      maxSizeInBase,
      getLimitPriceForSize, // Pass function to recalculate slippage for each size
    );

    // TEMP FIX: Cap max size at 96% to avoid backend rejection
    // TODO: Remove this once backend properly handles slippage/liquidation validation
    // 96% is the new 100% until backend fix
    const cappedMaxInBase = constrainedMaxInBase * 0.96;

    // Convert back to quote if needed
    return orderSizeMode === 'quote' ? cappedMaxInBase * orderPrice : cappedMaxInBase;
  }, [
    kind,
    reduceOnly,
    isPositionClose,
    maxSizeFromBalance,
    orderTypePersist,
    orderPrice,
    orderSizeMode,
    accountSummary,
    instrumentName,
    markPrice,
    leverageValue,
    instrument?.margin_tiers,
    getLimitPriceMarketForSide,
  ]);

  const { orderSize, orderSizeSlider, handleOrderSizeChange, handleOrderSizeSliderChange } =
    useOrderSize({
      instrumentName,
      maxSize: maxSize ?? 0,
      price: orderPrice,
      isPositionClose,
      tab: tab === 'buy' ? 'b' : 's',
    });

  const toggleReduceOnlyChange = () => {
    const next = !reduceOnly;
    setReduceOnly(next);
    setreduceOnlyPersist(next);
  };

  const togglePostOnlyChange = () => {
    const next = !postOnly;
    setPostOnly(next);
    setpostOnlyPersist(next);
  };

  const toggleTpSlChange = () => {
    setTpSl(!tpSl);
  };

  const handleTimeInForceChange = (event: ChangeEvent<HTMLSelectElement> | string) => {
    const next = (typeof event === 'string' ? event : event.target.value) as 'GTC' | 'IOC';
    setTimeInForce(next);
    settimeInForcePersist(next);
  };

  const handleOrderTypeChange = (value: 'limit' | 'market') => {
    setorderTypePersist(value);
  };

  const baseOrderSize =
    currentDenomination === fallbackBaseCurrency
      ? formatNumber(Number(orderSize), {
        useContractSize: true,
        instrument_name: instrumentName,
        useGrouping: false,
        preserveDecimalString: true,
      })
      : formatNumber(Number(orderSize) / orderPrice, {
        useContractSize: true,
        instrument_name: instrumentName,
        useGrouping: false,
        preserveDecimalString: true,
      });

  const { longLiquidationPrice } =
    kind === 'spot'
      ? { longLiquidationPrice: 0 }
      : getLiquidationPrice(
        accountSummary,
        instrumentName as string,
        Number(baseOrderSize),
        markPrice,
        orderTypePersist === 'market' ? Number(getLimitPriceMarketForSide('b', baseOrderSize)) : orderPrice,
        leverageValue,
        orderTypePersist === 'market',
        instrument?.margin_tiers ?? [],
      );

  const { shortLiquidationPrice } =
    kind === 'spot'
      ? { shortLiquidationPrice: 0 }
      : getLiquidationPrice(
        accountSummary,
        instrumentName as string,
        Number(baseOrderSize),
        markPrice,
        orderTypePersist === 'market' ? Number(getLimitPriceMarketForSide('s', baseOrderSize)) : orderPrice,
        leverageValue,
        orderTypePersist === 'market',
        instrument?.margin_tiers ?? [],
      );

  // Liquidation price validation for both sides
  const liqPriceValidation = useMemo(() => {
    if (kind === 'spot' || Number(baseOrderSize) === 0) {
      return { longError: null, shortError: null };
    }

    let longError: string | null = null;
    let shortError: string | null = null;

    // For LONG: if liquidation price >= mark price, position cannot be opened
    if (longLiquidationPrice > 0 && longLiquidationPrice >= markPrice) {
      longError = `Cannot open long: Liquidation price ($${formatNumber(longLiquidationPrice, { decimals: 0 })}) is above mark price. Reduce size to place order.`;
    }

    // For SHORT: if liquidation price <= mark price, position cannot be opened
    if (shortLiquidationPrice > 0 && shortLiquidationPrice <= markPrice) {
      shortError = `Cannot open short: Liquidation price ($${formatNumber(shortLiquidationPrice, { decimals: 0 })}) is below mark price. Reduce size to place order.`;
    }

    return { longError, shortError };
  }, [
    kind,
    baseOrderSize,
    longLiquidationPrice,
    shortLiquidationPrice,
    markPrice,
    leverageValue,
    orderPrice,
  ]);

  // Derive market close error from current state
  const marketCloseError = useMemo(() => {
    if (!isMarketClose) {
      return null;
    }

    if (!position) {
      return 'Position no longer exists';
    }

    return null;
  }, [isMarketClose, position]);

  // Derive instrument error from current state
  const instrumentError = useMemo(() => {
    if (!instrument) {
      return 'Instrument not found';
    }
    return null;
  }, [instrument]);

  // Combine all errors: limit price error takes precedence, then market close, then instrument
  const error = limitPriceError || marketCloseError || instrumentError;

  const orderInfo = {
    liquidationPriceLong: longLiquidationPrice.toString(),
    liquidationPriceShort: shortLiquidationPrice.toString(),
    orderValue:
      currentDenomination === fallbackQuoteCurrency
        ? formatNumber(Number(orderSize), {
          decimals: 2,
        })
        : formatNumber(Number(orderSize) * orderPrice, {
          decimals: 2,
        }),
    marginRequired:
      currentDenomination === fallbackQuoteCurrency
        ? formatNumber(Number(orderSize) / Number(leverageValue), {
          decimals: 2,
        })
        : formatNumber((Number(orderSize) / Number(leverageValue)) * orderPrice, {
          decimals: 2,
        }),
    baseDenomination: fallbackBaseCurrency,
    baseOrderSize: baseOrderSize,
  };

  /**
   * Recalculates order size from slider for market close.
   * Only used when isMarketClose flag is true.
   * Uses position.size directly: (sliderValue / 100) * position.size
   */
  const calculateMarketCloseSize = useCallback(
    (
      sliderValue: number,
      freshPosition: typeof position | undefined,
    ): { baseSize: string; error: string | null } => {
      if (!freshPosition) {
        return {
          baseSize: '0',
          error: 'Position no longer exists',
        };
      }

      const positionBaseSize = Math.abs(Number(freshPosition.size ?? 0));

      // Calculate closing size from slider: (sliderValue / 100) * position.size
      const baseSizeRaw = (sliderValue / 100) * positionBaseSize;

      // Snap to lot size
      const baseSizeSnapped = formatNumber(baseSizeRaw, {
        useContractSize: true,
        instrument_name: instrumentName ?? '',
        useGrouping: false,
        preserveDecimalString: true,
      });

      return {
        baseSize: baseSizeSnapped,
        error: null,
      };
    },
    [instrumentName],
  );

  const handlePlaceOrder = useCallback(
    async (side: 'b' | 's', orderType: 'limit' | 'market') => {
      let baseSizeToPlace: string;

      // Market close: use position.size directly with slider percentage
      if (isMarketClose) {
        const freshStoreState = useUserTradingDataStore.getState();
        const freshPositions = freshStoreState.positions;
        const freshPosition = Object.values(freshPositions).find(
          (pos) => pos.instrument === instrumentName,
        );

        const { baseSize, error: calculationError } = calculateMarketCloseSize(
          orderSizeSlider,
          freshPosition,
        );

        if (calculationError) {
          // Error is derived from state, so we can't proceed if it exists
          return;
        }

        baseSizeToPlace = baseSize;
      } else {
        // Regular order placement: use existing orderInfo.baseOrderSize
        baseSizeToPlace = orderInfo.baseOrderSize;
      }

      // Calculate order price
      // For market close: use maxSlippage directly (no optimized slippage)
      // For regular market orders: use optimized slippage
      // For limit orders: use user's limit price
      orderPrice =
        orderType === 'market'
          ? isMarketClose
            ? Number(getLimitPriceMarket(ticker, instrumentName as string, side, maxSlippage))
            : Number(getLimitPriceMarketForSide(side, baseSizeToPlace))
          : Number(String(limitPrice)?.replaceAll(',', '') ?? 0);

      const orderConfig = {
        timeInForce: orderType === 'limit' ? timeInForce : 'IOC', // Use selected timeInForce for limit orders (both spot and perps), IOC for market orders
        reduceOnly: kind === 'perps' ? reduceOnly : false,
        postOnly: orderType === 'limit' ? postOnly : false,
      };

      const mainPrice = formatNumber(orderPrice, {
        useTickSize: true,
        instrument_name: instrumentName as string,
        useGrouping: false,
      });

      if (!instrument) {
        // Error is derived from state, so we can't proceed if it exists
        return;
      }
      setPlacingOrder(side);

      const cloid = crypto.randomUUID();
      updatePendingStatusOrders(cloid);
      await placeOrder(
        instrument.id,
        side,
        'BOTH',
        mainPrice,
        baseSizeToPlace,
        orderConfig.timeInForce,
        orderConfig.reduceOnly,
        orderConfig.postOnly,
        orderType === 'market',
        cloid,
      );
      setPlacingOrder(null);
    },
    [
      placeOrder,
      pathname,
      limitPrice,
      orderInfo.baseOrderSize,
      timeInForce,
      instrument?.id ?? 0,
      reduceOnly,
      postOnly,
      getLimitPriceMarketForSide,
      isMarketClose,
      orderSizeSlider,
      calculateMarketCloseSize,
      instrumentName,
    ],
  );

  return {
    orderType: orderTypePersist,
    setOrderType: setorderTypePersist,
    handleOrderTypeChange,
    orderSizeDenomination: currentDenomination,
    orderSizeDenominations,
    handleOrderSizeDenominationChange,
    limitPrice,
    handleLimitPriceChange,
    handleGetMidPrice,
    leverage: leverageValue,
    orderSize,
    handleOrderSizeChange,
    orderSizeSliderValue: orderSizeSlider,
    handleOrderSizeSliderChange,
    handlePlaceOrder,
    reduceOnly,
    toggleReduceOnlyChange,
    postOnly,
    togglePostOnlyChange,
    timeInForce,
    handleTimeInForceChange,
    error,
    orderInfo,
    tpSl,
    toggleTpSlChange,
    placingOrder,
    // TP/SL state
    tpPrice,
    setTpPrice,
    tpGain,
    setTpGain,
    slPrice,
    setSlPrice,
    slGain,
    setSlGain,
    baseUnit,
    setBaseUnit,
    // Side disabling for position close
    isBuyDisabled,
    isSellDisabled,
    // Tab state for spot trading
    tab,
    setTab,
    maxSlippage,
    liqPriceValidation,
  };
};

export default usePlacementOrder;

export { useTPSL, TPSL_BASE_UNITS } from './use-tpsl';
export type {
  UseTPSLParams,
  UseTPSLResult,
  TpSlUIBindings,
  TPSLInputBindings,
  TPSLBaseUnit,
} from './use-tpsl';
