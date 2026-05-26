import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import QuestionPreviewCell from './QuestionPreviewCell.svelte';
import type { TMedia } from '$lib/types/media';

function makeImageMedia(url = 'https://example.com/img.png'): TMedia {
	return {
		image: {
			gcs_path: 'bucket/img.png',
			url,
			alt_text: 'test image',
			content_type: 'image/png',
			size_bytes: 1024,
			uploaded_at: '2024-01-01T00:00:00Z'
		}
	};
}

function makeExternalMedia(url = 'https://example.com/resource'): TMedia {
	return {
		external_media: {
			type: 'link',
			provider: 'generic',
			url,
			embed_url: null
		}
	};
}

function makeQuestion(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		question_text: 'What is 2 + 2?',
		question_type: 'single-choice',
		options: [
			{ id: 10, key: 'A', value: 'Four', correct_answer: true, media: null },
			{ id: 11, key: 'B', value: 'Five', correct_answer: false, media: null }
		],
		instructions: null,
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
		is_mandatory: false,
		media: null,
		...overrides
	};
}

async function openPreview() {
	await fireEvent.click(screen.getByTitle('Preview question'));
}

describe('QuestionPreviewCell', () => {
	it('renders the eye icon button', () => {
		render(QuestionPreviewCell, { props: { question: makeQuestion() } });
		expect(screen.getByTitle('Preview question')).toBeInTheDocument();
	});

	it('opens the preview dialog when eye is clicked', async () => {
		render(QuestionPreviewCell, { props: { question: makeQuestion() } });
		await openPreview();
		expect(screen.getByRole('heading', { name: 'Question Preview' })).toBeInTheDocument();
	});

	it('shows image media attached to a single-choice option in the dialog', async () => {
		const question = makeQuestion({
			options: [
				{ id: 10, key: 'A', value: 'Four', correct_answer: true, media: makeImageMedia() },
				{ id: 11, key: 'B', value: 'Five', correct_answer: false, media: null }
			]
		});
		render(QuestionPreviewCell, { props: { question } });
		await openPreview();
		const img = screen.getByRole('img', { name: /test image/i });
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', 'https://example.com/img.png');
	});

	it('shows image media attached to a multi-choice option in the dialog', async () => {
		const question = makeQuestion({
			question_type: 'multi-choice',
			options: [
				{ id: 10, key: 'A', value: 'Four', correct_answer: true, media: makeImageMedia() },
				{ id: 11, key: 'B', value: 'Five', correct_answer: true, media: null }
			]
		});
		render(QuestionPreviewCell, { props: { question } });
		await openPreview();
		const img = screen.getByRole('img', { name: /test image/i });
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', 'https://example.com/img.png');
	});

	it('shows external media link for an option with external_media in the dialog', async () => {
		const question = makeQuestion({
			options: [
				{
					id: 10,
					key: 'A',
					value: 'Four',
					correct_answer: true,
					media: makeExternalMedia('https://example.com/resource')
				},
				{ id: 11, key: 'B', value: 'Five', correct_answer: false, media: null }
			]
		});
		render(QuestionPreviewCell, { props: { question } });
		await openPreview();
		const link = screen.getByRole('link', { name: /external media/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', 'https://example.com/resource');
	});

	it('shows question-level image media in the dialog', async () => {
		const question = makeQuestion({ media: makeImageMedia('https://example.com/q.png') });
		render(QuestionPreviewCell, { props: { question } });
		await openPreview();
		const img = screen.getByRole('img', { name: /test image/i });
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', 'https://example.com/q.png');
	});

	it('shows image media on matrix row items in the dialog', async () => {
		const question = makeQuestion({
			question_type: 'matrix-match',
			options: {
				rows: {
					label: 'Column 1',
					items: [{ id: 20, key: 'A', value: 'Row A', media: makeImageMedia() }]
				},
				columns: {
					label: 'Column 2',
					items: [{ id: 21, key: 'P', value: 'Col P', media: null }]
				}
			}
		});
		render(QuestionPreviewCell, { props: { question } });
		await openPreview();
		expect(screen.getByRole('img', { name: /test image/i })).toBeInTheDocument();
	});

	it('does not show media elements when no media is attached', async () => {
		render(QuestionPreviewCell, { props: { question: makeQuestion() } });
		await openPreview();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});
});
