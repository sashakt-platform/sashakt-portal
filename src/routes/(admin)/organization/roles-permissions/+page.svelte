<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
</script>

<ListingPageLayout
	title="Roles and Permission"
	subtitle=""
	showInfoIcon={false}
	showEmptyState={true}
>
	{#snippet emptyState()}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
			<h3 class="text-lg font-semibold">Coming soon</h3>
			<p class="text-muted-foreground text-sm">Roles and permission management is on its way.</p>
		</div>
	{/snippet}
</ListingPageLayout>
