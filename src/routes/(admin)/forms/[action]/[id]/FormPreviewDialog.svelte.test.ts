/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import FormPreviewDialog from './FormPreviewDialog.svelte';
import type { FormField } from './schema.js';

// Mock child components that fetch data
const {
	mockStateSelection,
	mockDistrictSelection,
	mockBlockSelection,
	mockEntitySelection
} = vi.hoisted(() => {
	const makeMock = () =>
		vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }));
	return {
		mockStateSelection: makeMock(),
		mockDistrictSelection: makeMock(),
		mockBlockSelection: makeMock(),
		mockEntitySelection: makeMock()
	};
});

vi.mock('$lib/components/StateSelection.svelte', () => ({ default: mockStateSelection }));
vi.mock('$lib/components/DistrictSelection.svelte', () => ({ default: mockDistrictSelection }));
vi.mock('$lib/components/BlockSelection.svelte', () => ({ default: mockBlockSelection }));
vi.mock('$lib/components/EntitySelection.svelte', () => ({ default: mockEntitySelection }));

function makeField(overrides: Partial<FormField> & { id: number; field_type: string; label: string; name: string }): FormField {
	return {
		is_required: false,
		order: 0,
		placeholder: null,
		help_text: null,
		options: null,
		validation: null,
		default_value: null,
		entity_type_id: null,
		...overrides
	};
}

