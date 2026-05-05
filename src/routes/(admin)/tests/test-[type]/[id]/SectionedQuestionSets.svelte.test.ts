import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import SectionedQuestionSets from './SectionedQuestionSets.svelte';

describe('SectionedQuestionSets', () => {
	it('renders the read-only message and section metadata', () => {
		render(SectionedQuestionSets, {
			questionSets: [
				{
					id: 10,
					title: 'Physics',
					description: 'Mechanics section',
					display_order: 1,
					max_questions_allowed_to_attempt: 2,
					marking_scheme: { correct: 4, wrong: -1, skipped: 0 },
					question_revision_ids: [101, 102],
					question_revisions: [
						{ id: 101, question_text: 'What is velocity?', tags: [{ name: 'Motion' }] },
						{ id: 102, question_text: 'What is force?', tags: [] }
					]
				}
			]
		});

		expect(
			screen.getByText("Section membership can't be edited in portal yet.")
		).toBeInTheDocument();
		expect(screen.getByText('Physics')).toBeInTheDocument();
		expect(screen.getByText('Mechanics section')).toBeInTheDocument();
		expect(screen.getByText('Attempt limit: 2')).toBeInTheDocument();
		expect(screen.getByText(/What is velocity\?/)).toBeInTheDocument();
		expect(screen.getByText('Tags: Motion')).toBeInTheDocument();
	});

	it('warns when mandatory questions exceed the attempt limit', () => {
		render(SectionedQuestionSets, {
			questionSets: [
				{
					id: 10,
					title: 'Physics',
					description: 'Mechanics section',
					display_order: 1,
					max_questions_allowed_to_attempt: 1,
					marking_scheme: { correct: 4, wrong: -1, skipped: 0 },
					question_revision_ids: [101, 102],
					question_revisions: [
						{
							id: 101,
							question_text: 'What is velocity?',
							is_mandatory: true,
							tags: []
						},
						{
							id: 102,
							question_text: 'What is force?',
							is_mandatory: true,
							tags: []
						}
					]
				}
			]
		});

		expect(
			screen.getByText('2 mandatory question(s) exceed this attempt limit.')
		).toBeInTheDocument();
	});
});
