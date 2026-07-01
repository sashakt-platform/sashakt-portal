import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AddProviderPage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

function storeOf<T>(initial: T) {
	let value = initial;
	const subscribers = new Set<(v: T) => void>();
	return {
		subscribe: (fn: (v: T) => void) => {
			subscribers.add(fn);
			fn(value);
			return () => subscribers.delete(fn);
		},
		set: (v: T) => {
			value = v;
			subscribers.forEach((fn) => fn(value));
		},
		update: (fn: (v: T) => T) => {
			value = fn(value);
			subscribers.forEach((fn) => fn(value));
		}
	};
}

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn((formInput: { data?: Record<string, unknown>; errors?: Record<string, unknown> }) => ({
		form: storeOf(formInput?.data ?? { provider_id: 0, config_json: '', is_enabled: true }),
		errors: storeOf(formInput?.errors ?? {}),
		constraints: storeOf({}),
		tainted: storeOf(undefined),
		allErrors: storeOf([]),
		posted: storeOf(false),
		message: storeOf(undefined),
		submitting: storeOf(false),
		enhance: vi.fn()
	}))
}));

const mockProviders = [
	{ id: 1, name: 'Google Sheets', provider_type: 'sheets' },
	{ id: 2, name: 'Twilio', provider_type: 'sms' }
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		form: {
			data: { provider_id: 0, config_json: '', is_enabled: true },
			errors: {}
		},
		action: 'add',
		providers: mockProviders,
		...overrides
	};
}

describe('Add Provider Page (+page.svelte)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Page structure', () => {
		it('renders the "Add Provider" heading', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByRole('heading', { name: /add provider/i })).toBeInTheDocument();
		});

		it('renders the "Provider Details" section heading', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByText('Provider Details')).toBeInTheDocument();
		});

		it('renders a back link pointing to the integrations list', () => {
			render(AddProviderPage, { data: makeData() } as never);
			const backLink = screen.getByRole('link', { name: /back to integrations/i });
			expect(backLink).toHaveAttribute('href', '/organization/integrations');
		});

		it('form posts to the "save" named action', () => {
			const { container } = render(AddProviderPage, { data: makeData() } as never);
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toHaveAttribute('action', '?/save');
		});
	});

	describe('Field labels', () => {
		it('renders Provider, Status and Configuration (JSON) labels', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByText('Provider')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
			expect(screen.getByText('Configuration (JSON)')).toBeInTheDocument();
		});
	});

	describe('Provider select', () => {
		it('shows "Select provider" placeholder when no provider is chosen', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByText('Select provider')).toBeInTheDocument();
		});

		it('shows the matching provider name when provider_id is pre-filled', () => {
			const { container } = render(AddProviderPage, {
				data: makeData({
					form: { data: { provider_id: 2, config_json: '', is_enabled: true }, errors: {} }
				})
			} as never);
			expect(container.querySelector('[aria-haspopup="listbox"]')).toHaveTextContent('Twilio');
		});

		it('falls back to "Select provider" when provider_id has no matching option', () => {
			const { container } = render(AddProviderPage, {
				data: makeData({
					form: { data: { provider_id: 999, config_json: '', is_enabled: true }, errors: {} }
				})
			} as never);
			expect(container.querySelector('[aria-haspopup="listbox"]')).toHaveTextContent(
				'Select provider'
			);
		});

		it('renders without crashing when the providers list is empty', () => {
			render(AddProviderPage, { data: makeData({ providers: [] }) } as never);
			expect(screen.getByText('Select provider')).toBeInTheDocument();
		});
	});

	describe('Save button state', () => {
		it('disables Save when no provider is selected', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});

		it('enables Save once a provider is pre-selected', () => {
			render(AddProviderPage, {
				data: makeData({
					form: { data: { provider_id: 1, config_json: '', is_enabled: true }, errors: {} }
				})
			} as never);
			expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
		});
	});

	describe('Status toggle', () => {
		it('shows "Enabled" and a checked switch when is_enabled is true', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByText('Enabled')).toBeInTheDocument();
			expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
		});

		it('shows "Disabled" and an unchecked switch when is_enabled is false', () => {
			render(AddProviderPage, {
				data: makeData({
					form: { data: { provider_id: 0, config_json: '', is_enabled: false }, errors: {} }
				})
			} as never);
			expect(screen.getByText('Disabled')).toBeInTheDocument();
			expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
		});

		it('toggling the switch flips the label from Enabled to Disabled', async () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByText('Enabled')).toBeInTheDocument();
			await fireEvent.click(screen.getByRole('switch'));
			expect(screen.getByText('Disabled')).toBeInTheDocument();
		});
	});

	describe('Config JSON textarea', () => {
		it('renders with the service-account JSON placeholder', () => {
			render(AddProviderPage, { data: makeData() } as never);
			expect(screen.getByPlaceholderText(/service_account/)).toBeInTheDocument();
		});

		it('pre-fills an existing config_json value', () => {
			render(AddProviderPage, {
				data: makeData({
					form: {
						data: { provider_id: 1, config_json: '{"key":"value"}', is_enabled: true },
						errors: {}
					}
				})
			} as never);
			expect(screen.getByPlaceholderText(/service_account/)).toHaveValue('{"key":"value"}');
		});

		it('updates its value as the user types', async () => {
			render(AddProviderPage, { data: makeData() } as never);
			const textarea = screen.getByPlaceholderText(/service_account/);
			await fireEvent.input(textarea, { target: { value: '{"a":1}' } });
			expect(textarea).toHaveValue('{"a":1}');
		});
	});

	describe('Validation errors', () => {
		it('shows the provider_id error message when present', () => {
			render(AddProviderPage, {
				data: makeData({
					form: {
						data: { provider_id: 0, config_json: '', is_enabled: true },
						errors: { provider_id: ['Please select a provider'] }
					}
				})
			} as never);
			expect(screen.getByText('Please select a provider')).toBeInTheDocument();
		});

		it('shows the config_json error message when present', () => {
			render(AddProviderPage, {
				data: makeData({
					form: {
						data: { provider_id: 1, config_json: 'not json', is_enabled: true },
						errors: { config_json: ['Config must be valid JSON'] }
					}
				})
			} as never);
			expect(screen.getByText('Config must be valid JSON')).toBeInTheDocument();
		});
	});
});
