export type PlanName = 'Spawn' | 'Craft' | 'Nexus';

export function normalizedPlan(value: string): PlanName {
  if (value === 'Craft') return 'Craft';
  if (value === 'Nexus' || value === 'Premium') return 'Nexus';
  return 'Spawn';
}

export function isLaunch(firstPublishedISO: string | null | undefined, override: string | null | undefined, at = new Date().toISOString()): boolean {
  if (override === 'launch') return true;
  if (override === 'standard') return false;
  if (!firstPublishedISO) return false;
  const publishedAt = new Date(firstPublishedISO).getTime();
  return Number.isFinite(publishedAt) && Date.parse(at) < publishedAt + 60 * 24 * 60 * 60_000;
}

export function planSeats(plan: string, expiresISO: string | null | undefined, tags: string[], launch: boolean, at = new Date().toISOString()): number {
  // -1 is the API's explicit unlimited marker for a Free-tagged plugin.
  if (tags.includes('Free')) return -1;
  const name = normalizedPlan(plan);
  if (name === 'Spawn') return 0;
  if (!expiresISO || expiresISO <= at) return 0;
  if (name === 'Craft') return launch ? 0 : 1;
  return 2;
}

export function fitsIpGroups(groupSizes: Iterable<number>, purchases: number, subscriptionSeats: number): boolean {
  let groupsNeeded = 0;
  let oddGroups = 0;
  for (const count of groupSizes) {
    groupsNeeded += Math.ceil(count / 2);
    oddGroups += count % 2;
  }
  const singleSavings = Math.min(subscriptionSeats, oddGroups);
  const pairSavings = Math.floor(Math.max(0, subscriptionSeats - singleSavings) / 2);
  return groupsNeeded - singleSavings - pairSavings <= purchases;
}
