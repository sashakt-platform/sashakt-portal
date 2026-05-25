import type { QAItem } from '$lib/types/tooltip';

interface TooltipConfig {
	label: string;
	items: QAItem[];
}

export const TOOLTIPS = {
	dashboard: {
		label: 'Help: Dashboard',
		items: [
			{
				question: 'What is Dashboard',
				text: "Dashboard provides a quick overview of your organization's activity. Shows how many candidates have successfully submitted their tests, and from the non-submitted group, how many are still active versus inactive."
			}
		]
	},
	users: {
		label: 'Help: User management',
		items: [
			{
				question: 'What is User management',
				text: 'This panel displays all users in the system. You can edit or delete a user by clicking the three dots next to their entry.'
			}
		]
	},
	'question-bank': {
		label: 'Help: Question Bank',
		items: [
			{
				question: 'What is Question Bank',
				text: 'The Question Bank is your central repository for creating, organising, and managing all test questions. Use tags, filters, and categories to build a reusable library across tests.'
			}
		]
	},
	forms: {
		label: 'Help: Forms',
		items: [
			{
				question: 'What is Forms',
				text: 'This panel displays all forms in the system. Forms are used to collect candidate information before tests. You can create, edit, or delete forms by using the actions.'
			}
		]
	},
	'forms-detail': {
		label: 'Help: Forms',
		items: [
			{
				question: 'What is Forms',
				text: 'Create dynamic forms to collect candidate information before tests. Add various field types like text, select, date, and more.'
			}
		]
	},
	'certificate-management': {
		label: 'Help: Certificate management',
		items: [
			{
				question: 'What is Certificate management',
				text: 'This panel displays all certificates in the system. You can edit or delete a certificate by clicking the three dots next to it.'
			}
		]
	},
	'tag-management': {
		label: 'Help: Tag Management',
		items: [
			{
				question: 'What is Tag Management',
				text: 'Manage all tags and tag types here. You can create, edit, or delete tags and tag types using the available actions.'
			}
		]
	},
	'entity-management': {
		label: 'Help: Entity management',
		items: [
			{
				question: 'What is Entity management',
				text: 'This panel displays all entities in the system. You can view records, edit or delete an entity by clicking the three dots next to their entry.'
			}
		]
	},
	tests: {
		label: 'Help: Test',
		items: [
			{
				question: 'What is Tests',
				text: "This panel lists all your tests. You can create, edit, or delete a test, clone an existing test setup, or download the test's QR code for easy sharing."
			}
		]
	},
	'test-templates': {
		label: 'Help: Test templates',
		items: [
			{
				question: 'What is Test templates',
				text: 'This panel lists all your test templates. You can create, edit, or delete a template using the available actions.'
			}
		]
	},
	'entity-records': {
		label: 'Help: Record management',
		items: [
			{
				question: 'What is Record management',
				text: 'This panel displays all records for this entity type. You can edit or delete an existing record by clicking the three dots next to their entry.'
			}
		]
	},
	organisations: {
		label: 'Help: Organisations',
		items: [
			{
				question: 'What is Organisations',
				text: 'This panel displays all organisations in the system.'
			}
		]
	}
} as const satisfies Record<string, TooltipConfig>;

export type TooltipKey = keyof typeof TOOLTIPS;
