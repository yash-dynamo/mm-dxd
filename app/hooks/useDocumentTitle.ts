'use client';

import { formatNumber } from '@/utils/formatting';
import { getValidPrice } from '@/utils/global';
import { useEffect } from 'react';
import { useTradingDataStore } from '@/stores';
import { EXCHANGE_NAME } from '@/constants';

type UseDocumentTitleProps = {
  instrumentName?: string;
  staticTitle?: string;
  customFormat?: (price: string, instrumentName: string) => string;
};

export function useDocumentTitle({
  instrumentName,
  staticTitle,
  customFormat,
}: UseDocumentTitleProps) {
  // Use reactive selectors instead of getters
  const tickers = useTradingDataStore((state) => state.tickers);
  const instruments = useTradingDataStore((state) => state.instruments);
  const ticker = instrumentName ? tickers[instrumentName as string] : undefined;
  const instrument = instrumentName ? instruments[instrumentName as string] : undefined;

  useEffect(() => {
    if (staticTitle) {
      document.title = staticTitle;
      return;
    }

    if (!instrument) {
      document.title = EXCHANGE_NAME;
      return;
    }

    let instrumentNameDisplay = instrumentName;
    if (instrumentName?.includes('-')) {
      instrumentNameDisplay = instrumentName.split('-')[0];
    }

    if (instrumentName?.includes('/')) {
      instrumentNameDisplay = instrumentName.split('/')[0];
    }

    if (ticker && instrumentName) {
      const validPrice =
        getValidPrice(ticker.mark_price) ??
        getValidPrice(ticker.last_price) ??
        getValidPrice(ticker.index_price);

      const price = formatNumber(validPrice, {
        instrument_name: instrumentName,
        useTickSize: true,
        fallback: '-',
      });

      const title = customFormat
        ? customFormat(price, instrumentName)
        : `${price} | ${instrumentNameDisplay} | ${EXCHANGE_NAME}`;

      document.title = title;
    }
  }, [ticker, instrumentName, staticTitle, customFormat, instrument]);
}
