export const REFERRAL_TIERS = [
  {
    name: 'Standard',
    total_referred_volume: 500000,
    fee_discount_rate: 0.05,
    referrer_commission: 0.1,
    headText: '$500K referral volume to get upto 15% discount',
    caption:
      'Reach $500K in total referred volume to unlock the Silver tier and enjoy even more benefits including 15% fee commission and higher referral limits.',
    icon: 'imgs/svg/referral/icons/standard.svg',
    card: 'imgs/svg/referral/cards/standard-card.svg',
  },
  {
    name: 'Silver',
    total_referred_volume: 1000000,
    fee_discount_rate: 0.05,
    referrer_commission: 0.15,
    headText: '$1M referral volume to get upto 20% discount',
    caption:
      'Reach $1M in total referred volume to unlock the Gold tier and enjoy even more benefits including 20% fee commission and higher referral limits.',
    icon: 'imgs/svg/referral/icons/silver.svg',
    card: 'imgs/svg/referral/cards/silver-card.svg',
  },
  {
    name: 'Gold',
    total_referred_volume: 3000000,
    fee_discount_rate: 0.05,
    referrer_commission: 0.20,
    headText: '$3M referral volume to get upto 25% discount',
    caption:
      'Reach $3M in total referred volume to unlock the Platinum tier and enjoy even more benefits including 30% fee commission and higher referral limits.',
    icon: 'imgs/svg/referral/icons/gold.svg',
    card: 'imgs/svg/referral/cards/gold-card.svg',
  },
  {
    name: 'Platinum',
    total_referred_volume: Number.MAX_SAFE_INTEGER,
    fee_discount_rate: 0.05,
    referrer_commission: 0.25,
    headText: 'Maximum referral rewards unlocked',
    caption:
      "You've reached the top - maximum referral rewards are unlocked",
    icon: 'imgs/svg/referral/icons/platinum.svg',
    card: 'imgs/svg/referral/cards/platinum-card.svg',
  },
];
