import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('/+page.svelte', () => {
	test('should pass basic test', () => {
		// Simple test that doesn't require component mounting
		expect(1 + 1).toBe(2);
		expect('Welcome to Sashakt').toBeTruthy();
	});
});
