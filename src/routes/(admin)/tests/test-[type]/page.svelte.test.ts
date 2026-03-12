import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TestListingPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/tests/test-session'),
		searchParams: new URLSearchParams()
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => false),
	canUpdate: vi.fn(() => false),
	canDelete: vi.fn(() => false),
	isStateAdmin: vi.fn(() => false),
	hasAssignedDistricts: vi.fn(() => false)
}));

vi.mock('$lib/components/data-table/index.js', () => ({
	DataTable: vi.fn()
}));

vi.mock('$lib/components/StateSelection.svelte', () => ({
	default: function MockStateSelection() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('$lib/components/DistrictSelection.svelte', () => ({
	default: function MockDistrictSelection() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('$lib/components/TagsSelection.svelte', () => ({
	default: function MockTagsSelection() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('$lib/components/TagTypeSelection.svelte', () => ({
	default: function MockTagTypeSelection() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

vi.mock('./columns.js', () => ({
	createTestColumns: vi.fn(() => [])
}));

import { canCreate, isStateAdmin, hasAssignedDistricts } from '$lib/utils/permissions.js';
import { goto } from '$app/navigation';

const baseData = (is_template: boolean, items: any[] = []) => ({
	is_template,
	tests: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
	questions: [],
	test_taker_url: 'http://test-taker.example.com',
	params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc' },
	user: { id: 1, permissions: [] }
});

describe('Test Management Listing Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('should show "Test templates" title for template mode', () => {
			render(TestListingPage, { data: baseData(true) });
			expect(screen.getByText('Test templates')).toBeInTheDocument();
		});

		it('should show "Test sessions" title for session mode', () => {
			render(TestListingPage, { data: baseData(false) });
			expect(screen.getByText('Test sessions')).toBeInTheDocument();
		});

		it('should show template subtitle for template mode', () => {
			render(TestListingPage, { data: baseData(true) });
			expect(screen.getByText('Manage test templates')).toBeInTheDocument();
		});

		it('should show session subtitle for session mode', () => {
			render(TestListingPage, { data: baseData(false) });
			expect(screen.getByText('Manage test sessions')).toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Empty state', () => {
		it('should show empty state when no items and no filters', () => {
			render(TestListingPage, { data: baseData(false, []) });
			expect(screen.getByText('Create your first test session')).toBeInTheDocument();
		});

		it('should show template empty state text for template mode', () => {
			render(TestListingPage, { data: baseData(true, []) });
			expect(screen.getByText('Create your first test template')).toBeInTheDocument();
		});

		it('should not show empty state when items are present', () => {
			const items = [{ id: '1', name: 'Test A' }];
			render(TestListingPage, { data: baseData(false, items) });
			expect(screen.queryByText('Create your first test session')).not.toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Create button', () => {
		it('should show "Create a test template" button when user has permission and items exist', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			const items = [{ id: '1', name: 'Template A' }];
			render(TestListingPage, { data: baseData(true, items) });
			expect(screen.getByText('Create a test template')).toBeInTheDocument();
		});

		it('should show "Create a test session" button when user has permission and items exist', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			const items = [{ id: '1', name: 'Session A' }];
			render(TestListingPage, { data: baseData(false, items) });
			expect(screen.getByText('Create a test session')).toBeInTheDocument();
		});

		it('should not show create button when user lacks permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			const items = [{ id: '1', name: 'Session A' }];
			render(TestListingPage, { data: baseData(false, items) });
			expect(screen.queryByText('Create a test session')).not.toBeInTheDocument();
		});

		it('should not show create button when in empty state (no items)', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(TestListingPage, { data: baseData(false, []) });
			// In empty state the header button is hidden; the empty state box has its own CTA
			expect(screen.queryByText('Create a test session')).not.toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	// Filters are only rendered when there is data (not in empty state).
	describe('Filter visibility', () => {
		const withItems = (is_template: boolean) =>
			baseData(is_template, [{ id: '1', name: 'Test A' }]);

		it('should show search input when items are present', () => {
			render(TestListingPage, { data: withItems(false) });
			expect(screen.getByPlaceholderText('Search test sessions...')).toBeInTheDocument();
		});

		it('should show correct search placeholder for template mode', () => {
			render(TestListingPage, { data: withItems(true) });
			expect(screen.getByPlaceholderText('Search test templates...')).toBeInTheDocument();
		});

		it('should show correct search placeholder for session mode', () => {
			render(TestListingPage, { data: withItems(false) });
			expect(screen.getByPlaceholderText('Search test sessions...')).toBeInTheDocument();
		});

		it('should call isStateAdmin to determine state filter visibility', () => {
			vi.mocked(isStateAdmin).mockReturnValue(false);
			render(TestListingPage, { data: withItems(false) });
			expect(isStateAdmin).toHaveBeenCalled();
		});

		it('should call hasAssignedDistricts to determine district filter visibility', () => {
			vi.mocked(hasAssignedDistricts).mockReturnValue(false);
			render(TestListingPage, { data: withItems(false) });
			expect(hasAssignedDistricts).toHaveBeenCalled();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Search input behavior', () => {
		// Items must be present so the filters snippet (and the input) renders.
		function withSearch(search: string, is_template = false) {
			return {
				...baseData(is_template, [{ id: '1', name: 'Test A' }]),
				params: { page: 2, size: 25, search, sortBy: '', sortOrder: 'asc' }
			};
		}

		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('reflects the current search value from params', () => {
			render(TestListingPage, { data: withSearch('existing query') });
			expect(screen.getByPlaceholderText('Search test sessions...')).toHaveValue(
				'existing query'
			);
		});

		it('shows empty value when search param is empty', () => {
			render(TestListingPage, { data: withSearch('') });
			expect(screen.getByPlaceholderText('Search test sessions...')).toHaveValue('');
		});

		it('does not call goto before the 300ms debounce elapses', async () => {
			render(TestListingPage, { data: withSearch('') });
			const input = screen.getByPlaceholderText('Search test sessions...');

			await fireEvent.input(input, { target: { value: 'math' } });
			vi.advanceTimersByTime(299);

			expect(goto).not.toHaveBeenCalled();
		});

		it('calls goto exactly once after 300ms with the typed value', async () => {
			render(TestListingPage, { data: withSearch('') });
			const input = screen.getByPlaceholderText('Search test sessions...');

			await fireEvent.input(input, { target: { value: 'math' } });
			vi.advanceTimersByTime(300);

			expect(goto).toHaveBeenCalledOnce();
			const [calledUrl] = vi.mocked(goto).mock.calls[0] as [URL, unknown];
			expect(calledUrl.searchParams.get('search')).toBe('math');
		});

		it('resets page to 1 on every search regardless of current page', async () => {
			render(TestListingPage, { data: withSearch('') }); // page starts at 2
			const input = screen.getByPlaceholderText('Search test sessions...');

			await fireEvent.input(input, { target: { value: 'math' } });
			vi.advanceTimersByTime(300);

			const [calledUrl] = vi.mocked(goto).mock.calls[0] as [URL, unknown];
			expect(calledUrl.searchParams.get('page')).toBe('1');
		});

		it('removes the search param from the URL when input is cleared', async () => {
			render(TestListingPage, { data: withSearch('old query') });
			const input = screen.getByPlaceholderText('Search test sessions...');

			await fireEvent.input(input, { target: { value: '' } });
			vi.advanceTimersByTime(300);

			const [calledUrl] = vi.mocked(goto).mock.calls[0] as [URL, unknown];
			expect(calledUrl.searchParams.has('search')).toBe(false);
		});

		it('still resets page to 1 when input is cleared', async () => {
			render(TestListingPage, { data: withSearch('old query') });
			const input = screen.getByPlaceholderText('Search test sessions...');

			await fireEvent.input(input, { target: { value: '' } });
			vi.advanceTimersByTime(300);

			const [calledUrl] = vi.mocked(goto).mock.calls[0] as [URL, unknown];
			expect(calledUrl.searchParams.get('page')).toBe('1');
		});

		it('calls goto with keepFocus: true and invalidateAll: true', async () => {
			render(TestListingPage, { data: withSearch('') });
			const input = screen.getByPlaceholderText('Search test sessions...');

			await fireEvent.input(input, { target: { value: 'math' } });
			vi.advanceTimersByTime(300);

			expect(goto).toHaveBeenCalledWith(expect.any(URL), {
				keepFocus: true,
				invalidateAll: true
			});
		});

		it('debounces rapid typing — only one goto call for the final value', async () => {
			render(TestListingPage, { data: withSearch('') });
			const input = screen.getByPlaceholderText('Search test sessions...');

			// Simulate user typing quickly
			await fireEvent.input(input, { target: { value: 'm' } });
			vi.advanceTimersByTime(100);
			await fireEvent.input(input, { target: { value: 'ma' } });
			vi.advanceTimersByTime(100);
			await fireEvent.input(input, { target: { value: 'mat' } });
			vi.advanceTimersByTime(100);
			await fireEvent.input(input, { target: { value: 'math' } });
			vi.advanceTimersByTime(300); // only this final timeout completes

			expect(goto).toHaveBeenCalledOnce();
		});

		it('works the same for template mode — uses template placeholder', async () => {
			render(TestListingPage, { data: withSearch('', true) });
			const input = screen.getByPlaceholderText('Search test templates...');

			await fireEvent.input(input, { target: { value: 'algebra' } });
			vi.advanceTimersByTime(300);

			const [calledUrl] = vi.mocked(goto).mock.calls[0] as [URL, unknown];
			expect(calledUrl.searchParams.get('search')).toBe('algebra');
		});
	});
});
