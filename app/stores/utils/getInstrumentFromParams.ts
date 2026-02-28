export const getInstrumentFromParams = (params: string | string[]) => {
  if (typeof params === 'string') {
    return params;
  }
  if (Array.isArray(params)) {
    return params.join('/');
  }
  return '';
};
