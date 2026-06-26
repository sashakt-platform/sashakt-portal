const DEFAULTS: Record<string, string> = {
	dashboard: 'Dashboard',
	question_bank: 'Question Bank',
	tag_management: 'Tag Management',
	tests: 'Tests',
	test: 'Test',
	tags: 'Tags',
	tag: 'Tag',
	test_templates: 'Test Templates',
	test_template: 'Test Template',
	tag_types: 'Tag Types',
	tag_type: 'Tag Type',
	forms: 'Forms',
	form: 'Form',
	certificates: 'Certificates',
	certificate: 'Certificate',
	entities: 'Entities',
	entity: 'Entity',
	organisations: 'Organisations',
	users: 'Users',
	user: 'User'
};

export const mockTermMap: Record<string, string> = {};

export function createNomenclatureMock() {
	return {
		useTerms: () => (key: string, casing?: string) => {
			const label = mockTermMap[key] ?? DEFAULTS[key] ?? key;
			if (casing === 'lower') return label.toLowerCase();
			if (casing === 'upper') return label.toUpperCase();
			return label;
		}
	};
}

export function setCustomNomenclature(overrides: Record<string, string>) {
	Object.keys(mockTermMap).forEach((k) => delete mockTermMap[k]);
	Object.assign(mockTermMap, overrides);
}

export function resetNomenclature() {
	Object.keys(mockTermMap).forEach((k) => delete mockTermMap[k]);
}
