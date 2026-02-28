import { config } from '.';

export const vaultActions: Record<string, config> = {
  depositToVault: {
    name: 'Vault Deposit',
    success: () => {
      return {
        title: 'Vault Deposit Submitted',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Deposit to Vault',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Depositing to Vault',
    },
  },
  redeemFromVault: {
    name: 'Vault Redeem',
    success: () => {
      return {
        title: 'Vault Redeem Submitted',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Redeem from Vault',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Redeeming from Vault',
    },
  },
  sendToSubVault: {
    name: 'Send to SubVault',
    success: () => {
      return {
        title: 'Sent to SubVault',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Send to SubVault',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Sending to SubVault',
    },
  },
  withdrawFromSubVault: {
    name: 'Withdraw from SubVault',
    success: () => {
      return {
        title: 'Withdraw from SubVault Submitted',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Withdraw from SubVault',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Withdrawing from SubVault',
    },
  },
};
