import { describe, it, expect } from 'vitest';
import { testSchema } from './schema';

const minimalValid = {
	name: 'Test',
	description: '',
	marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
	certificate_id: null
};

describe('testSchema — shuffle and show_marks defaults', () => {
	it('defaults shuffle to true when omitted', () => {
		const result = testSchema.safeParse(minimalValid);
		expect(result.success).toBe(true);
		expect(result.data?.shuffle).toBe(true);
	});

	it('defaults show_marks to false when omitted', () => {
		const result = testSchema.safeParse(minimalValid);
		expect(result.success).toBe(true);
		expect(result.data?.show_marks).toBe(false);
	});
});

describe('testSchema — form_id', () => {
	it('coerces empty string to null (No Form selected)', () => {
		const result = testSchema.safeParse({ ...minimalValid, form_id: '' });
		expect(result.success).toBe(true);
		expect(result.data?.form_id).toBeNull();
	});

	it('coerces numeric string to number when a form is selected', () => {
		const result = testSchema.safeParse({ ...minimalValid, form_id: '42' });
		expect(result.success).toBe(true);
		expect(result.data?.form_id).toBe(42);
	});

	it('accepts null when no form is set', () => {
		const result = testSchema.safeParse({ ...minimalValid, form_id: null });
		expect(result.success).toBe(true);
		expect(result.data?.form_id).toBeNull();
	});
});

describe('testSchema — certificate_id', () => {
	it('coerces empty string to null (No Certificate selected)', () => {
		const result = testSchema.safeParse({ ...minimalValid, certificate_id: '' });
		expect(result.success).toBe(true);
		expect(result.data?.certificate_id).toBeNull();
	});

	it('coerces numeric string to number when a certificate is selected', () => {
		const result = testSchema.safeParse({ ...minimalValid, certificate_id: '7' });
		expect(result.success).toBe(true);
		expect(result.data?.certificate_id).toBe(7);
	});

	it('accepts null when no certificate is set', () => {
		const result = testSchema.safeParse({ ...minimalValid, certificate_id: null });
		expect(result.success).toBe(true);
		expect(result.data?.certificate_id).toBeNull();
	});
});

describe('testSchema — tag_type_ids', () => {
	it('accepts a valid tag_type_ids array', () => {
		const result = testSchema.safeParse({
			...minimalValid,
			tag_type_ids: [{ id: '1', name: 'Subject' }]
		});
		expect(result.success).toBe(true);
		expect(result.data?.tag_type_ids).toEqual([{ id: '1', name: 'Subject' }]);
	});

	it('defaults tag_type_ids to empty array when omitted', () => {
		const result = testSchema.safeParse(minimalValid);
		expect(result.success).toBe(true);
		expect(result.data?.tag_type_ids).toEqual([]);
	});

	it('includes tag_type_ids in parsed output so server-side delete is the only stripping mechanism', () => {
		const result = testSchema.safeParse({
			...minimalValid,
			tag_type_ids: [{ id: '5', name: 'Topic' }]
		});
		expect(result.success).toBe(true);
		expect(result.data).toHaveProperty('tag_type_ids');
	});
});
