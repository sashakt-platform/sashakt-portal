import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InlineFieldCard from './InlineFieldCard.svelte';

vi.mock('$app/forms', () => ({
	deserialize: vi.fn(() => ({ type: 'success' }))
}));

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => key
}));

vi.mock('svelte-sonner', () => ({
	toast: { error: vi.fn(), success: vi.fn() }
}));

// dragHandle is a Svelte action — return a no-op destroy in jsdom
vi.mock('svelte-dnd-action', () => ({
	dragHandle: () => ({ destroy: () => {} })
}));

const baseField = {
	id: 1,
	field_type: 'text' as const,
	label: 'Test Field',
	name: 'test_field',
	is_required: false,
	order: 0,
	placeholder: null,
	help_text: null,
	options: null,
	validation: null,
	default_value: null,
	entity_type_id: null
};

const defaultProps = {
	field: baseField,
	index: 0,
	entityTypes: [],
	onDelete: vi.fn(),
	onDuplicate: vi.fn(),
	onFieldTypeChange: vi.fn()
};

describe('InlineFieldCard — helper text saves on blur without debounce', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			text: () => Promise.resolve('{"type":"success"}')
		});
	});

	it('calls fetch immediately when helper text input is blurred', async () => {
		render(InlineFieldCard, { props: defaultProps });

		// Both "Placeholder Text" and "Helper Text" share the same placeholder string.
		// Helper Text is the second one in the DOM (index 1).
		const [, helperTextInput] = screen.getAllByPlaceholderText(
			'Enter placeholder text for the input field'
		);

		await fireEvent.input(helperTextInput, { target: { value: 'New helper text' } });
		await fireEvent.blur(helperTextInput);

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith('?/updateField', expect.objectContaining({ method: 'POST' }));

		const body: FormData = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body;
		const fieldJson = JSON.parse(body.get('field') as string);
		expect(fieldJson.help_text).toBe('New helper text');
	});

	it('does not call fetch before the input is blurred', async () => {
		render(InlineFieldCard, { props: defaultProps });

		const [, helperTextInput] = screen.getAllByPlaceholderText(
			'Enter placeholder text for the input field'
		);

		await fireEvent.input(helperTextInput, { target: { value: 'Still typing...' } });

		// No blur fired yet — fetch must not have been called
		expect(fetch).not.toHaveBeenCalled();
	});
});
