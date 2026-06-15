import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FieldTypeGrid from './FieldTypeGrid.svelte';

describe('FieldTypeGrid', () => {
	let onSelect: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		onSelect = vi.fn();
	});

	// ─── Category headers ──────────────────────────────────────────────────────

	describe('Category headers', () => {
		it('renders all three category section headings', () => {
			render(FieldTypeGrid, { onSelect });

			expect(screen.getByText('Commonly Used')).toBeInTheDocument();
			expect(screen.getByText('General')).toBeInTheDocument();
			expect(screen.getByText('Choice List')).toBeInTheDocument();
		});
	});

	// ─── Button rendering ──────────────────────────────────────────────────────

	describe('Button rendering', () => {
		it('renders 15 field type buttons in total', () => {
			render(FieldTypeGrid, { onSelect });

			expect(screen.getAllByRole('button')).toHaveLength(15);
		});

		it('renders all Commonly Used field type buttons', () => {
			render(FieldTypeGrid, { onSelect });

			expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Phone number' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'State' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'District' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Block' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Entity' })).toBeInTheDocument();
		});

		it('renders all General field type buttons', () => {
			render(FieldTypeGrid, { onSelect });

			expect(screen.getByRole('button', { name: 'Short Text' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Paragraph' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Number' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Date' })).toBeInTheDocument();
		});

		it('renders all Choice List field type buttons', () => {
			render(FieldTypeGrid, { onSelect });

			expect(screen.getByRole('button', { name: 'Check box' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Radio button' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Dropdown' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Multi Select' })).toBeInTheDocument();
		});

		it('all buttons have type="button" to avoid accidental form submission', () => {
			render(FieldTypeGrid, { onSelect });

			for (const btn of screen.getAllByRole('button')) {
				expect(btn).toHaveAttribute('type', 'button');
			}
		});
	});

	// ─── onSelect callback ─────────────────────────────────────────────────────

	describe('onSelect callback', () => {
		it.each([
			['Name', 'full_name'],
			['Email', 'email'],
			['Phone number', 'phone'],
			['State', 'state'],
			['District', 'district'],
			['Block', 'block'],
			['Entity', 'entity'],
			['Short Text', 'text'],
			['Paragraph', 'textarea'],
			['Number', 'number'],
			['Date', 'date'],
			['Check box', 'checkbox'],
			['Radio button', 'radio'],
			['Dropdown', 'select'],
			['Multi Select', 'multi_select']
		])('clicking "%s" calls onSelect with "%s"', async (label, expectedType) => {
			render(FieldTypeGrid, { onSelect });

			await fireEvent.click(screen.getByRole('button', { name: label }));

			expect(onSelect).toHaveBeenCalledOnce();
			expect(onSelect).toHaveBeenCalledWith(expectedType);
		});

		it('calls onSelect exactly once per click', async () => {
			render(FieldTypeGrid, { onSelect });

			await fireEvent.click(screen.getByRole('button', { name: 'Email' }));

			expect(onSelect).toHaveBeenCalledTimes(1);
		});

		it('calls onSelect on each successive click with the respective type', async () => {
			render(FieldTypeGrid, { onSelect });

			await fireEvent.click(screen.getByRole('button', { name: 'Email' }));
			await fireEvent.click(screen.getByRole('button', { name: 'Short Text' }));

			expect(onSelect).toHaveBeenCalledTimes(2);
			expect(onSelect).toHaveBeenNthCalledWith(1, 'email');
			expect(onSelect).toHaveBeenNthCalledWith(2, 'text');
		});
	});
});
