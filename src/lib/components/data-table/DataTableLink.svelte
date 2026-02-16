<script lang="ts">
	let { href, text }: { href: string; text: string } = $props();
</script>

<a {href} class="text-primary underline hover:no-underline">{text}</a>
