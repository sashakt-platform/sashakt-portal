<script lang="ts">
	import { createQrPngDataUrl } from '@svelte-put/qr';
	import { onMount } from 'svelte';

	const { testLink }: { testLink: string } = $props();
	const fileName = (() => {
		const part = testLink.split('/test/')[1] ?? '';
		return part.trim() ? part : 'test-qr';
	})();

	const config = {
		data: testLink,
		width: 500,
		height: 500,
		backgroundFill: '#fff'
	};

	let src = $state('');
	let ready = $state(false);

	onMount(async () => {
		try {
			src = await createQrPngDataUrl(config);
		} catch (e) {
			console.error('QR generation failed', e);
		} finally {
			ready = true;
		}
	});
</script>

<a href={src} download={`${fileName}.png`}> Download QR </a>
