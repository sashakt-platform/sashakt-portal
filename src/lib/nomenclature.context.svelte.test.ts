import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import NomenclatureHarness from './__test__/NomenclatureHarness.svelte';

describe('Nomenclature context — useTerms reactivity', () => {
	it('falls back to built-in default when no override is set', () => {
		render(NomenclatureHarness, { props: { key: 'tests' } });
		expect(screen.getByTestId('resolved')).toHaveTextContent('Tests');
	});

	it('returns the custom override when one is provided via context', () => {
		render(NomenclatureHarness, {
			props: { key: 'tests', overrides: { tests: 'Exams' } }
		});
		expect(screen.getByTestId('resolved')).toHaveTextContent('Exams');
	});

	it('honors casing="lower"', () => {
		render(NomenclatureHarness, {
			props: { key: 'tests', overrides: { tests: 'Exams' }, casing: 'lower' }
		});
		expect(screen.getByTestId('resolved')).toHaveTextContent('exams');
	});

	it('honors casing="upper"', () => {
		render(NomenclatureHarness, {
			props: { key: 'tag_types', overrides: { tag_types: 'Topic Types' }, casing: 'upper' }
		});
		expect(screen.getByTestId('resolved')).toHaveTextContent('TOPIC TYPES');
	});

	it('falls back to built-in for keys without overrides', () => {
		render(NomenclatureHarness, {
			props: { key: 'users', overrides: { tests: 'Exams' } }
		});
		expect(screen.getByTestId('resolved')).toHaveTextContent('Users');
	});
});
