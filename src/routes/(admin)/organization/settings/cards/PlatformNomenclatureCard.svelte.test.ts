import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PlatformNomenclatureCard from './PlatformNomenclatureCard.svelte';
import { fillMissingNomenclatureKeys } from '../schema';

function baseSettings(mode: 'default' | 'custom' = 'default') {
	return {
		// Only platform_nomenclature is read by the card; cast through unknown
		// keeps the rest of the OrganizationSettings shape unconstrained.
		platform_nomenclature: {
			mode,
			value: fillMissingNomenclatureKeys({})
		}
	} as unknown as Parameters<typeof PlatformNomenclatureCard>[0]['settings'];
}

describe('PlatformNomenclatureCard', () => {
	it('renders the card header and toggle controls', () => {
		render(PlatformNomenclatureCard, { settings: baseSettings('default') });

		expect(screen.getByRole('heading', { name: /Platform Nomenclature/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
	});

	it('disables all label inputs when mode = "default"', () => {
		render(PlatformNomenclatureCard, { settings: baseSettings('default') });

		const inputs = screen.getAllByPlaceholderText('Use default') as HTMLInputElement[];
		expect(inputs.length).toBeGreaterThan(0);
		for (const input of inputs) {
			expect(input).toBeDisabled();
		}
	});

	it('shows the "built-in names" helper text when mode = "default"', () => {
		render(PlatformNomenclatureCard, { settings: baseSettings('default') });
		expect(
			screen.getByText('Built-in names will be used for this organization.')
		).toBeInTheDocument();
	});

	it('enables all label inputs when mode = "custom"', () => {
		render(PlatformNomenclatureCard, { settings: baseSettings('custom') });

		const inputs = screen.getAllByPlaceholderText('Use default') as HTMLInputElement[];
		expect(inputs.length).toBeGreaterThan(0);
		for (const input of inputs) {
			expect(input).toBeEnabled();
		}
	});

	it('clicking Custom mutates the bound mode to "custom"', async () => {
		// `@testing-library/svelte` doesn't bind to $bindable props, so we can't
		// observe the post-toggle DOM re-render here. Verifying the mutation is
		// enough — superforms holds the source of truth and re-renders consumers.
		const settings = baseSettings('default');
		render(PlatformNomenclatureCard, { settings });

		await fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

		expect(settings.platform_nomenclature.mode).toBe('custom');
	});

	it('clicking Default mutates the bound mode to "default"', async () => {
		const settings = baseSettings('custom');
		render(PlatformNomenclatureCard, { settings });

		await fireEvent.click(screen.getByRole('button', { name: 'Default' }));

		expect(settings.platform_nomenclature.mode).toBe('default');
	});

	it('renders rows for every tracked default label', () => {
		render(PlatformNomenclatureCard, { settings: baseSettings('default') });

		// One label-text appearance per tracked term in the Default column.
		// Spot-check a few from each category (section labels, plural-only, bi-form).
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
		expect(screen.getByText('Question Bank')).toBeInTheDocument();
		expect(screen.getByText(/^Tests/)).toBeInTheDocument(); // "Tests" + (plural) chip
		expect(screen.getByText(/^Test$/)).toBeInTheDocument();
		expect(screen.getByText(/^Tag Types$/)).toBeInTheDocument();
		expect(screen.getByText(/^Tag Type$/)).toBeInTheDocument();
		expect(screen.getByText(/^Users$/)).toBeInTheDocument();
		expect(screen.getByText(/^User$/)).toBeInTheDocument();
	});

	it('shows "(plural)" / "(singular)" markers only on bi-form rows', () => {
		render(PlatformNomenclatureCard, { settings: baseSettings('default') });

		const pluralChips = screen.getAllByText('(plural)');
		const singularChips = screen.getAllByText('(singular)');

		// 8 bi-form rows (tests, tags, test_templates, tag_types, forms,
		// certificates, entities, users) — each exposes both chips.
		expect(pluralChips).toHaveLength(8);
		expect(singularChips).toHaveLength(8);
	});
});
