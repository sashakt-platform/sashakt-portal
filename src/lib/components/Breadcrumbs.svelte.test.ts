import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import Breadcrumbs from './Breadcrumbs.svelte';

// Mock $app/state with a factory function
vi.mock('$app/state', () => {
	return {
		page: {
			url: new URL('http://localhost/dashboard')
		}
	};
});

describe('Breadcrumbs', () => {
	describe('Basic Rendering', () => {
		it('should render without errors', () => {
			const { container } = render(Breadcrumbs);
			expect(container).toBeInTheDocument();
		});
	});
});
