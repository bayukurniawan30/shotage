export type ShareVisibility = 'private' | 'public';
export type UserDesignStatus = 'private' | 'pending' | 'published' | 'not_published';

export function isShareVisibility(value: unknown): value is ShareVisibility {
  return value === 'private' || value === 'public';
}

export function getShareModerationFields(visibility: ShareVisibility) {
  return visibility === 'public'
    ? { is_in_review: 'yes', is_in_explore: 'no' }
    : { is_in_review: 'no', is_in_explore: 'no' };
}

export function isPrivateShare(content: Record<string, unknown>) {
  return content.visibility === 'private';
}

export function canAccessPrivateShare(
  content: Record<string, unknown>,
  authenticatedUserId: string | null
) {
  if (!isPrivateShare(content)) return true;
  return Boolean(authenticatedUserId && content.user_id === authenticatedUserId);
}

export function isExploreEligibleShare(content: Record<string, unknown>) {
  if (isPrivateShare(content)) return false;
  return (
    String(content.is_in_review || '')
      .trim()
      .toLowerCase() === 'no' &&
    String(content.is_in_explore || '')
      .trim()
      .toLowerCase() === 'yes'
  );
}

export function getUserDesignStatus(content: Record<string, unknown>): UserDesignStatus {
  if (isPrivateShare(content)) return 'private';
  const inReview =
    String(content.is_in_review || '')
      .trim()
      .toLowerCase() === 'yes';
  const inExplore =
    String(content.is_in_explore || '')
      .trim()
      .toLowerCase() === 'yes';
  if (inReview) return 'pending';
  if (inExplore) return 'published';
  return 'not_published';
}
