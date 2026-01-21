import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Organization from './+page.svelte';
import OrganizationForm from './OrganizationForm.svelte';

const fakeData = {
	user: {
		id: '1',
		full_name: 'Test User',
		email: 'test@example.com',
		phone: '1234567890',
		role_id: 1,
		organization_id: 1,
		created_by_id: null,
		is_active: true,
		created_date: new Date().toISOString(),
		modified_date: new Date().toISOString(),
		is_deleted: false,
		states: [],
		permissions: []
	},
	currentOrganization: {
		name: 'Test Org',
		description: 'Test Description',
		shortcode: 'TST',
		logo: 'https://example.com/logo.png'
	},
	form: {}
};

describe('Organization.svelte', () => {
	it('renders "Organization Management" text on the page', () => {
		render(Organization, { data: fakeData, isEditMode: false });

		expect(screen.getByText('Organization Management')).toBeInTheDocument();
	});
	it('renders "Manage Organization" text on the page', () => {
		render(Organization, { data: fakeData, isEditMode: false });

		expect(screen.getByText('Manage Organization')).toBeInTheDocument();
	});
	it('renders organization Name, Shortcode and Logo fields', () => {
		render(Organization, { data: fakeData, isEditMode: false });

		expect(screen.getByText(/name/i)).toBeInTheDocument();
		expect(screen.getByText(fakeData.currentOrganization.name)).toBeInTheDocument();

		expect(screen.getByText(/shortcode/i)).toBeInTheDocument();
		expect(screen.getByText(fakeData.currentOrganization.shortcode)).toBeInTheDocument();
		expect(screen.getByText(/tst/i)).toBeInTheDocument();

		expect(screen.getByText(/logo url/i)).toBeInTheDocument();
		expect(screen.getByText(/https:\/\/example\.com\/logo\.png/i)).toBeInTheDocument();
	});
	it('displays the Edit button for Organization form', () => {
		render(Organization, { data: fakeData, isEditMode: true });

		expect(
			screen.getByRole('button', {
				name: /edit/i
			})
		).toBeInTheDocument();
	});
});
const fakeData1 = {
	currentOrganization: {
		name: 'Test Org',
		description: 'Test Description',
		shortcode: 'TST',
		logo: 'https://example.com/logo.png'
	},
	form: {}
};
describe('OrganizationForm.svelte', () => {
	it('renders organization input fields in edit mode', () => {
		render(OrganizationForm, {
			data: fakeData1,
			isEditMode: true
		});

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/shortcode/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/logo url/i)).toBeInTheDocument();
	});
	it('shows Cancel and Save action buttons in edit mode', () => {
		render(OrganizationForm, {
			data: fakeData1,
			isEditMode: true
		});

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

		expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
	});
	it('renders Fields as an editable textbox in edit mode', () => {
		render(OrganizationForm, {
			data: fakeData1,
			isEditMode: true
		});

		expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: /shortcode/i })).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: /logo url/i })).toBeInTheDocument();
	});
});
