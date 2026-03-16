<script lang="ts">
	import type { TMedia } from '$lib/types/media';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let {
		media,
		compact = false
	}: {
		media: TMedia | null | undefined;
		compact?: boolean;
	} = $props();

	const hasImage = $derived(media?.image);
	const hasExternal = $derived(media?.external_media);
	const isEmbeddable = $derived(
		hasExternal?.embed_url &&
			(hasExternal.provider === 'youtube' ||
				hasExternal.provider === 'vimeo' ||
				hasExternal.provider === 'spotify')
	);
</script>

{#if media && (hasImage || hasExternal)}
	<div class="flex flex-col gap-3 {compact ? 'mt-1' : 'mt-3'}">
		{#if hasImage}
			<div class={compact ? 'max-w-48' : 'max-w-md'}>
				{#if media.image?.url}
					<img
						src={media.image.url}
						alt={media.image?.alt_text || 'Question image'}
						class="h-auto w-full rounded-lg border border-gray-200 object-contain"
						loading="lazy"
					/>
				{:else}
					<p class="text-xs text-gray-500">
						{media.image?.content_type} &middot; {Math.round(
							(media.image?.size_bytes || 0) / 1024
						)}KB
					</p>
				{/if}
				{#if media.image?.alt_text}
					<p class="mt-1 text-xs text-gray-500">{media.image.alt_text}</p>
				{/if}
			</div>
		{/if}

		{#if hasExternal}
			{#if isEmbeddable}
				<div
					class={compact ? 'max-w-64' : 'max-w-lg'}
					style={hasExternal.provider === 'spotify' ? 'height: 152px;' : 'aspect-ratio: 16/9;'}
				>
					<iframe
						src={hasExternal.embed_url}
						title={hasExternal.provider}
						class="h-full w-full rounded-lg"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						sandbox="allow-scripts allow-same-origin allow-presentation"
					></iframe>
				</div>
			{:else}
				<a
					href={hasExternal.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary inline-flex items-center gap-1 text-sm hover:underline"
				>
					<ExternalLink size={14} />
					{hasExternal.provider !== 'generic' ? hasExternal.provider : 'External media'}
				</a>
			{/if}
		{/if}
	</div>
{/if}
