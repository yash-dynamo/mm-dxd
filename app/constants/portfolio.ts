export const PORTFOLIO_NAVBAR_ITEMS = [
  {
    label: 'Account Overview',
    icon: '/imgs/svg/portfolio/inactive/account-overview.svg',
    activeIcon: '/imgs/svg/portfolio/active/account-overview.svg',
    path: '/portfolio/account-overview',
  },
  {
    label: 'Open Orders',
    icon: '/imgs/svg/portfolio/inactive/open-orders.svg',
    activeIcon: '/imgs/svg/portfolio/active/open-orders.svg',
    path: '/portfolio/open-orders',
  },
  {
    label: 'Order History',
    icon: '/imgs/svg/portfolio/inactive/order-history.svg',
    activeIcon: '/imgs/svg/portfolio/active/order-history.svg',
    path: '/portfolio/order-history',
  },
  {
    label: 'Trade History',
    icon: '/imgs/svg/portfolio/inactive/trade-history.svg',
    activeIcon: '/imgs/svg/portfolio/active/trade-history.svg',
    path: '/portfolio/trade-history',
  },
  {
    label: 'Deposits & Withdrawals',
    icon: '/imgs/svg/portfolio/inactive/deposits-and-withdrawals.svg',
    activeIcon: '/imgs/svg/portfolio/active/deposits-and-withdrawals.svg',
    path: '/portfolio/deposits-and-withdrawals',
  },
  {
    label: 'Agent Wallets',
    icon: '/imgs/svg/portfolio/inactive/agent-wallets.svg',
    activeIcon: '/imgs/svg/portfolio/active/agent-wallets.svg',
    path: '/portfolio/agent-wallets',
  },
];

export const BALANCES_TABLE_HEADERS = (vaultAddress?: string) => [
  'Asset',
  'Total Balance',
  'Withdrawable Balance',
  'Index Price',
  'USDC Value',
  ...(!vaultAddress ? ['Actions'] : []),
];

export const DUMMY_BALANCES_TABLE_DATA = [];

export const ORDERS_TABLE_HEADERS = [
  'Instrument',
  'Direction',
  'Time',
  'Type',
  'Filled Size',
  'Unfilled Size',
  'Original Size',
  'Order Value',
  'Price',
  'Reduce Only',
  'Trigger Conditions',
  'TP/SL',
];

export const DUMMY_ORDERS_TABLE_DATA = [];

export const ORDER_HISTORY_TABLE_HEADERS = [
  'Instrument',
  'Direction',
  'Time',
  'Type',
  'Filled Size',
  'Unfilled Size',
  'Original Size',
  'Order Value',
  'Price',
  'Reduce Only',
  'Status',
  'Order ID',
  'TP/SL',
  'Trigger Conditions',
];

export const DUMMY_ORDER_HISTORY_TABLE_DATA = [];

export const TRADE_HISTORY_TABLE_HEADERS = [
  'Instrument',
  'Direction',
  'Time',
  'Price',
  'Size',
  'Trade Value',
  'Fee',
  'Closed PnL',
];

export const DUMMY_TRADE_HISTORY_TABLE_DATA = [];

export const TRANSACTIONS_TABLE_HEADERS = ['Asset', 'Time', 'Amount', 'Tx Hash', 'Fees'];

export const DUMMY_TRANSACTIONS_TABLE_DATA = [];

export const SIGNING_KEYS_TABLE_HEADERS = ['Name', 'Date', 'Time', ''];

export const DUMMY_SIGNING_KEYS_TABLE_DATA = [];

export const API_KEYS_TABLE_HEADERS = ['Name', 'API Key', 'API Secret', ''];

export const DUMMY_API_KEYS_TABLE_DATA = [];
