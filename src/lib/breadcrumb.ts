/**
 * Turns `/products/123/details`  ➜
 * [
 *   { label: 'Products', href: '/products' },
 *   { label: '123',       href: '/products/123' },
 *   { label: 'Details',   href: '/products/123/details' }
 * ]
 */

export const breadcrumbs = (pathname: string) => {
	const segments = pathname.split('/').filter(Boolean);

	let pathAccumulator = '';
	return segments.map((segment) => {
		pathAccumulator += `/${segment}`;

		// prettify the label ("order-history" -> "Order history")
		const words = segment.replace(/[-_]+/g, ' ').split(' ');
		const label = words
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ')
			// optional decode for dynamic IDs
			.replace(/%20/g, ' ');

		return { label, href: pathAccumulator };
	});
};
