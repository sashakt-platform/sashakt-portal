import { describe, it, expect } from 'vitest';
import { createEntitySchema, editEntitySchema, entitySchema } from './schema';

const validData = {
	name: 'CLF',
	description: 'Community Level Federation'
};

describe('Entity Type Schema Validation', () => {
	describe('Valid Data', () => {
		it('should validate correct entity type data', () => {
			const result = entitySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should parse name and description correctly', () => {
			const result = entitySchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('CLF');
				expect(result.data.description).toBe('Community Level Federation');
			}
		});
	});

	describe('Required Fields', () => {
		it('should fail when name is empty', () => {
			const result = entitySchema.safeParse({ ...validData, name: '' });
			expect(result.success).toBe(false);
		});

		it('should fail when name is missing', () => {
			const { name, ...dataWithoutName } = validData;
			const result = entitySchema.safeParse(dataWithoutName);
			expect(result.success).toBe(false);
		});
	});

	describe('Optional Fields', () => {
		it('should allow missing description', () => {
			const result = entitySchema.safeParse({ name: 'CLF' });
			expect(result.success).toBe(true);
		});

		it('should allow null description', () => {
			const result = entitySchema.safeParse({ name: 'CLF', description: null });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBeNull();
			}
		});

		it('should allow empty string description', () => {
			const result = entitySchema.safeParse({ name: 'CLF', description: '' });
			expect(result.success).toBe(true);
		});
	});

	describe('Schema Exports', () => {
		it('createEntitySchema should validate the same as entitySchema', () => {
			const result = createEntitySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('editEntitySchema should validate the same as entitySchema', () => {
			const result = editEntitySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('all schemas should reject invalid data equally', () => {
			const invalidData = { name: '', description: 'test' };
			expect(createEntitySchema.safeParse(invalidData).success).toBe(false);
			expect(editEntitySchema.safeParse(invalidData).success).toBe(false);
			expect(entitySchema.safeParse(invalidData).success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should reject non-string name', () => {
			const result = entitySchema.safeParse({ name: 123 });
			expect(result.success).toBe(false);
		});

		it('should accept single character name', () => {
			const result = entitySchema.safeParse({ name: 'A' });
			expect(result.success).toBe(true);
		});

		it('should strip unknown fields', () => {
			const result = entitySchema.safeParse({ ...validData, extraField: 'value' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect((result.data as any).extraField).toBeUndefined();
			}
		});

		it('should reject completely empty object', () => {
			const result = entitySchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});
});
