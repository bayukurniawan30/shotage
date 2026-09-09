import { describe, expect, it } from 'vitest';
import {
  canAccessPrivateShare,
  getUserDesignStatus,
  getShareModerationFields,
  isExploreEligibleShare,
  isShareVisibility,
} from './share';

describe('share visibility policy', () => {
  it('submits public designs for review without publishing automatically', () => {
    expect(getShareModerationFields('public')).toEqual({
      is_in_review: 'yes',
      is_in_explore: 'no',
    });
  });

  it('keeps private designs out of review and Explore', () => {
    expect(getShareModerationFields('private')).toEqual({
      is_in_review: 'no',
      is_in_explore: 'no',
    });
  });

  it('only allows the owner to access a private design', () => {
    const content = { visibility: 'private', user_id: 'user-1' };
    expect(canAccessPrivateShare(content, 'user-1')).toBe(true);
    expect(canAccessPrivateShare(content, 'user-2')).toBe(false);
    expect(canAccessPrivateShare(content, null)).toBe(false);
  });

  it('keeps legacy and public shares link-accessible', () => {
    expect(canAccessPrivateShare({ visibility: 'public', user_id: 'user-1' }, null)).toBe(true);
    expect(canAccessPrivateShare({}, null)).toBe(true);
  });

  it('only exposes approved public or legacy entries through Explore', () => {
    expect(
      isExploreEligibleShare({
        visibility: 'public',
        is_in_review: 'no',
        is_in_explore: 'yes',
      })
    ).toBe(true);
    expect(isExploreEligibleShare({ is_in_review: 'no', is_in_explore: 'yes' })).toBe(true);
    expect(
      isExploreEligibleShare({
        visibility: 'private',
        is_in_review: 'no',
        is_in_explore: 'yes',
      })
    ).toBe(false);
    expect(
      isExploreEligibleShare({
        visibility: 'public',
        is_in_review: 'yes',
        is_in_explore: 'no',
      })
    ).toBe(false);
  });

  it('only accepts known visibility values', () => {
    expect(isShareVisibility('private')).toBe(true);
    expect(isShareVisibility('public')).toBe(true);
    expect(isShareVisibility('friends')).toBe(false);
  });

  it('maps owner-facing design statuses without exposing moderation fields', () => {
    expect(getUserDesignStatus({ visibility: 'private' })).toBe('private');
    expect(
      getUserDesignStatus({ visibility: 'public', is_in_review: 'yes', is_in_explore: 'no' })
    ).toBe('pending');
    expect(
      getUserDesignStatus({ visibility: 'public', is_in_review: 'no', is_in_explore: 'yes' })
    ).toBe('published');
    expect(
      getUserDesignStatus({ visibility: 'public', is_in_review: 'no', is_in_explore: 'no' })
    ).toBe('not_published');
  });
});
