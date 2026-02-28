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
  for (const config of errorOverrideConfig) {
    if (config.skip === true) {
      if (errorMessage.includes(config.originalError)) {
        return false;
      } else {
        continue;
      }
    }

    if (config.strategy === 'includes' && errorMessage.includes(config.originalError)) {
      return config.overrideError;
    }
    if (config.strategy === 'exact' && errorMessage === config.originalError) {
      return config.overrideError;
    }
  }
  return errorMessage;
};
