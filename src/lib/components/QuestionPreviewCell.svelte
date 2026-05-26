<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import QuestionPreviewDialog from '$lib/components/QuestionPreviewDialog.svelte';
	import type { QuestionPreviewData } from '$lib/components/QuestionPreviewDialog.svelte';

	import type { TMedia } from '$lib/types/media';

	const { question }: { question: any } = $props();

	let open = $state(false);

	const isMatrixOptions = (
		options: unknown
	): options is {
		rows: { label: string; items: { id: number; key: string; value: string }[] };
		columns: {
			label: string;
			items: { id: number; key: string; value: string }[];
			input_type?: 'number' | 'text';
		};
	} => {
		if (options === null || typeof options !== 'object' || Array.isArray(options)) return false;
		const o = options as Record<string, unknown>;
		return (
			typeof o.rows === 'object' &&
			o.rows !== null &&
			Array.isArray((o.rows as Record<string, unknown>).items) &&
			typeof o.columns === 'object' &&
			o.columns !== null &&
			Array.isArray((o.columns as Record<string, unknown>).items)
		);
	};

	const opts = $derived(question.options);
	const optionMediaMap = $derived.by(() => {
		const map: Record<number, TMedia | null> = {};
		if (Array.isArray(opts)) {
			for (const opt of opts) {
				if (opt.media) map[opt.id] = opt.media;
			}
		} else if (isMatrixOptions(opts)) {
			for (const item of opts.rows.items as Array<{
				id: number;
				key: string;
				value: string;
				media?: TMedia | null;
			}>) {
				if (item.media) map[item.id] = item.media;
			}
			for (const item of opts.columns.items as Array<{
				id: number;
				key: string;
				value: string;
				media?: TMedia | null;
			}>) {
				if (item.media) map[item.id] = item.media;
			}
		}
		return map;
	});

	const previewData: QuestionPreviewData = $derived({
		questionText: question.question_text || '',
		questionType: question.question_type || '',
		options: Array.isArray(opts) ? opts : [],
		instructions: question.instructions || '',
		markingScheme: question.marking_scheme,
		isMandatory: question.is_mandatory || false,
		media: question.media || null,
		optionMediaMap,
		matrix: isMatrixOptions(opts)
			? {
					rows: opts.rows.items,
					columns: opts.columns.items,
					rowLabel: opts.rows.label,
					colLabel: opts.columns.label,
					inputType: opts.columns.input_type
				}
			: null
	});
</script>

<button
	type="button"
	class="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
	onclick={() => (open = true)}
	title="Preview question"
>
	<Eye class="h-4 w-4" />
</button>

<QuestionPreviewDialog bind:open data={previewData} previewId="listing-{question.id}" />
