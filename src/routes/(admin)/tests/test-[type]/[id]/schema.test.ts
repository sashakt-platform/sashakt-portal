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
