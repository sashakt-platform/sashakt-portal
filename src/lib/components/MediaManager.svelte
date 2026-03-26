<script lang="ts">
	import type { TMedia } from '$lib/types/media';
	import Upload from '@lucide/svelte/icons/upload';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import X from '@lucide/svelte/icons/x';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import MediaDisplay from './MediaDisplay.svelte';
	import { toast } from 'svelte-sonner';

	let {
		media = null,
		onStagedFileChange,
		onStagedUrlChange,
		onDeleteImage,
		onDeleteExternal
	}: {
		media: TMedia | null | undefined;
		onStagedFileChange?: (file: File | null) => void;
		onStagedUrlChange?: (url: string) => void;
		onDeleteImage?: () => void;
		onDeleteExternal?: () => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let externalUrlInput = $state('');
	let isDeletingImage = $state(false);
	let isDeletingExternal = $state(false);

	async function handleDeleteImage() {
		if (!onDeleteImage) return;
		isDeletingImage = true;
		try {
			await onDeleteImage();
		} finally {
			isDeletingImage = false;
		}
	}

	async function handleDeleteExternal() {
		if (!onDeleteExternal) return;
		isDeletingExternal = true;
		try {
			await onDeleteExternal();
		} finally {
			isDeletingExternal = false;
		}
	}

	const MAX_FILE_SIZE_MB = 5;
	const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
	const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
	const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (file.size > MAX_FILE_SIZE) {
			toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
			input.value = '';
			return;
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
			input.value = '';
			return;
		}

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		onStagedFileChange?.(file);
	}

	function clearFileSelection() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		selectedFile = null;
		previewUrl = null;
		if (fileInput) fileInput.value = '';
		onStagedFileChange?.(null);
	}

	$effect(() => {
		onStagedUrlChange?.(externalUrlInput);
	});
</script>

<div class="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
	<!-- Image Section -->
	<div class="flex flex-col gap-2">
		<Label class="text-sm font-medium">Image</Label>

		{#if media?.image && !selectedFile}
			<div class="flex items-start gap-3">
				{#if media.image.url}
					<img
						src={media.image.url}
						alt={media.image.alt_text || 'Question image'}
						class="h-24 w-24 rounded-lg border object-cover"
					/>
				{:else}
					<div class="flex h-24 w-24 items-center justify-center rounded-lg border bg-gray-100">
						<Upload class="h-8 w-8 text-gray-400" />
					</div>
				{/if}
				<div class="flex flex-col gap-1">
					<p class="text-xs text-gray-500">
						{media.image.content_type} &middot; {Math.round((media.image.size_bytes || 0) / 1024)}KB
					</p>
					{#if media.image.alt_text}
						<p class="text-xs text-gray-500">{media.image.alt_text}</p>
					{/if}
					{#if onDeleteImage}
						<Button
							variant="destructive"
							size="sm"
							class="mt-1 w-fit"
							onclick={handleDeleteImage}
							disabled={isDeletingImage}
						>
							{#if isDeletingImage}
								<Loader2 size={14} class="mr-1 animate-spin" />
								Deleting...
							{:else}
								<Trash_2 size={14} class="mr-1" />
								Delete
							{/if}
						</Button>
					{/if}
				</div>
			</div>
		{:else if selectedFile && previewUrl}
			<div class="flex items-start gap-3">
				<img src={previewUrl} alt="Preview" class="h-24 w-24 rounded-lg border object-cover" />
				<div class="flex flex-col gap-2">
					<p class="text-xs text-gray-600">{selectedFile.name}</p>
					<p class="text-xs text-gray-500">{Math.round(selectedFile.size / 1024)}KB</p>
					<div class="flex items-center gap-2">
						<p class="text-xs text-gray-500 italic">Will upload on save</p>
						<Button variant="outline" size="sm" onclick={clearFileSelection}>
							<X size={14} />
						</Button>
					</div>
				</div>
			</div>
		{:else}
			<div
				class="border-primary/30 hover:border-primary flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors"
				onclick={() => fileInput.click()}
				onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
				role="button"
				tabindex="0"
			>
				<Upload class="text-primary mb-1 h-6 w-6" />
				<p class="text-xs text-gray-600">Click to upload image</p>
				<p class="text-xs text-gray-400">PNG, JPG, WebP, GIF — max {MAX_FILE_SIZE_MB}MB</p>
			</div>
		{/if}

		<input
			type="file"
			accept="image/png,image/jpeg,image/webp,image/gif"
			onchange={handleFileSelect}
			bind:this={fileInput}
			hidden
		/>
	</div>

	<!-- External Media Section -->
	<div class="flex flex-col gap-2">
		<Label class="text-sm font-medium">External Media</Label>

		{#if media?.external_media}
			<div class="flex items-center gap-3 rounded-lg border bg-white p-3">
				<div class="flex-1">
					<p class="text-sm font-medium capitalize">{media.external_media.provider}</p>
					<a
						href={media.external_media.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary inline-flex items-center gap-1 text-xs hover:underline"
					>
						<ExternalLink size={12} />
						{media.external_media.url.length > 50
							? media.external_media.url.slice(0, 50) + '...'
							: media.external_media.url}
					</a>
				</div>
				{#if onDeleteExternal}
					<Button
						variant="destructive"
						size="sm"
						onclick={handleDeleteExternal}
						disabled={isDeletingExternal}
					>
						{#if isDeletingExternal}
							<Loader2 size={14} class="mr-1 animate-spin" />
							Deleting...
						{:else}
							<Trash_2 size={14} class="mr-1" />
							Delete
						{/if}
					</Button>
				{/if}
			</div>

			{#if media.external_media.embed_url}
				<MediaDisplay media={{ external_media: media.external_media }} />
			{/if}
		{:else}
			<div class="flex gap-2">
				<Input
					placeholder="Paste YouTube, Vimeo, Spotify, or SoundCloud URL..."
					bind:value={externalUrlInput}
					class="flex-1"
				/>
				{#if externalUrlInput.trim()}
					<p class="my-auto text-xs text-gray-500 italic">Will add on save</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
