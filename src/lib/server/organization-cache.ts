const ORG_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const ORG_CACHE_MAX_SIZE = 100;

type OrgCacheValue = App.Locals['organization'];

const orgCache = new Map<string, { data: OrgCacheValue; expiresAt: number }>();

export function getCachedOrganization(shortcode: string): OrgCacheValue | null {
	const entry = orgCache.get(shortcode);
	if (!entry) return null;
	if (entry.expiresAt <= Date.now()) {
		orgCache.delete(shortcode);
		return null;
	}
	return entry.data;
}

export function setCachedOrganization(shortcode: string, data: OrgCacheValue) {
	if (!orgCache.has(shortcode) && orgCache.size >= ORG_CACHE_MAX_SIZE) {
		const oldestKey = orgCache.keys().next().value;
		if (oldestKey !== undefined) orgCache.delete(oldestKey);
	}
	orgCache.set(shortcode, { data, expiresAt: Date.now() + ORG_CACHE_TTL });
}

export function invalidateOrganizationCache(shortcode: string) {
	orgCache.delete(shortcode);
}
