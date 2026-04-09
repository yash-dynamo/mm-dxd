export const getErrorMessage = (error: unknown) => {
  try {
    if (error instanceof Error && typeof error !== 'string') {
      return JSON.parse(error.message)?.error;
    }
    return String(error);
  } catch {
    return String(error);
  }
};

type ErrorOverrideConfig =
  | { originalError: string; skip: true }
  | {
      originalError: string;
      skip?: false;
      overrideError: string;
      strategy: 'includes' | 'exact';
    };

export const errorOverrideConfig: ErrorOverrideConfig[] = [
  {
    originalError: 'Failed to fetch',
    skip: true,
  },
  {
    originalError: 'Failed wallet/agent linkage check',
    overrideError:
      'Wallet/agent linkage check failed on backend. Please update/restart the backend service and try again.',
    strategy: 'includes',
  },
  {
    originalError: "has no attribute 'agents'",
    overrideError:
      'Backend SDK mismatch: InfoClient.agents is unavailable. Please update the backend SDK/service and retry.',
    strategy: 'includes',
  },
  {
    originalError: 'Internal server error',
    overrideError: 'Something went wrong',
    strategy: 'includes',
  },
  {
    originalError: 'Signal time',
    overrideError: 'Something went wrong',
    strategy: 'includes',
  },
  {
    originalError: 'UserRejectedRequestError',
    skip: true,
  },
];

export const getErrorOverride = (errorMessage: string) => {
  const normalized = errorMessage.toLowerCase();
  for (const config of errorOverrideConfig) {
    const needle = config.originalError.toLowerCase();
    if (config.skip === true) {
      if (normalized.includes(needle)) {
        return false;
      } else {
        continue;
      }
    }

    if (config.strategy === 'includes' && normalized.includes(needle)) {
      return config.overrideError;
    }
    if (config.strategy === 'exact' && normalized === needle) {
      return config.overrideError;
    }
  }
  return errorMessage;
};
