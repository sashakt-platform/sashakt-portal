import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OrganizationForm from './OrganizationForm.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/organization')
	}
}));

vi.mock('$app/environment', () => ({
	browser: false
}));

vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn()
}));

vi.mock('svelte-sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() }
}));

const emptyFileList = {
	subscribe: (fn: (v: FileList | null) => void) => {
		fn(null);
		return () => {};
	},
	set: () => {},
	update: () => {}
};

function storeOf<T>(value: T) {
	return {
		subscribe: (fn: (v: T) => void) => {
			fn(value);
			return () => {};
		},
		set: () => {},
		update: () => {}
	};
}

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn((data) => {
		const formValues = data?.data ?? data ?? {
			name: '',
			shortcode: '',
			analytics_link: ''
		};
		return {
			form: storeOf(formValues),
			errors: storeOf({} as Record<string, unknown>),
			constraints: storeOf({} as Record<string, unknown>),
			tainted: storeOf(undefined as Record<string, unknown> | undefined),
			allErrors: storeOf([] as unknown[]),
			posted: storeOf(false),
			message: storeOf(undefined),
			enhance: vi.fn(),
			submitting: storeOf(false)
		};
	}),
	fileProxy: vi.fn(() => emptyFileList)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

const createPageData = (overrides: {
	currentOrganization?: { name: string; shortcode: string; logo?: string | null } | null;
	analyticsLinkUrl?: string | null;
	platformGuideUrl?: string | null;
	platformGuideFilename?: string | null;
} = {}) => ({
	form: {
		data: { name: '', shortcode: '', analytics_link: '' }
	},
	currentOrganization: overrides.currentOrganization ?? null,
	analyticsLinkUrl: overrides.analyticsLinkUrl ?? null,
	platformGuideUrl: overrides.platformGuideUrl ?? null,
	platformGuideFilename: overrides.platformGuideFilename ?? null
});

const existingOrgData = createPageData({
	currentOrganization: { name: 'Test Org', shortcode: 'testorg', logo: 'https://example.com/logo.png' },
	analyticsLinkUrl: 'https://lookerstudio.google.com/test',
	platformGuideUrl: 'https://example.com/guide.pdf',
	platformGuideFilename: 'guide.pdf'
});

describe('OrganizationForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the form', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toBeInTheDocument();
		});

		it('should render "Organization Details" heading when no org exists', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Organization Details')).toBeInTheDocument();
		});

		it('should render org name as heading when org exists', () => {
			render(OrganizationForm, { data: existingOrgData });
			expect(screen.getByText('Test Org')).toBeInTheDocument();
		});

		it('should render "Organisation Details" section heading', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Organisation Details')).toBeInTheDocument();
		});
	});

	describe('Form Attributes', () => {
		it('should have POST method', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should have action ?/save', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('action', '?/save');
		});

		it('should have multipart/form-data enctype', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('enctype', 'multipart/form-data');
		});
	});

	describe('Field Labels', () => {
		it('should render Name label', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Name')).toBeInTheDocument();
		});

		it('should render Shortcode label', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Shortcode')).toBeInTheDocument();
		});

		it('should render Logo label', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Logo')).toBeInTheDocument();
		});

		it('should render Platform guide PDF label', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Platform guide PDF')).toBeInTheDocument();
		});

		it('should render Analytics link label', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Analytics link')).toBeInTheDocument();
		});
	});

	describe('Action Buttons', () => {
		it('should render Save button', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('should render Cancel button', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
		});

		it('should have Cancel as a link to /tests/test-session', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const cancelLink = container.querySelector('a[href="/tests/test-session"]');
			expect(cancelLink).toBeInTheDocument();
		});

		it('should disable Save button when form is untainted', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});
	});

	describe('Name Input', () => {
		it('should render name input', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const input = container.querySelector('input[name="name"]');
			expect(input).toBeInTheDocument();
		});

		it('should pre-fill name when org exists', () => {
			const { container } = render(OrganizationForm, { data: existingOrgData });
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input).toHaveValue('Test Org');
		});
	});

	describe('Platform Guide', () => {
		it('should render a file input that accepts PDF', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const fileInput = container.querySelector('input[type="file"][accept="application/pdf"]');
			expect(fileInput).toBeInTheDocument();
		});

		it('should show "No file selected" when no guide exists', () => {
			render(OrganizationForm, { data: createPageData() });
			const noFileTexts = screen.getAllByText('No file selected');
			expect(noFileTexts.length).toBeGreaterThanOrEqual(1);
		});

		it('should render Change button for PDF', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('Change')).toBeInTheDocument();
		});

		it('should show file size hint', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('PDF, max 10MB')).toBeInTheDocument();
		});
	});

	describe('Analytics Link', () => {
		it('should render analytics URL input', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const input = container.querySelector('input[type="url"]');
			expect(input).toBeInTheDocument();
		});

		it('should have correct placeholder', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const input = container.querySelector('input[type="url"]');
			expect(input).toHaveAttribute('placeholder', 'https://lookerstudio.google.com/...');
		});
	});

	describe('Logo Field', () => {
		it('should render logo file input that accepts images', () => {
			const { container } = render(OrganizationForm, { data: createPageData() });
			const fileInput = container.querySelector('input[type="file"][accept="image/png,image/jpeg,image/webp"]');
			expect(fileInput).toBeInTheDocument();
		});

		it('should show logo format hint', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText('PNG, JPG, WebP, max 2MB')).toBeInTheDocument();
		});
	});

	describe('Copy Portal URL', () => {
		it('should render "Copy Portal URL" button', () => {
			render(OrganizationForm, { data: createPageData() });
			expect(screen.getByText(/copy portal url/i)).toBeInTheDocument();
		});
	});
});
