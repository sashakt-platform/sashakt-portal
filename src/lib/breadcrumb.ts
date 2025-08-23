/**
 * Turns `/products/123/details`  ➜
 * [
 *   { label: 'Products', href: '/products' },
 *   { label: '123',       href: '/products/123' },
 *   { label: 'Details',   href: '/products/123/details' }
 * ]
 */

const routes: Record<string, string> = {
	dashboard: 'Dashboard',
	profile: 'Profile',
	password: 'Update password',
	questionbank: 'Question Bank',
	'single-question': 'Create a question',
	import: 'Add questions',
	tags: 'Tag Management',
	tests: 'Test Management',
	users: 'User Management',
	tag: 'Create a tag',
	tagtype: 'Create a tag type',
	add: 'Create new user'
};

export const breadcrumbs = (pathname: string) => {
	const segments = pathname.split('/').slice(0, 3).filter(Boolean);

	let pathAccumulator = '';
	return segments.map((segment) => {
		pathAccumulator += `/${segment}`;

		let label;
		if (routes[segment]) {
			label = routes[segment];
		} else {
			// prettify the label ("order-history" -> "Order history")
			const words = segment.replace(/[-_]+/g, ' ').split(' ');
			label = words
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ')
				// optional decode for dynamic IDs
				.replace(/%20/g, ' ');
		}

		return { label, href: pathAccumulator };
	});
};
