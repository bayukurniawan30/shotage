import { describe, expect, it } from 'vitest';
import {
  checkoutRequestSchema,
  getConfiguredCreditPacks,
  getCreditPackByProductId,
  getPolarServer,
  processPolarWebhook,
  resolveCheckoutOrigin,
} from './polar';

const productIds = {
  POLAR_PRODUCT_STARTER: '2a8e48ff-9f99-4cd4-8c1e-21d83895b23a',
  POLAR_PRODUCT_POPULAR: '4109fc7d-ae0a-42d0-a8f3-76a6e82cd6a0',
  POLAR_PRODUCT_PRO: '6c582f08-251b-4963-a125-005be8314665',
};

describe('Polar configuration', () => {
  it('maps fixed product IDs to server-owned credit amounts', () => {
    expect(getConfiguredCreditPacks(productIds)).toEqual({
      starter: { credits: 900, productId: productIds.POLAR_PRODUCT_STARTER },
      popular: { credits: 2_000, productId: productIds.POLAR_PRODUCT_POPULAR },
      pro: { credits: 6_000, productId: productIds.POLAR_PRODUCT_PRO },
    });
    expect(getCreditPackByProductId(productIds.POLAR_PRODUCT_POPULAR, productIds)).toEqual({
      slug: 'popular',
      credits: 2_000,
      productId: productIds.POLAR_PRODUCT_POPULAR,
    });
  });

  it('rejects missing, invalid, or duplicate product IDs', () => {
    expect(() => getConfiguredCreditPacks({})).toThrow('POLAR_PRODUCT_STARTER');
    expect(() =>
      getConfiguredCreditPacks({ ...productIds, POLAR_PRODUCT_PRO: 'not-a-product-id' })
    ).toThrow('Polar product ID');
    expect(() =>
      getConfiguredCreditPacks({
        ...productIds,
        POLAR_PRODUCT_PRO: productIds.POLAR_PRODUCT_STARTER,
      })
    ).toThrow('different product ID');
  });

  it('accepts only known pack slugs and Polar server modes', () => {
    expect(checkoutRequestSchema.safeParse({ pack: 'starter' }).success).toBe(true);
    expect(checkoutRequestSchema.safeParse({ pack: 'unlimited' }).success).toBe(false);
    expect(getPolarServer()).toBe('sandbox');
    expect(getPolarServer('production')).toBe('production');
    expect(() => getPolarServer('preview')).toThrow();
  });

  it('requires secure checkout origins outside local development', () => {
    expect(resolveCheckoutOrigin('http://127.0.0.1:4173/api/checkout/create', '')).toBe(
      'http://127.0.0.1:4173'
    );
    expect(
      resolveCheckoutOrigin('http://ignored.test', 'https://preview.shotage.example/path')
    ).toBe('https://preview.shotage.example');
    expect(() =>
      resolveCheckoutOrigin('http://shotage.example/api/checkout/create', '')
    ).toThrow('HTTPS');
  });
});

describe('Polar webhook routing', () => {
  it('ignores unrelated signed event types', async () => {
    await expect(processPolarWebhook({ type: 'customer.created' })).resolves.toEqual({
      resultCode: 'IGNORED',
      balance: null,
      debt: null,
      changedCredits: 0,
    });
  });

  it('ignores checkout updates that are not failures or expiry', async () => {
    await expect(
      processPolarWebhook({
        type: 'checkout.updated',
        timestamp: new Date().toISOString(),
        data: { id: crypto.randomUUID(), status: 'open' },
      })
    ).resolves.toEqual({
      resultCode: 'IGNORED',
      balance: null,
      debt: null,
      changedCredits: 0,
    });
  });
});
