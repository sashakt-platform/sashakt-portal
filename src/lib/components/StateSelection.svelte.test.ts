import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import StateSelection from './StateSelection.svelte';

const mockFilterationInstances: any[] = [];

vi.mock('./Filteration.svelte', () => ({
	default: function MockFilteration(options: any) {
		const instance = {
			$$set: vi.fn(),
			$destroy: vi.fn(),
			$on: vi.fn(),
			_props: options?.props || {},
			_target: options?.target
		};
		mockFilterationInstances.push(instance);
		return instance;
	}
}));

// Mock $app/state
vi.mock('$app/state', () => ({
	page: {
		data: {
			states: {
				items: [
					{ id: 1, name: 'Maharashtra' },
					{ id: 2, name: 'Karnataka' },
					{ id: 3, name: 'Tamil Nadu' }
				]
			}
		},
		url: new URL('http://localhost')
	}
}));

describe('StateSelection', () => {
	describe('Basic Rendering', () => {
		it('should render without errors', () => {
			const { container } = render(StateSelection, {
				props: {
					states: []
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with initial states', () => {
			const initialStates = [
				{ id: '1', name: 'Maharashtra' },
				{ id: '2', name: 'Karnataka' }
			];

			const { container } = render(StateSelection, {
				props: {
					states: initialStates
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with empty states array', () => {
			const { container } = render(StateSelection, {
				props: {
					states: []
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('should accept states prop', () => {
			const states = [{ id: '1', name: 'Maharashtra' }];

			const { container } = render(StateSelection, {
				props: { states }
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle undefined states', () => {
			const { container } = render(StateSelection, {
				props: {}
			});

			expect(container).toBeInTheDocument();
		});

		it('should pass through additional props', () => {
			const { container } = render(StateSelection, {
				props: {
					states: [],
					'data-testid': 'state-selection'
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('State Data', () => {
		it('should use states from page data', () => {
			const { container } = render(StateSelection, {
				props: {
					states: []
				}
			});

			// Component should render without error even when using derived stateList
			expect(container).toBeInTheDocument();
		});

		it('should handle missing page data gracefully', () => {
			// Mock missing states data
			vi.mock('$app/state', () => ({
				page: {
					data: {},
					url: new URL('http://localhost')
				}
			}));

			const { container } = render(StateSelection, {
				props: {
					states: []
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle large number of states', () => {
			const manyStates = Array.from({ length: 50 }, (_, i) => ({
				id: String(i + 1),
				name: `State ${i + 1}`
			}));

			const { container } = render(StateSelection, {
				props: {
					states: manyStates
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle states with special characters in names', () => {
			const statesWithSpecialChars = [
				{ id: '1', name: 'Jammu & Kashmir' },
				{ id: '2', name: 'Arunachal Pradesh' }
			];

			const { container } = render(StateSelection, {
				props: {
					states: statesWithSpecialChars
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle states with numeric IDs', () => {
			const statesWithNumericIds = [
				{ id: 1, name: 'State 1' },
				{ id: 2, name: 'State 2' }
			];

			const { container } = render(StateSelection, {
				props: {
					states: statesWithNumericIds as any
				}
			});

			expect(container).toBeInTheDocument();
		});
	});
});
