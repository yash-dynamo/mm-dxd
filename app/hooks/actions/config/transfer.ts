import { config } from '.';

export const transferActions: Record<string, config> = {
  accountSpotWithdrawRequest: {
    name: 'Account Spot Withdraw Request',
    success: () => {
      return {
        title: 'Withdrawal Initiated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Withdraw',
        ...(error ? { description: error } : {}),
      };
    },
  },
  accountDerivativeWithdrawRequest: {
    name: 'Account Derivative Withdraw Request',
    success: () => {
      return {
        title: 'Withdrawal Initiated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Withdraw',
        ...(error ? { description: error } : {}),
      };
    },
  },
  accountSpotBalanceTransferRequest: {
    name: 'Account Spot Balance Transfer Request',
    success: ({ amount, token } = {}) =>
      amount && token
        ? {
          title: 'Transfer Success',
          description: `Sent ${amount} ${token}`,
        }
        : {
          title: 'Transfer Success',
        },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Send',
        ...(error ? { description: error } : {}),
      };
    },
  },
  accountDerivativeBalanceTransferRequest: {
    name: 'Account Derivative Balance Transfer Request',
    success: ({ amount, token } = {}) =>
      amount && token
        ? {
          title: 'Transfer Success',
          description: `Sent ${amount} ${token}`,
        }
        : {
          title: 'Transfer Success',
        },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Send',
        ...(error ? { description: error } : {}),
      };
    },
  },
  accountInternalBalanceTransferRequest: {
    name: 'Account Internal Balance Transfer Request',
    success: () => {
      return {
        title: 'Transfer Success',
        description: 'Transfer success.',
      };
    },
    error: ({ error } = {}) => ({
      title: 'Failed to Transfer',
      ...(error ? { description: error } : {}),
    }),
  },
  accountSpotWithdrawRequestAction1: {
    name: 'Account Spot Withdraw Request Action',
    success: () => {
      return {
        title: 'Withdrawal Initiated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Withdraw',
        ...(error ? { description: error } : {}),
      };
    },
  },
  accountDerivativeWithdrawRequestAction1: {
    name: 'Account Derivative Withdraw Request Action',
    success: () => {
      return {
        title: 'Withdrawal Initiated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Withdraw',
        ...(error ? { description: error } : {}),
      };
    },
  },
};
