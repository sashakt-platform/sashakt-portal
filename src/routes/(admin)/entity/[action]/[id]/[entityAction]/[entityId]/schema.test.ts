import { describe, it, expect } from 'vitest';
import { entitySchema } from './schema';

const validData = {
	name: 'My Entity',
	description: 'A test entity',
	active: true,
	entity_type_id: 1,
	state_id: 1,
	district_id: 10,
	block_id: 100
};

describe('Entity Schema Validation', () => {
	describe('Valid Data', () => {
		it('should validate correct entity data with all fields', () => {
			const result = entitySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('should parse all fields correctly', () => {
			const result = entitySchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('My Entity');
				expect(result.data.description).toBe('A test entity');
				expect(result.data.active).toBe(true);
				expect(result.data.entity_type_id).toBe(1);
				expect(result.data.state_id).toBe(1);
				expect(result.data.district_id).toBe(10);
				expect(result.data.block_id).toBe(100);
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

		it('should fail when entity_type_id is missing', () => {
			const { entity_type_id, ...dataWithoutType } = validData;
			const result = entitySchema.safeParse(dataWithoutType);
			expect(result.success).toBe(false);
		});

		it('should fail when entity_type_id is 0', () => {
			const result = entitySchema.safeParse({ ...validData, entity_type_id: 0 });
			expect(result.success).toBe(false);
		});
	});

	describe('Optional Fields', () => {
		it('should allow missing description', () => {
			const { description, ...data } = validData;
			const result = entitySchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('should allow null description', () => {
			const result = entitySchema.safeParse({ ...validData, description: null });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.description).toBeNull();
			}
		});

		it('should default active to true when missing', () => {
			const { active, ...data } = validData;
			const result = entitySchema.safeParse(data);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.active).toBe(true);
			}
		});

		it('should allow null state_id', () => {
			const result = entitySchema.safeParse({ ...validData, state_id: null });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.state_id).toBeNull();
			}
		});

		it('should allow null district_id', () => {
			const result = entitySchema.safeParse({ ...validData, district_id: null });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.district_id).toBeNull();
			}
		});

		it('should allow null block_id', () => {
			const result = entitySchema.safeParse({ ...validData, block_id: null });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.block_id).toBeNull();
			}
		});

		it('should allow missing location IDs entirely', () => {
			const result = entitySchema.safeParse({
				name: 'No Location',
				entity_type_id: 1
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Type Coercion', () => {
		it('should coerce entity_type_id from string to number', () => {
			const result = entitySchema.safeParse({ ...validData, entity_type_id: '5' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.entity_type_id).toBe(5);
				expect(typeof result.data.entity_type_id).toBe('number');
			}
		});

		it('should coerce state_id from string to number', () => {
			const result = entitySchema.safeParse({ ...validData, state_id: '3' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.state_id).toBe(3);
			}
		});

		it('should coerce district_id from string to number', () => {
			const result = entitySchema.safeParse({ ...validData, district_id: '15' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.district_id).toBe(15);
			}
		});

		it('should coerce block_id from string to number', () => {
			const result = entitySchema.safeParse({ ...validData, block_id: '200' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.block_id).toBe(200);
			}
		});
	});

	describe('Edge Cases', () => {
		it('should accept single character name', () => {
			const result = entitySchema.safeParse({ ...validData, name: 'A' });
			expect(result.success).toBe(true);
		});

		it('should reject non-string name', () => {
			const result = entitySchema.safeParse({ ...validData, name: 123 });
			expect(result.success).toBe(false);
		});

		it('should reject completely empty object', () => {
			const result = entitySchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('should strip unknown fields', () => {
			const result = entitySchema.safeParse({ ...validData, unknownField: 'value' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect((result.data as any).unknownField).toBeUndefined();
			}
		});

		it('should accept active as false', () => {
			const result = entitySchema.safeParse({ ...validData, active: false });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.active).toBe(false);
			}
		});

		it('should validate with all location IDs null', () => {
			const result = entitySchema.safeParse({
				...validData,
				state_id: null,
				district_id: null,
				block_id: null
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.state_id).toBeNull();
				expect(result.data.district_id).toBeNull();
				expect(result.data.block_id).toBeNull();
			}
		});

		it('should reject negative entity_type_id', () => {
			const result = entitySchema.safeParse({ ...validData, entity_type_id: -1 });
			expect(result.success).toBe(false);
		});
	});
});
