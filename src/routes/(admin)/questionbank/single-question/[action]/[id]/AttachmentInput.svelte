<script lang="ts">
	import type { TMedia } from '$lib/types/media';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Film from '@lucide/svelte/icons/film';
	import Music from '@lucide/svelte/icons/music';
	import X from '@lucide/svelte/icons/x';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { toast } from 'svelte-sonner';

	type AttachmentMode = 'none' | 'image' | 'video' | 'audio';

	let {
		media = null,
		onStagedFileChange,
		onStagedUrlChange,
		onDeleteImage,
		onDeleteExternal,
		hideTrigger = false,
		mode = 'none' as AttachmentMode,
		onModeChange
	}: {
		media: TMedia | null | undefined;
		onStagedFileChange?: (file: File | null) => void;
		onStagedUrlChange?: (url: string) => void;
		onDeleteImage?: () => void;
		onDeleteExternal?: () => void;
		hideTrigger?: boolean;
		mode?: AttachmentMode;
		onModeChange?: (mode: AttachmentMode) => void;
	} = $props();

	let showDropdown = $state(false);
	let fileInput: HTMLInputElement;
	let previewUrl = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let externalUrlInput = $state('');
	let isDeletingImage = $state(false);
	let isDeletingExternal = $state(false);
	let internalMode = $state<AttachmentMode>('none');
	// When hideTrigger is true, parent controls the mode; otherwise use internal state
	const attachmentMode = $derived(hideTrigger ? mode : internalMode);

	const MAX_FILE_SIZE_MB = 5;
	const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
	const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

	// Determine initial mode from existing media
	const hasExistingImage = $derived(!!media?.image);
	const hasExistingExternal = $derived(!!media?.external_media);
	const hasAttachment = $derived(
		hasExistingImage || hasExistingExternal || !!selectedFile || externalUrlInput.trim().length > 0
	);

	// Trigger file input when mode changes to 'image'
	let prevMode = $state<AttachmentMode>('none');
	$effect(() => {
		if (attachmentMode === 'image' && prevMode !== 'image' && !selectedFile && !hasExistingImage) {
			fileInput?.click();
		}
		prevMode = attachmentMode;
	});

	function setMode(newMode: AttachmentMode) {
		internalMode = newMode;
		onModeChange?.(newMode);
	}

	function selectMode(m: AttachmentMode) {
		setMode(m);
		showDropdown = false;
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			setMode('none');
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
			input.value = '';
			setMode('none');
			return;
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.error('Invalid file type. Allowed: PNG, JPG, WebP, GIF');
			input.value = '';
			setMode('none');
			return;
		}

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		onStagedFileChange?.(file);
	}

	function clearFile() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		selectedFile = null;
		previewUrl = null;
		setMode('none');
		if (fileInput) fileInput.value = '';
		onStagedFileChange?.(null);
	}

	function clearUrl() {
		externalUrlInput = '';
		setMode('none');
		onStagedUrlChange?.('');
	}

	function handleUrlInput() {
		onStagedUrlChange?.(externalUrlInput);
	}

	async function handleDeleteImage() {
		if (!onDeleteImage) return;
		isDeletingImage = true;
		try {
			await onDeleteImage();
		} finally {
			isDeletingImage = false;
			setMode('none');
		}
	}

	async function handleDeleteExternal() {
		if (!onDeleteExternal) return;
		isDeletingExternal = true;
		try {
			await onDeleteExternal();
		} finally {
			isDeletingExternal = false;
			setMode('none');
		}
	}

	function isValidUrl(url: string): boolean {
		try {
			const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch {
			return false;
		}
	}

	const urlInvalid = $derived(
		externalUrlInput.trim().length > 0 && !isValidUrl(externalUrlInput.trim())
	);
</script>

<input
	type="file"
	accept="image/png,image/jpeg,image/webp,image/gif"
	onchange={handleFileSelect}
	bind:this={fileInput}
	hidden
/>

<!-- Existing image attachment -->
{#if hasExistingImage && !selectedFile}
	<div class="border-primary/30 relative flex flex-col gap-2 rounded-lg border-2 border-dashed p-3">
		<div class="flex items-center gap-2">
			<ImageIcon size={16} class="text-muted-foreground" />
			<span class="flex-1 truncate text-sm">
				{media?.image?.alt_text || media?.image?.content_type || 'Image'}
			</span>
			{#if onDeleteImage}
				<button
					type="button"
					class="text-muted-foreground hover:text-destructive"
					onclick={handleDeleteImage}
					disabled={isDeletingImage}
				>
					{#if isDeletingImage}
						<Loader2 size={14} class="animate-spin" />
					{:else}
						<X size={14} />
					{/if}
				</button>
			{/if}
		</div>
		{#if media?.image?.url}
			<img
				src={media.image.url}
				alt={media.image.alt_text || 'Attachment'}
				class="h-20 w-20 rounded-md border object-cover"
			/>
		{/if}
	</div>

	<!-- Existing external media attachment -->
{:else if hasExistingExternal}
	<div class="border-primary/30 relative flex flex-col gap-2 rounded-lg border-2 border-dashed p-3">
		<div class="flex items-center gap-2">
			<Film size={16} class="text-muted-foreground" />
			<span class="flex-1 truncate text-sm">{media?.external_media?.url}</span>
			{#if onDeleteExternal}
				<button
					type="button"
					class="text-muted-foreground hover:text-destructive"
					onclick={handleDeleteExternal}
					disabled={isDeletingExternal}
				>
					{#if isDeletingExternal}
						<Loader2 size={14} class="animate-spin" />
					{:else}
						<X size={14} />
					{/if}
				</button>
			{/if}
		</div>
	</div>

	<!-- Staged image file (new upload, not yet saved) -->
{:else if selectedFile && previewUrl}
	<div class="border-primary/30 relative flex flex-col gap-2 rounded-lg border-2 border-dashed p-3">
		<div class="flex items-center gap-2">
			<ImageIcon size={16} class="text-muted-foreground" />
			<span class="flex-1 truncate text-sm">{selectedFile.name}</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-destructive"
				onclick={clearFile}
			>
				<X size={14} />
			</button>
		</div>
		<img src={previewUrl} alt="Preview" class="h-20 w-20 rounded-md border object-cover" />
	</div>

	<!-- Image mode: browse files -->
{:else if attachmentMode === 'image'}
	<div
		class="border-primary/30 hover:border-primary flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors"
		onclick={() => fileInput.click()}
		onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
		role="button"
		tabindex="0"
	>
		<ImageIcon size={16} class="text-muted-foreground" />
		<span class="text-muted-foreground text-sm">Browse files</span>
		<button
			type="button"
			class="text-muted-foreground hover:text-destructive ml-auto"
			onclick={(e) => {
				e.stopPropagation();
				setMode('none');
			}}
		>
			<X size={14} />
		</button>
	</div>

	<!-- Video mode: paste URL -->
{:else if attachmentMode === 'video'}
	<div class="border-primary/30 flex items-center gap-2 rounded-lg border-2 border-dashed p-3">
		<Film size={16} class="text-muted-foreground" />
		<input
			type="text"
			class="placeholder:text-muted-foreground flex-1 border-0 bg-transparent text-sm outline-none"
			placeholder="Paste video URL"
			bind:value={externalUrlInput}
			oninput={handleUrlInput}
		/>
		{#if urlInvalid}
			<span class="text-destructive text-xs font-medium">Invalid URL</span>
		{/if}
		<button type="button" class="text-muted-foreground hover:text-destructive" onclick={clearUrl}>
			<X size={14} />
		</button>
	</div>

	<!-- Audio mode: paste URL -->
{:else if attachmentMode === 'audio'}
	<div class="border-primary/30 flex items-center gap-2 rounded-lg border-2 border-dashed p-3">
		<Music size={16} class="text-muted-foreground" />
		<input
			type="text"
			class="placeholder:text-muted-foreground flex-1 border-0 bg-transparent text-sm outline-none"
			placeholder="Paste audio URL"
			bind:value={externalUrlInput}
			oninput={handleUrlInput}
		/>
		{#if urlInvalid}
			<span class="text-destructive text-xs font-medium">Invalid URL</span>
		{/if}
		<button type="button" class="text-muted-foreground hover:text-destructive" onclick={clearUrl}>
			<X size={14} />
		</button>
	</div>

	<!-- Staged external URL (video/audio entered but not yet showing mode) -->
{:else if externalUrlInput.trim()}
	<div class="border-primary/30 flex items-center gap-2 rounded-lg border-2 border-dashed p-3">
		<Film size={16} class="text-muted-foreground" />
		<span class="flex-1 truncate text-sm">{externalUrlInput}</span>
		<button type="button" class="text-muted-foreground hover:text-destructive" onclick={clearUrl}>
			<X size={14} />
		</button>
	</div>
{/if}

<!-- Add attachment trigger -->
{#if !hideTrigger && !hasAttachment && attachmentMode === 'none'}
	<div class="relative flex justify-end">
		<button
			type="button"
			class="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm transition-colors"
			onclick={() => (showDropdown = !showDropdown)}
		>
			<Paperclip size={14} />
			Add attachment
		</button>

		{#if showDropdown}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="bg-popover absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border py-1 shadow-lg"
				onmouseleave={() => (showDropdown = false)}
			>
				<button
					type="button"
					class="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-sm"
					onclick={() => selectMode('image')}
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
					onclick={() => selectMode('video')}
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
					onclick={() => selectMode('audio')}
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
