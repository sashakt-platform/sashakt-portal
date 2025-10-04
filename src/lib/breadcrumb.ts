/**
 * Turns `/products/123/details`  ➜
 * [
 *   { label: 'Products', href: '/products' },
 *   { label: '123',       href: '/products/123' },
 *   { label: 'Details',   href: '/products/123/details' }
 * ]
 */

const routes: Readonly<Record<string, string>> = {
	dashboard: 'Dashboard',
	profile: 'Profile',
	password: 'Update password',
	questionbank: 'Question Bank',
	tags: 'Tag Management',
	tests: 'Test Management',
	users: 'User Management',
	tagtype: 'Tag Type'
};

// Path-scoped overrides to prevent collisions with generic segments
const routeOverridesByPath: Readonly<Record<string, string>> = {
	'/tests/test-session/new': 'Create new session',
	'/tags/tag/add': 'Create a tag',
	'/tags/tag/edit': 'Edit tag',
	'/tags/tagtype/add': 'Create a tag type',
	'/tags/tagtype/edit': 'Edit tag type',
	'/users/add/new': 'Create new user',
	'/users/edit': 'Edit user',
	'/questionbank/import': 'Add questions',
	'/questionbank/single-question/add': 'Create a question',
	'/questionbank/single-question/edit': 'Edit question'
};

const prettifyLabel = (segment: string) => {
	// prettify the label ("order-history" -> "Order history")
	const words = segment.replace(/[-_]+/g, ' ').split(' ');
	const label = words
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ')
		// optional decode for dynamic IDs
		.replace(/%20/g, ' ');

	return label;
};

export const breadcrumbs = (pathname: string) => {
	if (!pathname || pathname === '/') return [];
	const segments = pathname
		.split('/')
		.filter(Boolean)
		.slice(0, 3)
		.filter((item) => isNaN(item));

	let pathAccumulator = '';
	const crumbs = segments.map((segment) => {
		pathAccumulator += `/${segment}`;

		// First check for a full-path override, then fall back to global routes
		const override = routeOverridesByPath[pathAccumulator as keyof typeof routeOverridesByPath];
		let label = override
			? override
			: (routes[segment as keyof typeof routes] ?? prettifyLabel(segment));

		return { label, href: pathAccumulator };
	});

	if (crumbs.length <= 1) return crumbs;
	return [crumbs[0], crumbs[crumbs.length - 1]];
};
