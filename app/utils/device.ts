const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i;

export function isProbablyMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const { navigator } = window;

  if ((navigator as any).userAgentData?.mobile) return true;

  const ua = navigator.userAgent || '';
  if (MOBILE_REGEX.test(ua)) return true;

  const touchPoints = (navigator as any).maxTouchPoints ?? 0;
  const isCoarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer:coarse)').matches;
  const isDesktopUA = /Macintosh|Windows NT|X11|Linux x86_64/i.test(ua);

  return (touchPoints > 1 || isCoarse) && !isDesktopUA;
}

export function hasExtensionProvider(): boolean {
  if (typeof window === 'undefined') return false;
  const eth = (window as any).ethereum;
  if (!eth) return false;

  const providers: any[] = Array.isArray(eth.providers) ? eth.providers : [eth];

  return providers.some(
    (p) =>
      p?.isMetaMask ||
      p?.isRabby ||
      p?.isBraveWallet ||
      p?.isCoinbaseWallet ||
      p?.isFrame ||
      p?.isTaho ||
      p?.isTrust ||
      p?.isOkxWallet,
  );
}
