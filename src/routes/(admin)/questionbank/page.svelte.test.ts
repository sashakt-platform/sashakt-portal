import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import QuestionListingPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/questionbank'),
		searchParams: new URLSearchParams()
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => () => {})
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => false),
	canUpdate: vi.fn(() => false),
	canDelete: vi.fn(() => false),
	hasLocation: vi.fn(() => false)
}));

vi.mock('$lib/components/data-table', () => ({
	DataTable: vi.fn()
}));

vi.mock('$lib/components/data-table/BatchActionsToolbar.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

const { mockStateSelection } = vi.hoisted(() => ({
	mockStateSelection: vi.fn().mockImplementation(() => ({
		$$set: vi.fn(),
		$destroy: vi.fn(),
		$on: vi.fn()
	}))
}));

vi.mock('$lib/components/StateSelection.svelte', () => ({ default: mockStateSelection }));

vi.mock('$lib/components/TagsSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/TagTypeSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/DeleteDialog.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('./columns', () => ({
	createQuestionColumns: vi.fn(() => [])
}));

import { hasLocation } from '$lib/utils/permissions.js';
import { type Question } from './columns';

const baseData = (items: Partial<Question>[] = []) => ({
	questions: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
	params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc' },
	user: { id: 1, permissions: [] }
}) as any;

describe('Question Bank Listing Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('should show "Question Bank" title', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByText('Question Bank')).toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Empty state', () => {
		it('should show empty state when no items are present', () => {
			render(QuestionListingPage, { data: baseData([]) });
			expect(screen.getByText('Create your first question')).toBeInTheDocument();
		});

		it('should not show empty state when items are present', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.queryByText('Create your first question')).not.toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Filter visibility (location-based)', () => {
		it('should show state filter when user has no location assigned', () => {
			vi.mocked(hasLocation).mockReturnValue(false);
			mockStateSelection.mockClear();
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockStateSelection).toHaveBeenCalled();
		});

		it('should hide state filter when user has a state assigned', () => {
			vi.mocked(hasLocation).mockReturnValue(true);
			mockStateSelection.mockClear();
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockStateSelection).not.toHaveBeenCalled();
		});

		it('should hide state filter when user has districts assigned', () => {
			vi.mocked(hasLocation).mockReturnValue(true);
			mockStateSelection.mockClear();
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockStateSelection).not.toHaveBeenCalled();
		});
	});
});
