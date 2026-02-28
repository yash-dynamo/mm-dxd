import { useCallback } from 'react';
import { useActionWrapper } from './use-action-wrapper';
import { actions } from './config';

type LocalUnitOrder = {
  instrumentId: number;
  side: 'b' | 's';
  positionSide: 'LONG' | 'SHORT' | 'BOTH';
  price: string;
  size: string;
  tif: 'GTC' | 'IOC' | 'FOK';
  ro: boolean;
  po: boolean;
  cloid: string;
  triggerPx?: string;
  isMarket?: boolean;
  tpsl?: '' | 'tp' | 'sl';
  grouping?: '' | 'position' | 'normal';
};

export function useTradeActions() {
  const { executeL1Action } = useActionWrapper();

  const placeOrder = useCallback(
    async (
      instrumentId: number,
      side: 'b' | 's',
      positionSide: 'LONG' | 'SHORT' | 'BOTH',
      price: string,
      size: string,
      tif: 'GTC' | 'IOC' | 'FOK',
      ro: boolean,
      po: boolean,
      isMarket: boolean = false,
      cloid: string = '',
    ) => {
      return executeL1Action(
        actions.placeOrder,
        (client) =>
          client.placeOrder({
            orders: [
              {
                instrumentId,
                side,
                positionSide,
                price,
                size,
                tif,
                ro,
                po,
                cloid,
                triggerPx: '',
                isMarket,
                tpsl: '',
                grouping: '',
              },
            ],
            expiresAfter: Date.now() + 3600000,
          }),
        false,
        {
          isMarket,
          cloid,
        },
      );
    },
    [executeL1Action],
  );

  const placeOrders = useCallback(
    async (orders: LocalUnitOrder[]) => {
      return executeL1Action(
        actions.placeOrder,
        (client) =>
          client.placeOrder({
            orders,
            expiresAfter: Date.now() + 3600000,
          }),
        true,
        {
          cloids: orders.map((order) => order.cloid),
        },
      );
    },
    [executeL1Action],
  );

  const placeTpSlOrder = useCallback(
    async (
      instrumentId: number,
      side: 'b' | 's',
      positionSide: 'LONG' | 'SHORT' | 'BOTH',
      size: string,
      tpTriggerPx: string,
      tpOrderPrice: string,
      isTPMarket: boolean,
      slTriggerPx?: string,
      slOrderPrice?: string,
      isSLMarket?: boolean,
    ) => {
      const orders = [] as LocalUnitOrder[];

      const tpslSide: 'b' | 's' = side === 'b' ? 's' : 'b';


      if (tpTriggerPx && tpOrderPrice) {
        orders.push({
          instrumentId,
          side: tpslSide,
          positionSide,
          price: tpOrderPrice,
          size,
          tif: 'GTC',
          ro: true,
          po: false,
          cloid: '',
          triggerPx: tpTriggerPx,
          isMarket: isTPMarket,
          tpsl: 'tp',
          grouping: 'position',
        });
      }

      if (slTriggerPx && slOrderPrice) {
        orders.push({
          instrumentId,
          side: tpslSide,
          positionSide,
          price: slOrderPrice,
          size,
          tif: 'GTC',
          ro: true,
          po: false,
          cloid: '',
          triggerPx: slTriggerPx,
          isMarket: isSLMarket,
          tpsl: 'sl',
          grouping: 'position',
        });
      }

      return executeL1Action(actions.placeOrder, (client) =>
        client.placeOrder({
          orders,
          expiresAfter: Date.now() + 3600000,
        }),
      );
    },
    [executeL1Action],
  );

  const cancelByOrderId = useCallback(
    async (oid: number, instrumentId: number) => {
      return executeL1Action(actions.cancelByOrderId, (client) =>
        client.cancelByOid({
          cancels: [
            {
              oid,
              instrumentId,
            },
          ],
          expiresAfter: Date.now() + 3600000,
        }),
      );
    },
    [executeL1Action],
  );

  const editByOrderId = useCallback(
    async (
      oid: number,
      instrumentId: number,
      side: 'b' | 's',
      positionSide: 'LONG' | 'SHORT' | 'BOTH',
      price: string,
      size: string,
      tif: 'GTC' | 'IOC' | 'FOK',
      ro: boolean,
      po: boolean,
      cloid: string,
    ) => {
      return executeL1Action(actions.editByOrderId, (client) =>
        client.editByOid({
          oid,
          order: [
            {
              instrumentId,
              side,
              positionSide,
              price,
              size,
              tif,
              ro,
              po,
              cloid,
            },
          ],
          expiresAfter: Date.now() + 3600000,
        }),
      );
    },
    [executeL1Action],
  );

  const cancelAll = useCallback(async () => {
    return executeL1Action(actions.cancelAll, (client) =>
      client.cancelAll({
        expiresAfter: Date.now() + 3600000,
      }),
    );
  }, [executeL1Action]);

  const cancelByCloid = useCallback(
    async (cloid: string, instrumentId: number) => {
      return executeL1Action(actions.cancelByCloid, (client) =>
        client.cancelByCloid({
          cancels: [{ cloid, instrumentId }],
          expiresAfter: Date.now() + 3600000,
        }),
      );
    },
    [executeL1Action],
  );

  const cancelByInstrument = useCallback(
    async (instrumentId: number) => {
      return executeL1Action(actions.cancelByInstrument, (client) =>
        client.cancelByInstrument({
          instrumentId,
          expiresAfter: Date.now() + 3600000,
        }),
      );
    },
    [executeL1Action],
  );

  const cancelByInstrumentKind = useCallback(
    async (kind: string) => {
      return executeL1Action(actions.cancelByInstrumentKind, (client) =>
        client.cancelByInstrumentKind({
          kind,
          expiresAfter: Date.now() + 3600000,
        }),
      );
    },
    [executeL1Action],
  );

  return {
    placeOrder,
    placeOrders,
    placeTpSlOrder,
    cancelByOrderId,
    editByOrderId,
    cancelAll,
    cancelByCloid,
    cancelByInstrument,
    cancelByInstrumentKind,
  };
}
