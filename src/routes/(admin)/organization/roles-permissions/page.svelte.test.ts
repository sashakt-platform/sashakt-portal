import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import RolesPermissionsPage from './+page.svelte';

describe('Roles and Permission Page (+page.svelte)', () => {
	it('renders the "Roles and Permission" heading', () => {
		render(RolesPermissionsPage);
		expect(screen.getByRole('heading', { name: /roles and permission/i })).toBeInTheDocument();
	});

	it('shows the coming soon placeholder message', () => {
		render(RolesPermissionsPage);
		expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
		expect(
			screen.getByText(/roles and permission management is on its way/i)
		).toBeInTheDocument();
	});

	it('does not render a data table or listing content', () => {
		const { container } = render(RolesPermissionsPage);
		expect(container.querySelector('table')).not.toBeInTheDocument();
	});
});
