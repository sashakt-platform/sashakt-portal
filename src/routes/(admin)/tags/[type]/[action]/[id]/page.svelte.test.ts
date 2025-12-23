import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagFormPage from './+page.svelte';

const baseData = {
	tagForm: {
		valid: true,
		data: { name: null, description: '', tag_type_id: null }
	},
	tagTypeForm: {
		valid: true,
		data: { name: '', description: '' }
	},
	tagTypes: [
		{ id: 1, name: 'Type A' },
		{ id: 2, name: 'Type B' }
	],
	type: 'tag',
	tagData: null,
	user: { organization_id: 123 }
};
const baseTagTypeData = {
	tagForm: {
		valid: true,
		data: { name: null, description: '', tag_type_id: null }
	},
	tagTypeForm: {
		valid: true,
		data: { name: '', description: '' }
	},
	tagTypes: [],
	type: 'tagtype',
	tagData: null,
	user: { organization_id: 123 }
};

describe('TagFormPage', () => {
	test('renders create tag form', () => {
		render(TagFormPage, { data: baseData });
		expect(screen.getByRole('heading', { name: /create a tag/i })).toBeInTheDocument();

		expect(
			screen.getByRole('heading', {
				name: /name/i
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {
				name: /description/i
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {
				name: /tag type/i
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: /select tag type/i
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: /save/i
			})
		).toBeInTheDocument();
		const cancelBtn = screen.getByRole('button', { name: /cancel/i });
		expect(cancelBtn).toBeInTheDocument();
		expect(cancelBtn).toBeEnabled();
	});
	test('enables Save Tag button after entering name and submits form', async () => {
		render(TagFormPage, { data: baseData });

		const saveBtn = screen.getByRole('button', { name: /save/i });
		const nameInput = screen.getByTestId('tag-name-input') as HTMLInputElement;
		const descInput = screen.getByTestId('tag-desc-input') as HTMLInputElement;

		await fireEvent.input(nameInput, { target: { value: 'My Test Tag' } });
		await fireEvent.input(descInput, { target: { value: 'This is a description' } });
		expect(nameInput.value).toBe('My Test Tag');
		expect(descInput.value).toBe('This is a description');
		expect(saveBtn).toBeEnabled();
	});

	test('renders edit tag form', async () => {
		const data = {
			...baseData,
			tagData: { name: 'Existing Tag', description: 'desc', tag_type: { id: 1, name: 'Type A' } },
			tagTypes: [
				{ id: 1, name: 'Type A' },
				{ id: 2, name: 'Type B' }
			]
		};

		render(TagFormPage, { data });

		expect(screen.getByText('Edit Tag')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Existing Tag')).toBeInTheDocument();
		expect(screen.getByDisplayValue('desc')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Type A/i })).toBeInTheDocument();
		const saveBtn = screen.getByRole('button', { name: /save/i });
		expect(saveBtn).toBeEnabled();
	});

	test('renders create tag type form', () => {
		render(TagFormPage, { data: baseTagTypeData });

		expect(screen.getByRole('heading', { name: /create a tag type/i })).toBeInTheDocument();

		expect(screen.getByRole('heading', { name: /name/i })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: /description/i })).toBeInTheDocument();

		expect(screen.queryByRole('button', { name: /select tag type/i })).not.toBeInTheDocument();

		const cancelBtn = screen.getByRole('button', { name: /cancel/i });
		expect(cancelBtn).toBeInTheDocument();
		expect(cancelBtn).toBeEnabled();
	});
	test('enables Save TagType button after entering name and description', async () => {
		render(TagFormPage, { data: baseTagTypeData });

		const saveBtn = screen.getByRole('button', { name: /save/i });
		const nameInput = screen.getByTestId('tag-name-input') as HTMLInputElement;
		const descInput = screen.getByTestId('tag-desc-input') as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'New TagType' } });
		await fireEvent.input(descInput, { target: { value: 'Description for tag type' } });

		expect(nameInput.value).toBe('New TagType');
		expect(descInput.value).toBe('Description for tag type');

		expect(saveBtn).toBeEnabled();
	});
	test('renders edit tag type form', () => {
		const editData = {
			...baseTagTypeData,
			tagData: { name: 'Existing TagType', description: 'Tag type description' }
		};

		render(TagFormPage, { data: editData });

		expect(screen.getByText('Edit Tag Type')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Existing TagType')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Tag type description')).toBeInTheDocument();

		expect(screen.queryByRole('button', { name: /select tag type/i })).not.toBeInTheDocument();

		const saveBtn = screen.getByRole('button', { name: /save/i });
		expect(saveBtn).toBeEnabled();
	});
});