describe('FormPreviewDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Dialog Visibility', () => {
		it('should not render content when open is false', () => {
			render(FormPreviewDialog, {
				props: {
					open: false,
					formName: 'Test Form',
					fields: []
				}
			});

			expect(screen.queryByText('Form Preview')).not.toBeInTheDocument();
		});

		it('should render content when open is true', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Test Form',
					fields: []
				}
			});

			expect(screen.getByText('Form Preview')).toBeInTheDocument();
		});
	});

	describe('Form Name & Description', () => {
		it('should display the form name', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Registration Form',
					fields: []
				}
			});

			expect(screen.getByText('Registration Form')).toBeInTheDocument();
		});

		it('should display the form description when provided', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Registration Form',
					formDescription: 'Please fill in your details',
					fields: []
				}
			});

			expect(screen.getByText('Please fill in your details')).toBeInTheDocument();
		});

		it('should not display description when null', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Test Form',
					formDescription: null,
					fields: []
				}
			});

			expect(screen.queryByText('Please fill in your details')).not.toBeInTheDocument();
		});

		it('should show placeholder when form name is empty', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: '',
					fields: []
				}
			});

			expect(screen.getByText('Enter a form name to see the preview...')).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('should show empty message when no fields provided', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Test Form',
					fields: []
				}
			});

			expect(screen.getByText('Add fields to see them in preview...')).toBeInTheDocument();
		});
	});

	describe('Text Field Types', () => {
		it('should render a text input for TEXT field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Full Name', name: 'full_name', placeholder: 'Enter your name' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Full Name')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
		});

		it('should use default placeholder when none provided for text field', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Username', name: 'username' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('Enter username...')).toBeInTheDocument();
		});

		it('should render a textarea for TEXTAREA field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'textarea', label: 'Comments', name: 'comments', placeholder: 'Write here...' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Comments')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument();
		});

		it('should render email input for EMAIL field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'email', label: 'Email', name: 'email' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
		});

		it('should render phone input for PHONE field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'phone', label: 'Phone', name: 'phone' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('10-digit phone number')).toBeInTheDocument();
		});

		it('should render number input for NUMBER field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'number', label: 'Age', name: 'age' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
		});

		it('should render date input for DATE field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'date', label: 'Date of Birth', name: 'dob' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Date of Birth')).toBeInTheDocument();
		});
	});

	describe('Required Fields', () => {
		it('should show asterisk for required fields', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Name', name: 'name', is_required: true })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('*')).toBeInTheDocument();
		});

		it('should not show asterisk for optional fields', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Nickname', name: 'nickname', is_required: false })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.queryByText('*')).not.toBeInTheDocument();
		});
	});

	describe('Help Text', () => {
		it('should display help text when provided', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Name', name: 'name', help_text: 'Enter your full legal name' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Enter your full legal name')).toBeInTheDocument();
		});

		it('should not display help text when not provided', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Name', name: 'name', help_text: null })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.queryByText('Enter your full legal name')).not.toBeInTheDocument();
		});
	});

	describe('Choice Fields', () => {
		it('should render radio options for RADIO field type', () => {
			const fields = [
				makeField({
					id: 1,
					field_type: 'radio',
					label: 'Gender',
					name: 'gender',
					options: [
						{ id: 1, label: 'Male', value: 'male' },
						{ id: 2, label: 'Female', value: 'female' }
					]
				})
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Gender')).toBeInTheDocument();
			expect(screen.getByText('Male')).toBeInTheDocument();
			expect(screen.getByText('Female')).toBeInTheDocument();
		});

		it('should show empty message for radio with no options', () => {
			const fields = [
				makeField({ id: 1, field_type: 'radio', label: 'Choice', name: 'choice', options: [] })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('No options added yet...')).toBeInTheDocument();
		});

		it('should render checkbox options for CHECKBOX field type', () => {
			const fields = [
				makeField({
					id: 1,
					field_type: 'checkbox',
					label: 'Hobbies',
					name: 'hobbies',
					options: [
						{ id: 1, label: 'Reading', value: 'reading' },
						{ id: 2, label: 'Sports', value: 'sports' }
					]
				})
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Reading')).toBeInTheDocument();
			expect(screen.getByText('Sports')).toBeInTheDocument();
		});

		it('should render single checkbox with field label when no options', () => {
			const fields = [
				makeField({ id: 1, field_type: 'checkbox', label: 'I agree to terms', name: 'terms' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			const matches = screen.getAllByText('I agree to terms');
			expect(matches.length).toBeGreaterThanOrEqual(1);
		});

		it('should render multi-select options for MULTI_SELECT field type', () => {
			const fields = [
				makeField({
					id: 1,
					field_type: 'multi_select',
					label: 'Skills',
					name: 'skills',
					options: [
						{ id: 1, label: 'JavaScript', value: 'js' },
						{ id: 2, label: 'Python', value: 'py' }
					]
				})
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('JavaScript')).toBeInTheDocument();
			expect(screen.getByText('Python')).toBeInTheDocument();
		});

		it('should show empty message for multi-select with no options', () => {
			const fields = [
				makeField({ id: 1, field_type: 'multi_select', label: 'Skills', name: 'skills', options: [] })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('No options added yet...')).toBeInTheDocument();
		});
	});

	describe('Select Field', () => {
		it('should render select with placeholder', () => {
			const fields = [
				makeField({
					id: 1,
					field_type: 'select',
					label: 'Country',
					name: 'country',
					placeholder: 'Pick a country',
					options: [
						{ id: 1, label: 'India', value: 'in' },
						{ id: 2, label: 'USA', value: 'us' }
					]
				})
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Country')).toBeInTheDocument();
			expect(screen.getByText('Pick a country')).toBeInTheDocument();
		});

		it('should use default select placeholder when none provided', () => {
			const fields = [
				makeField({
					id: 1,
					field_type: 'select',
					label: 'City',
					name: 'city',
					options: [{ id: 1, label: 'Mumbai', value: 'mumbai' }]
				})
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Select city...')).toBeInTheDocument();
		});
	});

	describe('Location Fields', () => {
		it('should render StateSelection for STATE field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'state', label: 'State', name: 'state' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('State')).toBeInTheDocument();
			expect(mockStateSelection).toHaveBeenCalled();
		});

		it('should render DistrictSelection for DISTRICT field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'district', label: 'District', name: 'district' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('District')).toBeInTheDocument();
			expect(mockDistrictSelection).toHaveBeenCalled();
		});

		it('should render BlockSelection for BLOCK field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'block', label: 'Block', name: 'block' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Block')).toBeInTheDocument();
			expect(mockBlockSelection).toHaveBeenCalled();
		});

		it('should not render location components for non-location fields', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Name', name: 'name' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(mockStateSelection).not.toHaveBeenCalled();
			expect(mockDistrictSelection).not.toHaveBeenCalled();
			expect(mockBlockSelection).not.toHaveBeenCalled();
		});
	});

	describe('Entity Field', () => {
		it('should render EntitySelection for ENTITY field type', () => {
			const fields = [
				makeField({ id: 1, field_type: 'entity', label: 'School', name: 'school', entity_type_id: 3 })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('School')).toBeInTheDocument();
			expect(mockEntitySelection).toHaveBeenCalled();
		});

		it('should not render EntitySelection for non-entity fields', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Name', name: 'name' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(mockEntitySelection).not.toHaveBeenCalled();
		});
	});

	describe('Multiple Fields', () => {
		it('should render all fields in order', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'First Name', name: 'first_name' }),
				makeField({ id: 2, field_type: 'email', label: 'Email Address', name: 'email' }),
				makeField({ id: 3, field_type: 'phone', label: 'Phone Number', name: 'phone' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('First Name')).toBeInTheDocument();
			expect(screen.getByText('Email Address')).toBeInTheDocument();
			expect(screen.getByText('Phone Number')).toBeInTheDocument();
		});

		it('should render mixed field types together', () => {
			const fields = [
				makeField({ id: 1, field_type: 'text', label: 'Name', name: 'name' }),
				makeField({
					id: 2,
					field_type: 'radio',
					label: 'Gender',
					name: 'gender',
					options: [
						{ id: 1, label: 'Male', value: 'male' },
						{ id: 2, label: 'Female', value: 'female' }
					]
				}),
				makeField({ id: 3, field_type: 'date', label: 'DOB', name: 'dob' }),
				makeField({ id: 4, field_type: 'number', label: 'Age', name: 'age' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('Name')).toBeInTheDocument();
			expect(screen.getByText('Gender')).toBeInTheDocument();
			expect(screen.getByText('Male')).toBeInTheDocument();
			expect(screen.getByText('Female')).toBeInTheDocument();
			expect(screen.getByText('DOB')).toBeInTheDocument();
			expect(screen.getByText('Age')).toBeInTheDocument();
		});
	});

	describe('View Mode Toggle', () => {
		it('should show mobile and desktop toggle buttons', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Test Form',
					fields: []
				}
			});

			expect(screen.getByText('Mobile')).toBeInTheDocument();
			expect(screen.getByText('Desktop')).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle field with null options gracefully', () => {
			const fields = [
				makeField({ id: 1, field_type: 'radio', label: 'Choice', name: 'choice', options: null })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByText('No options added yet...')).toBeInTheDocument();
		});

		it('should handle field with custom placeholder for number', () => {
			const fields = [
				makeField({ id: 1, field_type: 'number', label: 'Quantity', name: 'qty', placeholder: '10' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('10')).toBeInTheDocument();
		});

		it('should handle field with custom placeholder for email', () => {
			const fields = [
				makeField({ id: 1, field_type: 'email', label: 'Work Email', name: 'work_email', placeholder: 'you@company.com' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
		});

		it('should handle field with custom placeholder for phone', () => {
			const fields = [
				makeField({ id: 1, field_type: 'phone', label: 'Mobile', name: 'mobile', placeholder: '+91 XXXXX XXXXX' })
			];

			render(FormPreviewDialog, {
				props: { open: true, formName: 'Form', fields }
			});

			expect(screen.getByPlaceholderText('+91 XXXXX XXXXX')).toBeInTheDocument();
		});

		it('should handle special characters in form name', () => {
			render(FormPreviewDialog, {
				props: {
					open: true,
					formName: 'Employee\'s "Registration" Form',
					fields: []
				}
			});

			expect(screen.getByText('Employee\'s "Registration" Form')).toBeInTheDocument();
		});
	});
});
