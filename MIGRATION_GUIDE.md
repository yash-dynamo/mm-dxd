# Migration Guide: Integrating Hotstuff Backend into mm-dxd

This guide walks you through copying each file/folder from `web-template` into `mm-dxd` step by step, and what changes to make after each copy.

> **Paths:** All `FROM` paths are relative to `/home/sanatan/web-template/`, all `TO` paths are relative to `/home/sanatan/mm-dxd/`.

---

## Step 1 — Install Dependencies

Open `mm-dxd/package.json` and add these to `dependencies`:

```json
"@0xsyndr/ts-sdk": "^0.0.5-beta.57",
"@privy-io/react-auth": "3.8.1",
"@reown/appkit": "^1.8.16",
"@reown/appkit-adapter-wagmi": "^1.8.16",
"@tanstack/react-query": "^5.90.2",
"@relayprotocol/relay-kit-ui": "^7.1.0",
"@relayprotocol/relay-sdk": "^5.1.0",
"@rive-app/react-canvas": "^4.23.4",
"immer": "^10.1.3",
"minimal-shared": "^1.0.5",
"qr-scanner": "^1.4.2",
"qrcode": "^1.5.4",
"sonner": "^2.0.7",
"viem": "^2.37.5",
"wagmi": "^2.17.5",
"zod": "^4.3.5",
"zustand": "^5.0.8"
```

Add to `devDependencies`:

```json
"@iconify/react": "^6.0.1",
"@types/qrcode": "^1.5.5"
```

Then run:

```bash
cd /home/sanatan/mm-dxd
npm install
```

---

## Step 2 — Copy `.env.example` and Create `.env`

```bash
cp /home/sanatan/web-template/.env.example /home/sanatan/mm-dxd/.env.example
cp /home/sanatan/web-template/.env.example /home/sanatan/mm-dxd/.env.local
```

Fill in `.env.local` with your actual keys (Privy app ID, RPC URLs, etc.).

---

