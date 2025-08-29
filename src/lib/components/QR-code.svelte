<script lang="ts">
	import { createQrPngDataUrl } from '@svelte-put/qr';
	import { onMount } from 'svelte';

	const { testLink }: { testLink: string } = $props();
	const fileName = testLink.split('/test/')[1];

	const config = {
		data: testLink,
		width: 500,
		height: 500,
		backgroundFill: '#fff'
	};

	let src = $state('');

	onMount(async () => {
		src = await createQrPngDataUrl(config);
	});
</script>

<a href={src} download={`${fileName}.png`}> Download QR </a>
