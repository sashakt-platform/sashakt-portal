import { describe, test, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
	test('cn should merge CSS classes correctly', () => {
		// Test basic class merging
		expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');

		// Test with conditional classes
		expect(cn('btn', true && 'btn-primary', false && 'btn-secondary')).toBe('btn btn-primary');

		// Test with tailwind class conflicts (twMerge should handle)
		expect(cn('p-4', 'p-2')).toBe('p-2'); // p-2 should override p-4

		// Test with empty/undefined classes
		expect(cn('btn', undefined, null, '')).toBe('btn');

		// Test complex scenario
		expect(
			cn(
				'base-class',
				'text-red-500',
				'text-blue-500', // should override text-red-500
				'hover:text-green-500'
			)
		).toBe('base-class text-blue-500 hover:text-green-500');
	});

	test('cn should handle arrays and objects', () => {
		// Test with array input
		expect(cn(['btn', 'btn-primary'])).toBe('btn btn-primary');

		// Test with object input
		expect(
			cn({
				btn: true,
				'btn-primary': true,
				'btn-disabled': false
			})
		).toBe('btn btn-primary');

		// Test mixed inputs
		expect(cn('base', ['array-class'], { 'object-class': true, 'hidden-class': false })).toBe(
			'base array-class object-class'
		);
	});
});
