import { config } from '.';

export const accountActions: Record<string, config> = {
  addAgent: {
    name: 'Add Agent',
    success: ({ source } = {}) => {
      if (source === 'api-agent') {
        return {
          title: 'API Wallet Authorized',
        };
      }
      return {
        title: 'Connection Established',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Add Agent',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Connecting Agent',
    },
  },
  revokeAgent: {
    name: 'Revoke Agent',
    success: () => {
      return {
        title: 'Agent Wallet Revoked',
        description: 'The agent wallet has been successfully revoked.',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Revoke Agent',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Revoking Agent Wallet',
    },
  },
  updateMarginMode: {
    name: 'Update Margin Mode',
    success: () => {
      return {
        title: 'Margin Mode Updated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Update Margin Mode',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Updating Margin Mode',
    },
  },
  updateIsolatedMargin: {
    name: 'Update Isolated Margin',
    success: () => {
      return {
        title: 'Isolated Margin Updated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Update Isolated Margin',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Updating Isolated Margin',
    },
  },
  createReferralCode: {
    name: 'Create Referral Code',
    success: () => {
      return {
        title: 'Referral Code Created',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Create Referral Code',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Creating Referral Code',
    },
  },
  setReferrer: {
    name: 'Set Referrer',
    success: () => {
      return {
        title: 'Referrer Set',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Set Referrer',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Setting Referrer',
    },
  },
  claimReferralRewards: {
    name: 'Claim Referral Rewards',
    success: () => {
      return {
        title: 'Referral Rewards Claimed',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Claim Referral Rewards',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Claiming Referral Rewards',
    },
  },
  updateInstrumentLeverage: {
    name: 'Update Instrument Leverage',
    success: () => {
      return {
        title: 'Instrument Leverage Updated',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Update Instrument Leverage',
        ...(error ? { description: error } : {}),
      };
    },
    loading: {
      title: 'Updating Instrument Leverage',
    },
  },
};