## Step 3 — Copy `src/abi/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/abi
cp -r /home/sanatan/web-template/src/abi/* /home/sanatan/mm-dxd/src/abi/
```

**Files copied:**
- `src/abi/Bridge.ts`
- `src/abi/ERC20.ts`
- `src/abi/index.ts`

No changes needed after copying.

---

## Step 4 — Copy `src/config/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/config
cp -r /home/sanatan/web-template/src/config/* /home/sanatan/mm-dxd/src/config/
```

**Files copied:**
- `src/config/env.ts` — reads env vars via zod, **update any env var names** to match your `.env.local`
- `src/config/wallet.ts` — WalletConnect / Reown / Privy config, **update `projectId`** and **chains** to your target networks
- `src/config/phantom-connector.ts`
- `src/config/instruments.ts` — trading pairs config, **keep or trim** to only the instruments your MM bot needs
- `src/config/instrument-metadata.ts`
- `src/config/orderbook.ts`
- `src/config/server.ts` — backend API base URLs, **update** to point to your Hotstuff backend endpoints
- `src/config/index.ts`

**Key edits in `src/config/server.ts`:** Make sure `API_BASE_URL` or equivalent points to your Hotstuff backend URL.

---

## Step 5 — Copy `src/constants/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/constants
cp -r /home/sanatan/web-template/src/constants/* /home/sanatan/mm-dxd/src/constants/
```

**Files copied:**
- `src/constants/global.ts`
- `src/constants/images.ts`
- `src/constants/portfolio.ts`
- `src/constants/version.ts`
- `src/constants/affiliate_tier.ts`
- `src/constants/referral_tier.ts`
- `src/constants/expedition/` (full folder)
- `src/constants/index.ts`

**After copying:** Review `global.ts` for any hardcoded app names or domain references — update to `mm-dxd` / your brand.

---

## Step 6 — Copy `src/types/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/types
cp -r /home/sanatan/web-template/src/types/* /home/sanatan/mm-dxd/src/types/
```

**Files copied:**
- `src/types/trading.d.ts`
- `src/types/vault.d.ts`
- `src/types/expedition.d.ts`
- `src/types/referral.ts`
- `src/types/qrcode.d.ts`
- `src/types/qr-scanner.d.ts`
- `src/types/index.ts`

No changes needed after copying.

---

## Step 7 — Copy `src/utils/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/utils
cp -r /home/sanatan/web-template/src/utils/* /home/sanatan/mm-dxd/src/utils/
```

**Files copied:**
- `src/utils/api.ts` — generic API fetch helpers
- `src/utils/formatting.ts` — number/price formatters
- `src/utils/error.ts`
- `src/utils/device.ts`
- `src/utils/access.ts`
- `src/utils/global.ts`
- `src/utils/liquidation_price.ts`
- `src/utils/menu-props.ts`
- `src/utils/qr-recover.ts`
- `src/utils/qr-scanner-hybrid.ts`
- `src/utils/subdomain-url.ts`
- `src/utils/changelog-parser.ts`
- `src/utils/version-data-clear.ts`

**Note:** `mm-dxd` already has `lib/utils.ts` (shadcn's `cn` helper). Keep that file — it won't conflict with `src/utils/`.

---

## Step 8 — Copy `src/stores/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/stores
cp -r /home/sanatan/web-template/src/stores/* /home/sanatan/mm-dxd/src/stores/
```

**Files copied:**
- `src/stores/slices/auth-slice.ts`
- `src/stores/slices/action-slice.ts`
- `src/stores/slices/trading-data-slice.ts`
- `src/stores/slices/user-trading-data-slice.ts`
- `src/stores/slices/account-history-slice.ts`
- `src/stores/slices/orderbook-data-slice.ts`
- `src/stores/slices/settings-slice.ts`
- `src/stores/slices/notification-slice.ts`
- `src/stores/slices/expedition-slice.ts`
- `src/stores/slices/trading-preferences-slice.ts`
- `src/stores/slices/vaults-slice.ts`
- `src/stores/slices/index.ts`
- `src/stores/utils/DynamicStore.ts`
- `src/stores/utils/getInstrumentFromParams.ts`
- `src/stores/utils/index.ts`
- `src/stores/index.ts`

No changes needed after copying — stores are self-contained via zustand.

---

## Step 9 — Copy `src/hooks/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/hooks
cp -r /home/sanatan/web-template/src/hooks/* /home/sanatan/mm-dxd/src/hooks/
```

This copies the full hooks tree:
- `hooks/actions/` — trade, deposit, auth, transfer, vault actions
- `hooks/info/` — account, positions, orderbook, funding, referral, etc.
- `hooks/orderbook/` — orderbook flash & indicators
- `hooks/use-auth-controller.ts`
- `hooks/use-ticker.ts`
- `hooks/use-media-query.ts`
- `hooks/use-event-listener.ts`
- `hooks/use-countdown-status.ts`
- `hooks/use-funding-countdown.ts`
- `hooks/use-vault-countdown.ts`
- `hooks/useDocumentTitle.ts`
- `hooks/index.ts`

No changes needed after copying.

---

## Step 10 — Copy `src/providers/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/providers
cp -r /home/sanatan/web-template/src/providers/* /home/sanatan/mm-dxd/src/providers/
```

**Files copied:**
- `src/providers/wallet.tsx` — WalletConnect + Privy provider setup
- `src/providers/auth.tsx` — auth state provider
- `src/providers/modal.tsx` — modal state provider
- `src/providers/trading-data.tsx`
- `src/providers/user-trading-data.tsx`
- `src/providers/app-shell.tsx`
- `src/providers/access-guard.tsx`
- `src/providers/eligibility.tsx`
- `src/providers/index.ts`

**Key edits in `src/providers/wallet.tsx`:**
- Verify `projectId` is pulled from your `src/config/env.ts`
- Verify chains array matches what your MM bot supports

---

## Step 11 — Copy `src/components/modals/`

```bash
mkdir -p /home/sanatan/mm-dxd/src/components/modals
cp -r /home/sanatan/web-template/src/components/modals/* /home/sanatan/mm-dxd/src/components/modals/
```

**Files copied:**
- `src/components/modals/connect-wallet.tsx` — the connect wallet modal UI
- `src/components/modals/qr-scan.tsx`
- `src/components/modals/rabby-mobile-guide.tsx`
- `src/components/modals/qr-wallet/` (full folder)
- `src/components/modals/components/` (full folder — ModalBox)
- `src/components/modals/index.ts`

No changes needed after copying.

---

## Step 12 — Copy `src/components/ui/` (from web-template)

> mm-dxd already has `components/ui/` with shadcn components. These are going into `src/` so there is **no conflict**.

```bash
mkdir -p /home/sanatan/mm-dxd/src/components/ui
cp -r /home/sanatan/web-template/src/components/ui/* /home/sanatan/mm-dxd/src/components/ui/
```

**Files copied:**
- `src/components/ui/iconify/` — Iconify wrapper
- `src/components/ui/toast/` — custom toast components
- `src/components/ui/loader/`
- `src/components/ui/error-display/`
- `src/components/ui/error.tsx`
- `src/components/ui/index.tsx`

---

## Step 13 — Copy wallet icons into `public/`

```bash
mkdir -p /home/sanatan/mm-dxd/public/imgs/png/wallet-icons
cp -r /home/sanatan/web-template/public/imgs/png/wallet-icons/* \
      /home/sanatan/mm-dxd/public/imgs/png/wallet-icons/
```

**Files copied:**
- `public/imgs/png/wallet-icons/metamask.png`
- `public/imgs/png/wallet-icons/mpc-vault.svg`
- `public/imgs/png/wallet-icons/phantom.svg`
- `public/imgs/png/wallet-icons/rabby.png`
- `public/imgs/png/wallet-icons/walletconnect.svg`

---

## Step 14 — Copy fonts into `public/`

```bash
mkdir -p /home/sanatan/mm-dxd/public/fonts
cp -r /home/sanatan/web-template/public/fonts/* /home/sanatan/mm-dxd/public/fonts/
```

**Files copied:** Inter & Poppins `.woff2` files.

Then reference them in `app/globals.css` if you want to use them (or keep your existing font setup).

---

## Step 15 — Hook up Providers in `app/layout.tsx`

The `web-template` uses `app/providers.tsx` as the root provider tree. Copy it:

```bash
cp /home/sanatan/web-template/src/app/providers.tsx /home/sanatan/mm-dxd/app/providers.tsx
```

Then open `mm-dxd/app/layout.tsx` and wrap your children with `<Providers>`:

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Edit `app/providers.tsx`** — remove any imports that pull from `web-template`-specific paths and fix them to the new `src/` paths, e.g.:

- `@/providers/wallet` → `../src/providers/wallet`
- `@/providers/auth` → `../src/providers/auth`

OR set up a path alias (see Step 16).

---

## Step 16 — Update `tsconfig.json` Path Aliases

Open `mm-dxd/tsconfig.json` and add `src/` to the path alias so all the copied files resolve correctly:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@src/*": ["./src/*"]
    }
  }
}
```

> All the copied files use `@/` imports internally (e.g. `import { useStore } from '@/stores'`).
> In `web-template`, `@/` pointed to `src/`. Since mm-dxd's root is different, the cleanest fix is to add `"@/*": ["./src/*"]` so `@/stores` resolves to `./src/stores`.
> **Warning:** mm-dxd's existing `app/` components use `@/` to mean the root. Check existing imports before applying — you may need `@src/` for new files instead.

---

## Step 17 — Add toast CSS

Open `mm-dxd/app/globals.css` and append the contents of:

```
/home/sanatan/web-template/src/app/toast.css
```

(Copy-paste or `cat` its contents to the bottom of your globals.css.)

---

## Step 18 — Add `sonner` Toast Provider

In `app/providers.tsx` (or `app/layout.tsx`), add:

```tsx
import { Toaster } from 'sonner'

// Inside your provider tree or layout body:
<Toaster position="bottom-right" />
```

---

## Step 19 — Verify `.npmrc`

Check if `web-template/.npmrc` has any registry overrides (e.g. for `@0xsyndr/ts-sdk`):

```bash
cat /home/sanatan/web-template/.npmrc
```

If it points to a private registry for `@0xsyndr`, copy it:

```bash
cp /home/sanatan/web-template/.npmrc /home/sanatan/mm-dxd/.npmrc
```

Then re-run `npm install`.

---

## Step 20 — Final Check: Fix Import Paths

After all files are copied, run the TypeScript compiler to surface broken imports:

```bash
cd /home/sanatan/mm-dxd
npx tsc --noEmit
```

Common fixes you'll need:
- Any `@/` import inside `src/` files needs to resolve — handled by Step 16.
- Any relative import that assumed a different folder depth.
- `next/image` or `next/link` usages that might need updating for Next.js 16.

---

## Folder Structure After Migration

```
mm-dxd/
├── app/                  ← existing landing page + new providers.tsx
├── components/           ← existing shadcn UI (untouched)
├── lib/                  ← existing shadcn utils (untouched)
├── public/               ← existing + wallet icons + fonts added
├── src/                  ← NEW: everything from web-template
│   ├── abi/
│   ├── config/
│   ├── constants/
│   ├── hooks/
│   ├── providers/
│   ├── stores/
│   ├── types/
│   └── utils/
│   └── components/
│       ├── modals/
│       └── ui/
└── package.json          ← updated with new deps
```

---

## Quick Reference: Priority Order

If you want to do this incrementally and test as you go:

| Priority | Step | What it unlocks |
|----------|------|-----------------|
| 1 | Steps 1, 19 | Install deps & registry |
| 2 | Step 2 | Env vars |
| 3 | Steps 3–7 | ABIs, config, constants, types, utils (no UI yet) |
| 4 | Steps 8–9 | Stores + hooks (full data layer) |
| 5 | Steps 10–12 | Providers + modal components |
| 6 | Steps 13–14 | Public assets |
| 7 | Steps 15–18 | Wire into app layout |
| 8 | Steps 16, 20 | Fix TS paths and verify build |
