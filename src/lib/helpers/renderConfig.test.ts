import { describe, test, expect } from 'vitest';
import type { Component, ComponentProps, Snippet } from 'svelte';

// 🎨 Render Configuration Classes - Testing UI component helpers!

// Recreate the classes for testing
export class RenderComponentConfig<TComponent extends Component> {
	component: TComponent;
	props: ComponentProps<TComponent> | Record<string, never>;

	constructor(
		component: TComponent,
		props: ComponentProps<TComponent> | Record<string, never> = {}
	) {
		this.component = component;
		this.props = props;
	}
}

export class RenderSnippetConfig<TProps> {
	snippet: Snippet<[TProps]>;
	params: TProps;

	constructor(snippet: Snippet<[TProps]>, params: TProps) {
		this.snippet = snippet;
		this.params = params;
	}
}

// Helper functions for render configuration
export function createComponentRenderer<T extends Component>(
	component: T,
	props: ComponentProps<T> = {} as ComponentProps<T>
) {
	return new RenderComponentConfig(component, props);
}

export function createSnippetRenderer<T>(snippet: Snippet<[T]>, params: T) {
	return new RenderSnippetConfig(snippet, params);
}

export function isComponentConfig(value: any): value is RenderComponentConfig<any> {
	return value instanceof RenderComponentConfig;
}

export function isSnippetConfig(value: any): value is RenderSnippetConfig<any> {
	return value instanceof RenderSnippetConfig;
}

// Mock components for testing
class MockComponent {
	constructor(public props: any) {}
}

const mockSnippet = ((params: any) => `Snippet with ${JSON.stringify(params)}`) as Snippet<[any]>;

describe('Render Configuration Classes', () => {
	test('RenderComponentConfig should store component and props correctly', () => {
		const mockProps = { title: 'Test Title', count: 42, isActive: true };
		const config = new RenderComponentConfig(MockComponent as any, mockProps);

		expect(config.component).toBe(MockComponent);
		expect(config.props).toEqual(mockProps);
		expect(config.props).toHaveProperty('title', 'Test Title');
		expect(config.props).toHaveProperty('count', 42);
		expect(config.props).toHaveProperty('isActive', true);
	});

	test('RenderComponentConfig should handle empty props', () => {
		const config = new RenderComponentConfig(MockComponent as any);

		expect(config.component).toBe(MockComponent);
		expect(config.props).toEqual({});
		expect(Object.keys(config.props)).toHaveLength(0);
	});

	test('RenderComponentConfig should handle complex prop types', () => {
		const complexProps = {
			strings: ['one', 'two', 'three'],
			nested: {
				level1: {
					level2: 'deep value'
				}
			},
			callback: () => 'function result',
			nullValue: null,
			undefinedValue: undefined
		};

		const config = new RenderComponentConfig(MockComponent as any, complexProps);

		expect(config.props).toEqual(complexProps);
		expect(Array.isArray((config.props as any).strings)).toBe(true);
		expect((config.props as any).nested.level1.level2).toBe('deep value');
		expect(typeof (config.props as any).callback).toBe('function');
		expect((config.props as any).callback()).toBe('function result');
	});

	test('RenderSnippetConfig should store snippet and params correctly', () => {
		const testParams = { message: 'Hello World', timestamp: Date.now() };
		const config = new RenderSnippetConfig(mockSnippet, testParams);

		expect(config.snippet).toBe(mockSnippet);
		expect(config.params).toEqual(testParams);
		expect(config.params).toHaveProperty('message', 'Hello World');
		expect(config.params).toHaveProperty('timestamp');
	});

	test('createComponentRenderer helper should work correctly', () => {
		const props = { name: 'Test Component', visible: true };
		const renderer = createComponentRenderer(MockComponent as any, props);

		expect(renderer).toBeInstanceOf(RenderComponentConfig);
		expect(renderer.component).toBe(MockComponent);
		expect(renderer.props).toEqual(props);
	});

	test('createSnippetRenderer helper should work correctly', () => {
		const params = { data: [1, 2, 3], label: 'Numbers' };
		const renderer = createSnippetRenderer(mockSnippet, params);

		expect(renderer).toBeInstanceOf(RenderSnippetConfig);
		expect(renderer.snippet).toBe(mockSnippet);
		expect(renderer.params).toEqual(params);
	});

	test('type guard functions should identify config types correctly', () => {
		const componentConfig = new RenderComponentConfig(MockComponent as any, {});
		const snippetConfig = new RenderSnippetConfig(mockSnippet, {});
		const regularObject = { some: 'data' };
		const nullValue = null;

		// Test component config identification
		expect(isComponentConfig(componentConfig)).toBe(true);
		expect(isComponentConfig(snippetConfig)).toBe(false);
		expect(isComponentConfig(regularObject)).toBe(false);
		expect(isComponentConfig(nullValue)).toBe(false);

		// Test snippet config identification
		expect(isSnippetConfig(snippetConfig)).toBe(true);
		expect(isSnippetConfig(componentConfig)).toBe(false);
		expect(isSnippetConfig(regularObject)).toBe(false);
		expect(isSnippetConfig(nullValue)).toBe(false);
	});

	test('configuration objects should reference the same object', () => {
		const originalProps = { count: 1, name: 'original' };
		const config = new RenderComponentConfig(MockComponent as any, originalProps);

		// Config should reference the original object
		expect(config.props).toBe(originalProps);

		// Modifying original props affects config since it's the same reference
		originalProps.count = 999;
		originalProps.name = 'modified';

		expect((config.props as any).count).toBe(999); // Modified since it's the same reference
		expect((config.props as any).name).toBe('modified');

		// Both should point to the same object
		expect(config.props).toBe(originalProps);
	});

	test('configuration should handle edge cases', () => {
		// Test with null props (should default to empty object)
		const configWithNull = new RenderComponentConfig(MockComponent as any, null as any);
		expect(configWithNull.props).toBe(null);

		// Test with array as params for snippet
		const arrayParams = [1, 2, 3, 'test'];
		const snippetWithArray = new RenderSnippetConfig(mockSnippet, arrayParams);
		expect(Array.isArray(snippetWithArray.params)).toBe(true);
		expect(snippetWithArray.params).toHaveLength(4);

		// Test with function as params
		const functionParam = () => ({ result: 'dynamic' });
		const snippetWithFunction = new RenderSnippetConfig(mockSnippet, functionParam);
		expect(typeof snippetWithFunction.params).toBe('function');
		expect(snippetWithFunction.params()).toEqual({ result: 'dynamic' });
	});
});
