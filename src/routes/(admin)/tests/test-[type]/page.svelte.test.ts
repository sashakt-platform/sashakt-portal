import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
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
});
