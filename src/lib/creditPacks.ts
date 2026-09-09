import type { CreditPackSlug } from './auth/client';

export type CreditPackOption = {
  slug: CreditPackSlug;
  name: string;
  credits: number;
  price: string;
  description: string;
  featured?: boolean;
};

export const CREDIT_PACK_OPTIONS: CreditPackOption[] = [
  {
    slug: 'starter',
    name: 'Starter',
    credits: 900,
    price: '$5',
    description: 'A simple top-up for occasional exports.',
  },
  {
    slug: 'popular',
    name: 'Popular',
    credits: 2_000,
    price: '$10',
    description: 'A flexible balance for regular creative work.',
    featured: true,
  },
  {
    slug: 'pro',
    name: 'Pro Pack',
    credits: 6_000,
    price: '$25',
    description: 'The strongest value for larger export runs.',
  },
];
