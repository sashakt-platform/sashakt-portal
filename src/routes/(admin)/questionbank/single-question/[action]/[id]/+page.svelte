<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import AlignJustify from '@lucide/svelte/icons/align-justify';
	import Hash from '@lucide/svelte/icons/hash';
	import Equal from '@lucide/svelte/icons/equal';
	import Route from '@lucide/svelte/icons/route';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Film from '@lucide/svelte/icons/film';
	import Music from '@lucide/svelte/icons/music';
	import X from '@lucide/svelte/icons/x';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { questionSchema, matrixInputOptionsSchema, type FormSchema } from './schema';
	import { QuestionTypeEnum, QUESTION_TYPE_LABELS } from '$lib/types/question';
	import ChooseQuestionType from './ChooseQuestionType.svelte';
	import AttachmentInput from './AttachmentInput.svelte';
	import UnsavedChangesDialog from '$lib/components/UnsavedChangesDialog.svelte';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import QuestionRevision from './QuestionRevision.svelte';
	import QuestionPreview from './QuestionPreview.svelte';
	import { isStateAdmin, getUserState, type User } from '$lib/utils/permissions.js';
	import { dragHandleZone, dragHandle } from 'svelte-dnd-action';
	import { resolve } from '$app/paths';
	import PartialMarkingSection from '$lib/components/PartialMarkingSection.svelte';
	import type { TMedia } from '$lib/types/media';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			tagTypes: [];
			user: User;
			questionData?: any;
		};
	} = $props();

	const questionData: any = data?.questionData || null;

	const QUESTION_TYPE_ICONS: Record<string, typeof ListChecks> = {
		[QuestionTypeEnum.SingleChoice]: ListChecks,
		[QuestionTypeEnum.Subjective]: AlignJustify,
		[QuestionTypeEnum.NumericalInteger]: Hash,
		[QuestionTypeEnum.MatrixString]: Equal,
		[QuestionTypeEnum.MatrixNumber]: Equal,
		[QuestionTypeEnum.MatrixMatch]: Route,
		[QuestionTypeEnum.MatrixRating]: CircleDot
	};

	const {
		form: formData,
		enhance,
		submit
	} = superForm(questionData || data.form, {
		applyAction: 'never',
		validators: zod4Client(questionSchema),
		dataType: 'json',
		onResult: async ({ result }) => {
			const hasStaged =
				stagedImageFile ||
				stagedExternalUrl.trim() ||
				Object.values(stagedOptionFiles).some((f) => f) ||
				Object.values(stagedOptionUrls).some((u) => u?.trim());

			if (result.type === 'success' && result.data?.newQuestionId) {
				const newId = result.data.newQuestionId;
				let uploadOk = true;
				if (hasStaged) {
					isSaving = true;
					try {
						uploadOk = await uploadStagedMedia(newId, result.data.newQuestionData);
					} finally {
						isSaving = false;
					}
				}
				if (uploadOk) {
					toast.success('Question saved successfully');
					await goto('/questionbank');
				} else {
					// Question was created but media failed — redirect to edit page so user can retry
					toast.error('Question saved but some media failed to upload. Redirecting to edit page.');
					await goto(`/questionbank/single-question/edit/${newId}`);
				}
			} else if (result.type === 'redirect' && questionId) {
				let uploadOk = true;
				if (hasStaged) {
					isSaving = true;
					try {
						uploadOk = await uploadStagedMedia(questionId);
					} finally {
						isSaving = false;
					}
				}
				if (uploadOk) {
					await goto(result.location);
				} else {
					// Question was saved but media failed — stay on page so user can retry
					toast.error('Question saved but some media failed to upload.');
				}
			} else if (result.type === 'failure') {
				const msg =
					(result.data as any)?.errorMessage || 'Question not saved. Please check all the details.';
				toast.error(msg);
			}
		},
		onSubmit: () => {
			if ($formData.question_type === QuestionTypeEnum.Subjective) {
				$formData.options = [];
				$formData.correct_answer = [];
			} else if (
				$formData.question_type === QuestionTypeEnum.SingleChoice ||
				$formData.question_type === QuestionTypeEnum.MultiChoice
			) {
				// Only include options that have content (text, existing media, or staged media)
				const optionsWithContent = totalOptions.filter((option) =>
					hasContent(option.value, option.id, optionMediaMap, stagedOptionFiles, stagedOptionUrls)
				);
				$formData.options = optionsWithContent.map((option) => {
					const media = stripMediaUrl(optionMediaMap[option.id]);
					return {
						id: option.id,
						key: option.key,
						value: optionValue(
							option.value,
							option.id,
							optionMediaMap,
							stagedOptionFiles,
							stagedOptionUrls
						),
						...(media ? { media } : {})
					};
				});
				$formData.correct_answer = optionsWithContent
					.filter((option) => option.correct_answer)
					.map((option) => option.id);

				$formData.question_type =
					$formData.correct_answer.length > 1
						? QuestionTypeEnum.MultiChoice
						: QuestionTypeEnum.SingleChoice;
			} else if (
				$formData.question_type === QuestionTypeEnum.NumericalDecimal ||
				$formData.question_type === QuestionTypeEnum.NumericalInteger
			) {
				$formData.options = [];
			} else if ($formData.question_type === QuestionTypeEnum.MatrixMatch) {
				// Only include items that have content (text, existing media, or staged media)
				const rowsWithContent = matrixLeftItems.filter((item) =>
					hasContent(item.value, item.id, optionMediaMap, stagedOptionFiles, stagedOptionUrls)
				);
				const colsWithContent = matrixRightItems.filter((item) =>
					hasContent(item.value, item.id, optionMediaMap, stagedOptionFiles, stagedOptionUrls)
				);
				$formData.options = {
					rows: {
						label: matrixRowLabel,
						items: rowsWithContent.map(({ id, key, value }) => {
							const media = stripMediaUrl(optionMediaMap[id]);
							return {
								id,
								key,
								value: optionValue(value, id, optionMediaMap, stagedOptionFiles, stagedOptionUrls),
								...(media ? { media } : {})
							};
						})
					},
					columns: {
						label: matrixColLabel,
						items: colsWithContent.map(({ id, key, value }) => {
							const media = stripMediaUrl(optionMediaMap[id]);
							return {
								id,
								key,
								value: optionValue(value, id, optionMediaMap, stagedOptionFiles, stagedOptionUrls),
								...(media ? { media } : {})
							};
						})
					}
				};
				$formData.correct_answer = matrixMatches;
			} else if ($formData.question_type === QuestionTypeEnum.MatrixRating) {
				$formData.options = {
					rows: {
						label: matrixRowLabel,
						items: matrixLeftItems.map(({ id, key, value }) => ({ id, key, value }))
					},
					columns: {
						label: matrixColLabel,
						items: matrixRightItems.map(({ id, key, value }) => ({ id, key, value }))
					}
				};
				$formData.correct_answer = [];
			} else if (
				$formData.question_type === QuestionTypeEnum.MatrixString ||
				$formData.question_type === QuestionTypeEnum.MatrixNumber
			) {
				$formData.options = {
					rows: {
						label: matrixRowLabel,
						items: matrixLeftItems.map(({ id, key, value }) => ({ id, key, value }))
					},
					columns: {
						label: matrixColLabel,
						input_type: matrixInputType!
					}
				};
				$formData.correct_answer = [];
				$formData.question_type = QuestionTypeEnum.MatrixInput;
			}
			$formData.organization_id = data.user.organization_id;
		}
	});
	if (questionData?.locations?.length) {
		$formData.state_ids = questionData.locations.map((location) => ({
			id: String((location as { state_id: string | number }).state_id),
			name: (location as { state_name: string }).state_name
		}));
	}

	if (questionData?.tags?.length) {
		$formData.tag_ids = questionData.tags.map((tag) => {
			const tagName = tag.name;
			const tagTypeName = tag.tag_type?.name;
			return {
				id: String((tag as { id: string | number }).id),
				name: tagTypeName ? `${tagName} (${tagTypeName})` : tagName
			};
		});
	}

	if (questionData && !questionData.marking_scheme) {
		$formData.marking_scheme = {
			correct: 1,
			wrong: 0,
			skipped: 0
		};
	}

	if ($formData.question_type === QuestionTypeEnum.MatrixInput) {
		const parsed = matrixInputOptionsSchema.safeParse($formData.options);
		if (parsed.success) {
			$formData.question_type =
				parsed.data.columns.input_type === 'text'
					? QuestionTypeEnum.MatrixString
					: QuestionTypeEnum.MatrixNumber;
		}
	}

	const matrixInputType = $derived<'text' | 'number' | undefined>(
		$formData.question_type === QuestionTypeEnum.MatrixString
			? 'text'
			: $formData.question_type === QuestionTypeEnum.MatrixNumber
				? 'number'
				: undefined
	);

	const isMatrixOptions = (
		opts: unknown
	): opts is {
		rows: { label: string; items: { id: number; key: string; value: string }[] };
		columns: { label: string; items: { id: number; key: string; value: string }[] };
	} =>
		opts !== null && typeof opts === 'object' && !Array.isArray(opts) && 'rows' in (opts as object);

	let totalOptions = $state<{ id: number; key: string; value: string; correct_answer: boolean }[]>(
		questionData && questionData.options && Array.isArray(questionData.options)
			? (questionData.options as { id: number; key: string; value: string }[]).map((v) => ({
					id: v.id,
					key: v.key,
					value: v.value || '',
					correct_answer: Array.isArray(questionData?.correct_answer)
						? (questionData.correct_answer as number[]).includes(v.id)
						: false
				}))
			: Array.from({ length: 4 }, (_, i) => ({
					id: i + 1,
					key: String.fromCharCode(65 + i),
					value: '',
					correct_answer: false
				}))
	);

	const existingMatrixOptions =
		questionData?.options && isMatrixOptions(questionData.options) ? questionData.options : null;

	let matrixRowLabel = $state(existingMatrixOptions?.rows.label ?? 'Questions');
	let matrixColLabel = $state(existingMatrixOptions?.columns.label ?? 'Answers');
	let matrixLeftItems = $state<{ id: number; key: string; value: string }[]>(
		existingMatrixOptions?.rows.items ??
			Array.from({ length: 4 }, (_, i) => ({
				id: i + 1,
				key: String.fromCharCode(65 + i),
				value: ''
			}))
	);
	let matrixRightItems = $state<{ id: number; key: string; value: string }[]>(
		existingMatrixOptions?.columns.items ??
			Array.from({ length: 4 }, (_, i) => ({ id: 5000 + i + 1, key: String(i + 1), value: '' }))
	);
	let matrixMatches = $state<Record<string, number[]>>(
		questionData?.correct_answer &&
			!Array.isArray(questionData.correct_answer) &&
			typeof questionData.correct_answer === 'object'
			? (questionData.correct_answer as Record<string, number[]>)
			: {}
	);

	let selectedTagTypes = $state<{ id: string; name: string }[]>([]);
	let openQuestionTypeDialog = $state(!questionData);
	let showUnsavedDialog = $state(false);

	// Track form dirty state
	const initialFormJson = JSON.stringify($formData);
	const isFormDirty = $derived(JSON.stringify($formData) !== initialFormJson);

	function handleBack() {
		if (isFormDirty) {
			showUnsavedDialog = true;
		} else {
			goto(resolve('/questionbank'));
		}
	}
	const isMultiChoice = $derived(totalOptions.filter((o) => o.correct_answer).length > 1);

	// Media state
	let questionMedia = $state<TMedia | null>(questionData?.media ?? null);
	let optionMediaMap = $state<Record<number, TMedia | null>>({});

	// Loading state for media operations
	let isSaving = $state(false);

	// Staged media for new questions (uploaded after question creation)
	let stagedImageFile = $state<File | null>(null);
	let stagedExternalUrl = $state('');
	let stagedOptionFiles = $state<Record<number, File | null>>({});
	let stagedOptionUrls = $state<Record<number, string>>({});
	let openAttachmentDropdownId = $state<number | null>(null);
	let optionAttachmentModes = $state<Record<number, 'none' | 'image' | 'video' | 'audio'>>({});

	// Initialize option media from question data
	if (questionData?.options) {
		if (Array.isArray(questionData.options)) {
			for (const opt of questionData.options as any[]) {
				if (opt.media) optionMediaMap[opt.id] = opt.media;
			}
		} else if (
			questionData.options &&
			typeof questionData.options === 'object' &&
			'rows' in (questionData.options as any)
		) {
			const matrixOpts = questionData.options as any;
			for (const item of matrixOpts.rows?.items ?? []) {
				if (item.media) optionMediaMap[item.id] = item.media;
			}
			for (const item of matrixOpts.columns?.items ?? []) {
				if (item.media) optionMediaMap[item.id] = item.media;
			}
		}
	}

	const questionId = $derived(questionData?.id ?? null);

	// Combined media map for preview: merges uploaded media with staged file previews
	// so that image-only staged options appear in the preview dialog
	const previewOptionMediaMap = $derived.by(() => {
		const map: Record<number, TMedia | null> = { ...optionMediaMap };
		for (const [idStr, file] of Object.entries(stagedOptionFiles)) {
			const id = Number(idStr);
			if (file && !map[id]) {
				map[id] = {
					image: {
						gcs_path: '',
						url: URL.createObjectURL(file),
						content_type: file.type,
						size_bytes: file.size,
						uploaded_at: ''
					}
				};
			}
		}
		for (const [idStr, url] of Object.entries(stagedOptionUrls)) {
			const id = Number(idStr);
			if (url?.trim() && !map[id]) {
				map[id] = {
					external_media: {
						type: 'video',
						provider: 'generic',
						url: url.trim()
					}
				};
			}
		}
		return map;
	});

	async function refreshQuestion() {
		if (!questionId) return;
		try {
			const res = await fetch(`/api/questions/${questionId}`);
			if (!res.ok) return;

			const freshData = await res.json();
			questionMedia = freshData.media ?? null;
			optionMediaMap = {};
			const opts = freshData.options;
			if (Array.isArray(opts)) {
				for (const opt of opts) {
					if (opt.media) optionMediaMap[opt.id] = opt.media;
				}
			} else if (opts && typeof opts === 'object' && 'rows' in opts) {
				for (const item of opts.rows?.items ?? []) {
					if (item.media) optionMediaMap[item.id] = item.media;
				}
				for (const item of opts.columns?.items ?? []) {
					if (item.media) optionMediaMap[item.id] = item.media;
				}
			}
		} catch {
			// Silently fail — media will show stale data until page reload
		}
	}

	async function uploadStagedMedia(newQuestionId: number, newQuestionData?: any): Promise<boolean> {
		const basePath = `/api/media/questions/${newQuestionId}`;
		const errors: string[] = [];

		// Upload question-level media
		if (stagedImageFile) {
			try {
				const formData = new FormData();
				formData.append('file', stagedImageFile);
				const res = await fetch(`${basePath}/image`, {
					method: 'POST',
					body: formData
				});
				if (!res.ok) {
					const errData = await res.json();
					errors.push(errData.detail || 'Failed to upload image');
				}
			} catch {
				errors.push('Failed to upload image');
			}
		}

		if (stagedExternalUrl.trim()) {
			try {
				const res = await fetch(
					`${basePath}/external?url=${encodeURIComponent(stagedExternalUrl.trim())}`,
					{ method: 'POST' }
				);
				if (!res.ok) {
					const errData = await res.json();
					errors.push(errData.detail || 'Failed to add external media');
				}
			} catch {
				errors.push('Failed to add external media');
			}
		}

		// Upload option-level media
		const hasOptionMedia =
			Object.values(stagedOptionFiles).some((f) => f) ||
			Object.values(stagedOptionUrls).some((u) => u?.trim());

		if (!hasOptionMedia) {
			for (const err of errors) toast.error(err);
			return errors.length === 0;
		}

		// Resolve client-side option id → backend option id
		// For existing questions, client IDs = backend IDs (loaded from server)
		// For new questions, map by key using the returned question data
		function resolveBackendOptionId(clientId: number): number | undefined {
			if (!newQuestionData) {
				// Existing question — client IDs are already backend IDs
				return clientId;
			}

			const opts = newQuestionData.options;

			// For flat options (single/multi choice)
			if (Array.isArray(opts)) {
				const clientIdToKey: Record<number, string> = {};
				for (const opt of totalOptions) {
					clientIdToKey[opt.id] = opt.key;
				}
				const key = clientIdToKey[clientId];
				if (!key) return undefined;
				return opts.find((o: any) => o.key === key)?.id;
			}

			// For matrix options (matrix match/rating)
			if (opts?.rows && opts?.columns) {
				const clientIdToKey: Record<number, string> = {};
				for (const item of matrixLeftItems) {
					clientIdToKey[item.id] = `row-${item.key}`;
				}
				for (const item of matrixRightItems) {
					clientIdToKey[item.id] = `col-${item.key}`;
				}
				const key = clientIdToKey[clientId];
				if (!key) return undefined;

				const prefix = key.startsWith('row-') ? 'row-' : 'col-';
				const rawKey = key.slice(prefix.length);
				const items = prefix === 'row-' ? opts.rows.items : opts.columns.items;
				return items?.find((i: any) => i.key === rawKey)?.id;
			}

			return undefined;
		}

		for (const [clientIdStr, file] of Object.entries(stagedOptionFiles)) {
			if (!file) continue;
			const backendId = resolveBackendOptionId(Number(clientIdStr));
			if (!backendId) continue;

			try {
				const formData = new FormData();
				formData.append('file', file);
				const res = await fetch(`${basePath}/options/${backendId}/image`, {
					method: 'POST',
					body: formData
				});
				if (!res.ok) {
					errors.push('Failed to upload option image');
				}
			} catch {
				errors.push('Failed to upload option image');
			}
		}

		for (const [clientIdStr, url] of Object.entries(stagedOptionUrls)) {
			if (!url?.trim()) continue;
			const backendId = resolveBackendOptionId(Number(clientIdStr));
			if (!backendId) continue;

			try {
				const res = await fetch(
					`${basePath}/options/${backendId}/external?url=${encodeURIComponent(url.trim())}`,
					{ method: 'POST' }
				);
				if (!res.ok) {
					errors.push('Failed to add option external media');
				}
			} catch {
				errors.push('Failed to add option external media');
			}
		}

		for (const err of errors) toast.error(err);
		return errors.length === 0;
	}

	async function deleteMedia(path: string) {
		const res = await fetch(path, { method: 'DELETE' });
		if (!res.ok) {
			const errData = await res.json().catch(() => ({}));
			toast.error(errData.detail || 'Failed to delete media');
			return;
		}
		await refreshQuestion();
	}
	function nextId(items: { id: number }[]): number {
		return Math.max(0, ...items.map((i) => i.id)) + 1;
	}

	$effect(() => {
		if (
			(!isMultiChoice || $formData.question_type === QuestionTypeEnum.Subjective) &&
			$formData.marking_scheme?.partial
		) {
			$formData.marking_scheme!.partial = undefined;
		}
	});

	// Helper to check if an item has content (text or media)
	function hasContent(
		text: string,
		itemId: number,
		mediaMap: Record<number, TMedia | null>,
		stagedFiles: Record<number, File | null>,
		stagedUrls: Record<number, string>
	): boolean {
		if (text.trim()) return true;
		if (mediaMap[itemId]?.image || mediaMap[itemId]?.external_media) return true;
		if (stagedFiles[itemId]) return true;
		if (stagedUrls[itemId]?.trim()) return true;
		return false;
	}

	// For options with only media (no text), use a placeholder so the backend accepts them.
	// Media is uploaded separately after question creation, so the initial payload can't include it.
	function optionValue(
		text: string,
		itemId: number,
		mediaMap: Record<number, TMedia | null>,
		stagedFiles: Record<number, File | null>,
		stagedUrls: Record<number, string>
	): string {
		if (text.trim()) return text;
		const hasMedia =
			mediaMap[itemId]?.image ||
			mediaMap[itemId]?.external_media ||
			stagedFiles[itemId] ||
			stagedUrls[itemId]?.trim();
		return hasMedia ? '\u200B' : text;
	}

	// Strip url from image media before sending to backend (only gcs_path is needed)
	function stripMediaUrl(media: TMedia | null | undefined): TMedia | undefined {
		if (!media) return undefined;
		const result: TMedia = {};
		if (media.image) {
			const { url, ...imageWithoutUrl } = media.image;
			result.image = imageWithoutUrl;
		}
		if (media.external_media) {
			result.external_media = media.external_media;
		}
		return Object.keys(result).length > 0 ? result : undefined;
	}

	// Question text is required (media is optional supplement)
	const questionHasText = $derived(!!$formData?.question_text?.trim());

	const isDisabled = $derived.by(() => {
		if (!questionHasText) return true;

		const type = $formData.question_type;
		if (type === QuestionTypeEnum.Subjective) {
			return false;
		}

		if (type === QuestionTypeEnum.NumericalInteger || type === QuestionTypeEnum.NumericalDecimal) {
			const answer = $formData.correct_answer;
			return (
				answer == null ||
				(typeof answer === 'number' && isNaN(answer)) ||
				String(answer).trim() === ''
			);
		}

		if (type === QuestionTypeEnum.MatrixMatch) {
			// Filter to items that have content (text or media)
			const leftWithContent = matrixLeftItems.filter((i) =>
				hasContent(i.value, i.id, optionMediaMap, stagedOptionFiles, stagedOptionUrls)
			);
			const rightWithContent = matrixRightItems.filter((i) =>
				hasContent(i.value, i.id, optionMediaMap, stagedOptionFiles, stagedOptionUrls)
			);
			// Need at least 2 items on each side, and all content items must have matches
			const allMatched = leftWithContent.every((i) => matrixMatches[String(i.id)]?.length);
			return leftWithContent.length < 2 || rightWithContent.length < 2 || !allMatched;
		}

		if (type === QuestionTypeEnum.MatrixRating) {
			// Matrix Rating doesn't support media - filter to items with text
			const leftWithText = matrixLeftItems.filter((i) => i.value.trim());
			const rightWithText = matrixRightItems.filter((i) => i.value.trim());
			// Need at least 2 items on each side
			return leftWithText.length < 2 || rightWithText.length < 2;
		}

		if (type === QuestionTypeEnum.MatrixString || type === QuestionTypeEnum.MatrixNumber) {
			return matrixLeftItems.some((i) => !i.value.trim()) || !matrixColLabel.trim();
		}

		// Single/Multi choice: need ≥2 options with content and at least one marked correct
		const optionsWithContent = totalOptions.filter((option) =>
			hasContent(option.value, option.id, optionMediaMap, stagedOptionFiles, stagedOptionUrls)
		);
		return optionsWithContent.length < 2 || !totalOptions.some((option) => option.correct_answer);
	});

	// for State admins, auto-assign their state when creating a new question
	// backend should handle this as well
	$effect(() => {
		if (isStateAdmin(data.user) && (!$formData.state_ids || $formData.state_ids.length === 0)) {
			const userState = getUserState(data.user);
			if (userState) {
				$formData.state_ids = [{ id: String(userState.id), name: userState.name }];
			}
		}
	});
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex flex-col gap-10 py-8">
		{#snippet matrixAddButton(label: string, onclick: () => void)}
			<Button variant="outline" class="text-primary border-primary mt-1 self-start" {onclick}>
				<Plus />{label}
			</Button>
		{/snippet}
		{#snippet matrixTrashButton(canDelete: boolean, onclick: () => void)}
			{#if canDelete}
				<button type="button" {onclick} aria-label="Delete row" class="mt-2.5 shrink-0">
					<Trash_2 size={18} class="text-muted-foreground hover:text-destructive cursor-pointer" />
				</button>
			{/if}
		{/snippet}
		<!-- HEADER -->
		<div class="mx-4 flex items-center justify-between py-4 sm:mx-6 md:mx-10">
			<div class="flex items-center gap-3">
				<button type="button" class="hover:bg-muted rounded-lg border p-2" onclick={handleBack}>
					<ArrowLeft size={20} />
				</button>
				<h2 class="text-2xl font-bold tracking-tight">
					{questionData ? 'Edit Question' : 'Create Question'}
				</h2>
			</div>
			<div class="flex items-center gap-2">
				{#if questionData}
					<QuestionRevision {data} />
					<div class="bg-border mx-1 h-6 w-px"></div>
				{/if}
				<QuestionPreview
					data={{
						question_text: $formData.question_text,
						options: totalOptions,
						instructions: $formData.instructions,
						marking_scheme: $formData.marking_scheme,
						is_mandatory: $formData.is_mandatory,
						question_type: $formData.question_type,
						matrix: {
							rowLabel: matrixRowLabel,
							colLabel: matrixColLabel,
							rows: matrixLeftItems,
							columns: matrixRightItems,
							inputType: matrixInputType
						},
						media: questionMedia,
						optionMediaMap: previewOptionMediaMap
					}}
				/>
				<Button
					class="bg-primary text-sm sm:text-base"
					disabled={isDisabled || isSaving}
					onclick={submit}
				>
					{#if isSaving}
						<Loader2 size={16} class="mr-1 animate-spin" />
						Uploading media...
					{:else}
						Save
					{/if}
				</Button>
			</div>
		</div>
		<!-- MAIN CONTENT: Two columns -->
		<div class="mx-4 flex flex-col gap-6 sm:mx-6 md:mx-10 lg:flex-row">
			<!-- LEFT COLUMN -->
			<div class="flex flex-col gap-6 lg:w-2/3">
				<!-- Card 1: QUESTION TYPE -->
				<div class="rounded-lg border">
					<div class="bg-muted flex w-full items-center justify-between rounded-t-lg px-4 py-3">
						<span class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Question Settings</span
						>
						<button
							type="button"
							class="bg-background hover:bg-accent flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
							onclick={() => (openQuestionTypeDialog = true)}
						>
							{#if QUESTION_TYPE_ICONS[$formData.question_type]}
								{@const TypeIcon = QUESTION_TYPE_ICONS[$formData.question_type]}
								<TypeIcon size={18} class="text-muted-foreground" />
							{/if}
							{QUESTION_TYPE_LABELS[$formData.question_type] ?? $formData.question_type}
							<ChevronDown size={16} class="text-muted-foreground" />
						</button>
					</div>
					<ChooseQuestionType
						bind:open={openQuestionTypeDialog}
						onSelect={(type) => {
							$formData.question_type = type;
							$formData.correct_answer = [];
							totalOptions = Array.from({ length: 4 }, (_, i) => ({
								id: i + 1,
								key: String.fromCharCode(65 + i),
								value: '',
								correct_answer: false
							}));
						}}
					/>
					<div class="flex flex-col gap-6 p-6">
						<!-- Question Text -->
						<div class="flex flex-col gap-2">
							<Label class="font-semibold">Question</Label>
							<Textarea
								name="questionText"
								bind:value={$formData.question_text}
								placeholder="Enter your question here..."
							/>
							<AttachmentInput
								media={questionMedia}
								onStagedFileChange={(f) => (stagedImageFile = f)}
								onStagedUrlChange={(u) => (stagedExternalUrl = u)}
								onDeleteImage={questionId
									? () => deleteMedia(`/api/media/questions/${questionId}/image`)
									: undefined}
								onDeleteExternal={questionId
									? () => deleteMedia(`/api/media/questions/${questionId}/external`)
									: undefined}
							/>
						</div>

						<!-- Additional Instructions -->
						<div class="flex flex-col gap-2">
							<Label class="font-semibold">Additional Instructions</Label>
							<Textarea
								name="instructions"
								bind:value={$formData.instructions}
								placeholder="E.g., time limit, reference material..."
							/>
						</div>
					</div>
				</div>

				<!-- Card 2: ANSWER SETTINGS -->
				<div class="rounded-lg border">
					<div class="bg-muted rounded-t-lg px-4 py-3">
						<span class="text-muted-foreground text-xs font-bold tracking-wider uppercase"
							>Answer Settings</span
						>
					</div>
					<div class="p-6">
						{#if $formData.question_type === QuestionTypeEnum.Subjective}
							<div class="flex flex-col gap-2">
								<div class="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
										<Label for="subjective-limit" class="text-sm font-medium sm:w-48">
											Maximum character limit
										</Label>
										<div class="flex items-center gap-2">
											<Input
												id="subjective-limit"
												type="number"
												min="1"
												max="10000"
												placeholder="e.g., 500"
												class="w-32"
												bind:value={$formData.subjective_answer_limit}
											/>
											<span class="text-sm text-gray-500">characters</span>
										</div>
									</div>
									<p class="text-xs text-gray-500">
										Leave empty for unlimited. Recommended: 200-1000 characters for short answers,
										1000-5000 for essays.
									</p>
								</div>
							</div>
						{:else if $formData.question_type === QuestionTypeEnum.SingleChoice || $formData.question_type === QuestionTypeEnum.MultiChoice}
							<div class="flex flex-col gap-6 overflow-y-scroll scroll-auto">
								<div
									use:dragHandleZone={{ items: totalOptions, flipDurationMs: 150 }}
									onconsider={({ detail }) => (totalOptions = detail.items)}
									onfinalize={({ detail }) => {
										totalOptions = detail.items.map((opt, i) => ({
											...opt,
											key: String.fromCharCode(65 + i)
										}));
									}}
								>
									{#each totalOptions as { id, key }, index (id)}
										<div class="border-border flex items-start gap-3 border-b py-6 last:border-b-0">
											<span class="mt-2.5 text-lg font-bold">{key}</span>
											<span use:dragHandle aria-label="drag handle" class="mt-2">
												<GripVertical class="text-muted-foreground h-5 w-5 cursor-grab" />
											</span>
											<div class="flex min-w-0 flex-1 flex-col gap-2">
												<Input name={key} bind:value={totalOptions[index].value} />
												<AttachmentInput
													hideTrigger={true}
													mode={optionAttachmentModes[id] ?? 'none'}
													onModeChange={(m) => (optionAttachmentModes[id] = m)}
													media={optionMediaMap[id] ?? null}
													onStagedFileChange={(f) => (stagedOptionFiles[id] = f)}
													onStagedUrlChange={(u) => (stagedOptionUrls[id] = u)}
													onDeleteImage={questionId
														? () =>
																deleteMedia(
																	`/api/media/questions/${questionId}/options/${id}/image`
																)
														: undefined}
													onDeleteExternal={questionId
														? () =>
																deleteMedia(
																	`/api/media/questions/${questionId}/options/${id}/external`
																)
														: undefined}
												/>
												<div class="flex items-center gap-2">
													<Checkbox
														disabled={!hasContent(
															totalOptions[index].value,
															id,
															optionMediaMap,
															stagedOptionFiles,
															stagedOptionUrls
														)}
														checked={totalOptions[index].correct_answer}
														onCheckedChange={(checked: boolean) =>
															(totalOptions[index].correct_answer = checked)}
													/><Label class="text-sm">Correct answer</Label>
												</div>
											</div>
											{#if !(optionMediaMap[id]?.image || optionMediaMap[id]?.external_media || stagedOptionFiles[id] || (stagedOptionUrls[id] && stagedOptionUrls[id].trim()) || (optionAttachmentModes[id] && optionAttachmentModes[id] !== 'none'))}
												<div class="relative mt-2.5 shrink-0">
													<button
														type="button"
														aria-label="Add attachment"
														aria-haspopup="menu"
														aria-expanded={openAttachmentDropdownId === id}
														class="text-muted-foreground hover:text-foreground transition-colors"
														onclick={() => {
															openAttachmentDropdownId =
																openAttachmentDropdownId === id ? null : id;
														}}
													>
														<Paperclip size={18} />
													</button>
													{#if openAttachmentDropdownId === id}
														<!-- svelte-ignore a11y_no_static_element_interactions -->
														<div
															class="bg-popover absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border py-1 shadow-lg"
															onmouseleave={() => (openAttachmentDropdownId = null)}
														>
															<button
																type="button"
																class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																onclick={() => {
																	optionAttachmentModes[id] = 'image';
																	openAttachmentDropdownId = null;
																}}
															>
																<span class="flex items-center gap-2">
																	<ImageIcon size={16} class="text-muted-foreground" />
																	Image
																</span>
																<span class="text-muted-foreground text-xs">Upload</span>
															</button>
															<button
																type="button"
																class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																onclick={() => {
																	optionAttachmentModes[id] = 'video';
																	openAttachmentDropdownId = null;
																}}
															>
																<span class="flex items-center gap-2">
																	<Film size={16} class="text-muted-foreground" />
																	Video
																</span>
																<span class="text-muted-foreground text-xs">URL</span>
															</button>
															<button
																type="button"
																class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																onclick={() => {
																	optionAttachmentModes[id] = 'audio';
																	openAttachmentDropdownId = null;
																}}
															>
																<span class="flex items-center gap-2">
																	<Music size={16} class="text-muted-foreground" />
																	Audio
																</span>
																<span class="text-muted-foreground text-xs">URL</span>
															</button>
														</div>
													{/if}
												</div>
											{/if}
											{#if totalOptions.length > 1}
												<button
													type="button"
													class="mt-2.5 shrink-0"
													data-testid="trash-icon"
													onclick={() => {
														totalOptions = totalOptions
															.filter((_, i) => i !== index)
															.map((option, i) => ({
																...option,
																key: String.fromCharCode(65 + i)
															}));
													}}
												>
													<Trash_2
														size={18}
														class="text-muted-foreground hover:text-destructive cursor-pointer"
													/>
												</button>
											{/if}
										</div>
									{/each}
								</div>

								<button
									type="button"
									class="border-border text-muted-foreground hover:border-primary hover:text-primary w-full rounded-lg border-2 border-dashed py-3 text-center text-sm transition-colors"
									onclick={() => {
										totalOptions.push({
											id: totalOptions[totalOptions.length - 1].id + 1,
											key: String.fromCharCode(64 + totalOptions.length + 1),
											value: '',
											correct_answer: false
										});
									}}
								>
									Add Row
								</button>
							</div>
						{:else if $formData.question_type === QuestionTypeEnum.MatrixMatch}
							<div class="flex flex-col gap-6">
								<p class="text-muted-foreground flex items-center gap-2 text-sm">
									<span
										class="border-border inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs"
										>i</span
									>
									The matching table will be shown to the candidates as you fill it
								</p>

								<!-- Column headers -->
								<div class="flex items-center gap-4">
									<div class="flex flex-1 items-center gap-2">
										<Input bind:value={matrixRowLabel} class="bg-muted font-semibold" />
									</div>
									<div class="flex flex-1 items-center gap-2">
										<Input bind:value={matrixColLabel} class="bg-muted font-semibold" />
									</div>
									<div class="w-[18px] shrink-0"></div>
								</div>

								<!-- Two-column layout with independent drag zones -->
								<div class="flex gap-4">
									<!-- Left column -->
									<div class="flex flex-1 flex-col gap-2">
										<div
											class="flex flex-col"
											use:dragHandleZone={{
												items: matrixLeftItems,
												flipDurationMs: 150,
												type: 'matrix-left'
											}}
											onconsider={({ detail }) => (matrixLeftItems = detail.items)}
											onfinalize={({ detail }) => {
												matrixLeftItems = detail.items.map((item, i) => ({
													...item,
													key: String.fromCharCode(65 + i)
												}));
											}}
										>
											{#each matrixLeftItems as item, index (item.id)}
												<div class="flex items-start gap-2 py-3">
													<span class="mt-2.5 text-sm font-bold">{item.key}</span>
													<span use:dragHandle aria-label="drag handle" class="mt-2">
														<GripVertical class="text-muted-foreground h-5 w-5 cursor-grab" />
													</span>
													<div class="flex min-w-0 flex-1 flex-col gap-2">
														<Input bind:value={matrixLeftItems[index].value} />
														<AttachmentInput
															hideTrigger={true}
															mode={optionAttachmentModes[item.id] ?? 'none'}
															onModeChange={(m) => (optionAttachmentModes[item.id] = m)}
															media={optionMediaMap[item.id] ?? null}
															onStagedFileChange={(f) => (stagedOptionFiles[item.id] = f)}
															onStagedUrlChange={(u) => (stagedOptionUrls[item.id] = u)}
															onDeleteImage={questionId
																? () =>
																		deleteMedia(
																			`/api/media/questions/${questionId}/options/${item.id}/image`
																		)
																: undefined}
															onDeleteExternal={questionId
																? () =>
																		deleteMedia(
																			`/api/media/questions/${questionId}/options/${item.id}/external`
																		)
																: undefined}
														/>
													</div>
													{#if !(optionMediaMap[item.id]?.image || optionMediaMap[item.id]?.external_media || stagedOptionFiles[item.id] || (stagedOptionUrls[item.id] && stagedOptionUrls[item.id].trim()) || (optionAttachmentModes[item.id] && optionAttachmentModes[item.id] !== 'none'))}
														<div class="relative mt-2.5 shrink-0">
															<button
																type="button"
																aria-label="Add attachment"
																aria-haspopup="menu"
																aria-expanded={openAttachmentDropdownId === item.id}
																class="text-muted-foreground hover:text-foreground transition-colors"
																onclick={() => {
																	openAttachmentDropdownId =
																		openAttachmentDropdownId === item.id ? null : item.id;
																}}
															>
																<Paperclip size={18} />
															</button>
															{#if openAttachmentDropdownId === item.id}
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="bg-popover absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border py-1 shadow-lg"
																	onmouseleave={() => (openAttachmentDropdownId = null)}
																>
																	<button
																		type="button"
																		class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																		onclick={() => {
																			optionAttachmentModes[item.id] = 'image';
																			openAttachmentDropdownId = null;
																		}}
																	>
																		<span class="flex items-center gap-2"
																			><ImageIcon size={16} class="text-muted-foreground" /> Image</span
																		>
																		<span class="text-muted-foreground text-xs">Upload</span>
																	</button>
																	<button
																		type="button"
																		class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																		onclick={() => {
																			optionAttachmentModes[item.id] = 'video';
																			openAttachmentDropdownId = null;
																		}}
																	>
																		<span class="flex items-center gap-2"
																			><Film size={16} class="text-muted-foreground" /> Video</span
																		>
																		<span class="text-muted-foreground text-xs">URL</span>
																	</button>
																	<button
																		type="button"
																		class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																		onclick={() => {
																			optionAttachmentModes[item.id] = 'audio';
																			openAttachmentDropdownId = null;
																		}}
																	>
																		<span class="flex items-center gap-2"
																			><Music size={16} class="text-muted-foreground" /> Audio</span
																		>
																		<span class="text-muted-foreground text-xs">URL</span>
																	</button>
																</div>
															{/if}
														</div>
													{/if}
													{@render matrixTrashButton(matrixLeftItems.length > 1, () => {
														if (matrixLeftItems.length > 1) {
															const deletedId = String(matrixLeftItems[index].id);
															matrixLeftItems = matrixLeftItems
																.filter((_, i) => i !== index)
																.map((it, i) => ({
																	...it,
																	key: String.fromCharCode(65 + i)
																}));
															const { [deletedId]: _, ...rest } = matrixMatches;
															matrixMatches = rest;
														}
													})}
												</div>
											{/each}
										</div>
									</div>

									<!-- Right column -->
									<div class="flex flex-1 flex-col gap-2">
										<div
											class="flex flex-col"
											use:dragHandleZone={{
												items: matrixRightItems,
												flipDurationMs: 150,
												type: 'matrix-right'
											}}
											onconsider={({ detail }) => (matrixRightItems = detail.items)}
											onfinalize={({ detail }) => {
												matrixRightItems = detail.items.map((item, i) => ({
													...item,
													key: String(i + 1)
												}));
											}}
										>
											{#each matrixRightItems as item, index (item.id)}
												<div class="flex items-start gap-2 py-3">
													<span class="mt-2.5 text-sm font-bold">{item.key}</span>
													<span use:dragHandle aria-label="drag handle" class="mt-2">
														<GripVertical class="text-muted-foreground h-5 w-5 cursor-grab" />
													</span>
													<div class="flex min-w-0 flex-1 flex-col gap-2">
														<Input bind:value={matrixRightItems[index].value} />
														<AttachmentInput
															hideTrigger={true}
															mode={optionAttachmentModes[item.id] ?? 'none'}
															onModeChange={(m) => (optionAttachmentModes[item.id] = m)}
															media={optionMediaMap[item.id] ?? null}
															onStagedFileChange={(f) => (stagedOptionFiles[item.id] = f)}
															onStagedUrlChange={(u) => (stagedOptionUrls[item.id] = u)}
															onDeleteImage={questionId
																? () =>
																		deleteMedia(
																			`/api/media/questions/${questionId}/options/${item.id}/image`
																		)
																: undefined}
															onDeleteExternal={questionId
																? () =>
																		deleteMedia(
																			`/api/media/questions/${questionId}/options/${item.id}/external`
																		)
																: undefined}
														/>
													</div>
													{#if !(optionMediaMap[item.id]?.image || optionMediaMap[item.id]?.external_media || stagedOptionFiles[item.id] || (stagedOptionUrls[item.id] && stagedOptionUrls[item.id].trim()) || (optionAttachmentModes[item.id] && optionAttachmentModes[item.id] !== 'none'))}
														<div class="relative mt-2.5 shrink-0">
															<button
																type="button"
																aria-label="Add attachment"
																aria-haspopup="menu"
																aria-expanded={openAttachmentDropdownId === item.id}
																class="text-muted-foreground hover:text-foreground transition-colors"
																onclick={() => {
																	openAttachmentDropdownId =
																		openAttachmentDropdownId === item.id ? null : item.id;
																}}
															>
																<Paperclip size={18} />
															</button>
															{#if openAttachmentDropdownId === item.id}
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="bg-popover absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border py-1 shadow-lg"
																	onmouseleave={() => (openAttachmentDropdownId = null)}
																>
																	<button
																		type="button"
																		class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																		onclick={() => {
																			optionAttachmentModes[item.id] = 'image';
																			openAttachmentDropdownId = null;
																		}}
																	>
																		<span class="flex items-center gap-2"
																			><ImageIcon size={16} class="text-muted-foreground" /> Image</span
																		>
																		<span class="text-muted-foreground text-xs">Upload</span>
																	</button>
																	<button
																		type="button"
																		class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																		onclick={() => {
																			optionAttachmentModes[item.id] = 'video';
																			openAttachmentDropdownId = null;
																		}}
																	>
																		<span class="flex items-center gap-2"
																			><Film size={16} class="text-muted-foreground" /> Video</span
																		>
																		<span class="text-muted-foreground text-xs">URL</span>
																	</button>
																	<button
																		type="button"
																		class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
																		onclick={() => {
																			optionAttachmentModes[item.id] = 'audio';
																			openAttachmentDropdownId = null;
																		}}
																	>
																		<span class="flex items-center gap-2"
																			><Music size={16} class="text-muted-foreground" /> Audio</span
																		>
																		<span class="text-muted-foreground text-xs">URL</span>
																	</button>
																</div>
															{/if}
														</div>
													{/if}
													{@render matrixTrashButton(matrixRightItems.length > 1, () => {
														if (matrixRightItems.length > 1) {
															const removedId = matrixRightItems[index].id;
															matrixRightItems = matrixRightItems
																.filter((_, i) => i !== index)
																.map((it, i) => ({
																	...it,
																	key: String(i + 1)
																}));
															matrixMatches = Object.fromEntries(
																Object.entries(matrixMatches).map(([k, ids]) => [
																	k,
																	ids.filter((id) => id !== removedId)
																])
															);
														}
													})}
												</div>
											{/each}
										</div>
									</div>
								</div>

								<button
									type="button"
									class="border-border text-muted-foreground hover:border-primary hover:text-primary w-full rounded-lg border-2 border-dashed py-3 text-center text-sm transition-colors"
									onclick={() => {
										matrixLeftItems.push({
											id: nextId(matrixLeftItems),
											key: String.fromCharCode(65 + matrixLeftItems.length),
											value: ''
										});
										matrixRightItems.push({
											id: nextId(matrixRightItems),
											key: String(matrixRightItems.length + 1),
											value: ''
										});
									}}
								>
									Add Row
								</button>

								<!-- Correct answers table -->
								<p class="text-muted-foreground flex items-center gap-2 text-sm">
									<span
										class="border-border inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs"
										>i</span
									>
									Fill the correct answers in the table below
								</p>

								<div class="bg-muted/50 overflow-x-auto rounded-lg">
									<table class="w-full">
										<thead>
											<tr>
												<th class="px-4 py-3 text-left"></th>
												{#each matrixRightItems as rightItem (rightItem.id)}
													<th class="text-primary px-4 py-3 text-center text-sm font-semibold"
														>{rightItem.key}</th
													>
												{/each}
											</tr>
										</thead>
										<tbody>
											{#each matrixLeftItems as leftItem (leftItem.key)}
												<tr class="border-border border-t">
													<td class="text-primary px-4 py-4 text-sm font-semibold"
														>{leftItem.key}</td
													>
													{#each matrixRightItems as rightItem (rightItem.id)}
														{@const checked = (matrixMatches[String(leftItem.id)] ?? []).includes(
															rightItem.id
														)}
														<td class="px-4 py-4"
															><div class="flex justify-center">
																<Checkbox
																	{checked}
																	onCheckedChange={() => {
																		const current = matrixMatches[String(leftItem.id)] ?? [];
																		matrixMatches = {
																			...matrixMatches,
																			[String(leftItem.id)]: checked
																				? current.filter((id) => id !== rightItem.id)
																				: [...current, rightItem.id]
																		};
																	}}
																/>
															</div></td
														>
													{/each}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{:else if $formData.question_type === QuestionTypeEnum.MatrixRating}
							<div class="flex flex-col gap-6">
								<!-- Rating scale labels -->
								<div class="flex flex-col gap-3">
									<Label class="font-semibold">Rating scale labels</Label>
									<div class="flex flex-wrap items-end gap-3">
										{#each matrixRightItems as item, index (item.id)}
											<div class="flex flex-col gap-1">
												<div class="flex items-center justify-between">
													<span class="text-muted-foreground text-xs font-medium">{item.key}</span>
													{#if matrixRightItems.length > 1}
														<button
															type="button"
															aria-label="Remove rating label"
															class="text-muted-foreground hover:text-destructive"
															onclick={() => {
																matrixRightItems = matrixRightItems
																	.filter((_, i) => i !== index)
																	.map((it, i) => ({ ...it, key: String(i + 1) }));
															}}
														>
															<X size={12} />
														</button>
													{/if}
												</div>
												<Input
													class="w-32"
													placeholder={[
														'e.g. Poor',
														'e.g. Fair',
														'e.g. Good',
														'e.g. Excellent',
														'e.g. Outstanding'
													][index] ?? ''}
													bind:value={matrixRightItems[index].value}
												/>
											</div>
										{/each}
										<button
											type="button"
											aria-label="Add rating label"
											class="border-border text-muted-foreground hover:border-primary hover:text-primary mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-dashed transition-colors"
											onclick={() => {
												matrixRightItems.push({
													id: nextId(matrixRightItems),
													key: String(matrixRightItems.length + 1),
													value: ''
												});
											}}
										>
											<Plus size={16} />
										</button>
									</div>
								</div>

								<!-- Statements -->
								<div class="flex flex-col gap-3">
									<Label class="font-semibold">Statements</Label>
									<div
										class="flex flex-col"
										use:dragHandleZone={{
											items: matrixLeftItems,
											flipDurationMs: 150,
											type: 'matrix-left'
										}}
										onconsider={({ detail }) => (matrixLeftItems = detail.items)}
										onfinalize={({ detail }) => {
											matrixLeftItems = detail.items.map((item, i) => ({
												...item,
												key: String.fromCharCode(65 + i)
											}));
										}}
									>
										{#each matrixLeftItems as item, index (item.id)}
											<div class="flex items-center gap-2 py-2">
												<span use:dragHandle aria-label="drag handle">
													<GripVertical class="text-muted-foreground h-5 w-5 cursor-grab" />
												</span>
												<Input
													class="flex-1"
													placeholder="Statement {item.key}"
													bind:value={matrixLeftItems[index].value}
												/>
												{@render matrixTrashButton(matrixLeftItems.length > 1, () => {
													if (matrixLeftItems.length > 1) {
														matrixLeftItems = matrixLeftItems
															.filter((_, i) => i !== index)
															.map((it, i) => ({ ...it, key: String.fromCharCode(65 + i) }));
													}
												})}
											</div>
										{/each}
									</div>

									<button
										type="button"
										class="border-border text-muted-foreground hover:border-primary hover:text-primary w-full rounded-lg border-2 border-dashed py-3 text-center text-sm transition-colors"
										onclick={() => {
											matrixLeftItems.push({
												id: nextId(matrixLeftItems),
												key: String.fromCharCode(65 + matrixLeftItems.length),
												value: ''
											});
										}}
									>
										Add Row
									</button>
								</div>
							</div>
						{:else if $formData.question_type === QuestionTypeEnum.MatrixString || $formData.question_type === QuestionTypeEnum.MatrixNumber}
							<div class="flex flex-col gap-4">
								<div class="flex gap-4">
									<div class="flex flex-1 flex-col gap-2">
										<Input bind:value={matrixRowLabel} class="font-semibold" />
										<p class="text-xs font-medium text-gray-500">Questions</p>
										<div class="flex flex-col gap-2">
											{#each matrixLeftItems as item, index (item.id)}
												<div class="group flex flex-row items-center gap-2">
													<div
														class="bg-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-sm font-semibold"
													>
														{item.key}
													</div>
													<Input
														class="flex-1 border border-black"
														bind:value={matrixLeftItems[index].value}
													/>
													{@render matrixTrashButton(matrixLeftItems.length > 1, () => {
														if (matrixLeftItems.length > 1) {
															matrixLeftItems = matrixLeftItems
																.filter((_, i) => i !== index)
																.map((it, i) => ({ ...it, key: String.fromCharCode(65 + i) }));
														}
													})}
												</div>
											{/each}
										</div>
										{@render matrixAddButton('Add Question', () => {
											matrixLeftItems.push({
												id: nextId(matrixLeftItems),
												key: String.fromCharCode(65 + matrixLeftItems.length),
												value: ''
											});
										})}
									</div>
									<div class="flex flex-1 flex-col gap-2">
										<Input
											bind:value={matrixColLabel}
											class="font-semibold"
											placeholder="Answer column label"
										/>
										<p class="text-xs font-medium text-gray-500">
											Answer column ({$formData.question_type === QuestionTypeEnum.MatrixString
												? 'text'
												: 'number'} input)
										</p>
									</div>
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-between gap-4">
								<Label class="text-sm font-semibold">Correct answer</Label>
								<Input
									type="number"
									step="any"
									class="w-1/2"
									placeholder="e.g. 25"
									bind:value={$formData.correct_answer}
									oninput={(e) => {
										const val = (e.target as HTMLInputElement).value;
										$formData.question_type = val.includes('.')
											? QuestionTypeEnum.NumericalDecimal
											: QuestionTypeEnum.NumericalInteger;
									}}
								/>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- RIGHT COLUMN: Sidebar -->
			<div class="flex flex-col gap-6 lg:w-1/3">
				<!-- Tag Types -->
				<div class="flex flex-col gap-2">
					<Label class="font-semibold">Tag Types</Label>
					<TagTypeSelection bind:tagTypes={selectedTagTypes} />
				</div>

				<!-- Tags -->
				<div class="flex flex-col gap-2">
					<Label class="font-semibold">Tags</Label>
					<TagsSelection bind:tags={$formData.tag_ids} tagTypes={selectedTagTypes} />
				</div>

				<!-- State -->
				{#if !isStateAdmin(data.user)}
					<div class="flex flex-col gap-2">
						<Label class="font-semibold">State</Label>
						<StateSelection bind:states={$formData.state_ids} />
					</div>
				{/if}

				<hr class="border-border" />

				<!-- Toggles -->
				<div class="flex items-center justify-between">
					<Label class="font-semibold">Set Question as Mandatory</Label>
					<div class="flex items-center gap-2">
						<span
							class="text-sm {$formData.is_mandatory
								? 'text-primary font-semibold'
								: 'text-muted-foreground'}">{$formData.is_mandatory ? 'Yes' : 'No'}</span
						>
						<Switch bind:checked={$formData.is_mandatory} />
					</div>
				</div>
				<div class="flex items-center justify-between">
					<Label class="font-semibold">Question Status</Label>
					<div class="flex items-center gap-2">
						<span
							class="text-sm {$formData.is_active
								? 'text-primary font-semibold'
								: 'text-muted-foreground'}">{$formData.is_active ? 'Active' : 'Inactive'}</span
						>
						<Switch id="is-active" bind:checked={$formData.is_active} />
					</div>
				</div>

				<hr class="border-border" />

				<!-- Marking Scheme -->
				<div class="flex flex-col gap-3">
					<Label class="font-semibold">Marking scheme</Label>
					<div class="flex gap-3">
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-muted-foreground text-xs">Correct</span>
							<input
								type="number"
								name="marking_scheme.correct"
								bind:value={$formData.marking_scheme.correct}
								min="1"
								class="w-full rounded-md border border-gray-300 p-2"
							/>
						</div>
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-muted-foreground text-xs">Incorrect</span>
							<input
								type="number"
								name="marking_scheme.wrong"
								bind:value={$formData.marking_scheme.wrong}
								class="w-full rounded-md border border-gray-300 p-2"
							/>
						</div>
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-muted-foreground text-xs">No answer</span>
							<input
								type="number"
								name="marking_scheme.skipped"
								bind:value={$formData.marking_scheme.skipped}
								class="w-full rounded-md border border-gray-300 p-2"
							/>
						</div>
					</div>

					{#if isMultiChoice && $formData.question_type !== QuestionTypeEnum.Subjective}
						<PartialMarkingSection bind:partial={$formData.marking_scheme!.partial} />
					{/if}
				</div>
			</div>
		</div>
	</div>
	<UnsavedChangesDialog
		bind:open={showUnsavedDialog}
		onDiscard={() => goto(resolve('/questionbank'))}
	/>
</form>
