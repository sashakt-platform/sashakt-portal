<script lang="ts">
	import RichText from '$lib/components/RichText.svelte';

	let { value = '' }: { value?: string } = $props();
</script>

<div class="max-w-full overflow-hidden text-sm leading-5">
	<RichText
		content={value}
		class="[&_p]:m-0 [&_p]:inline [&_div]:inline [&_ul]:my-0 [&_ol]:my-0 [&_li]:inline [&_li]:after:content-[',_'] [&_li:last-child]:after:content-['']"
		as="div"
	/>
</div>
