<script module lang="ts">
	type MathJaxApi = {
		startup?: {
			promise?: Promise<void>;
		};
		typesetClear?: (elements?: HTMLElement[]) => void;
		typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
	};

	let loadPromise: Promise<void> | null = null;

	function loadMathJax(): Promise<void> {
		if (loadPromise) return loadPromise;

		const win = window as Window & { MathJax?: unknown };
		if ((win.MathJax as MathJaxApi | undefined)?.typesetPromise) {
			return (loadPromise = Promise.resolve());
		}

		win.MathJax = {
			tex: {
				inlineMath: [
					['$', '$'],
					['\\(', '\\)']
				],
				displayMath: [
					['$$', '$$'],
					['\\[', '\\]']
				],
				processEscapes: true,
				packages: { '[+]': ['noerrors'] }
			},
			options: {
				processHtmlClass: 'rich-text',
				ignoreHtmlClass: 'no-mathjax'
			},
			loader: {
				load: ['[tex]/noerrors']
			},
			chtml: {
				scale: 0.95,
				minScale: 0.5
			}
		};

		return (loadPromise = new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.id = 'MathJax-script';
			script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('MathJax failed to load'));
			document.head.appendChild(script);
		}));
	}
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';

	let {
		content = '',
		as = 'div',
		class: className = ''
	}: {
		content?: string | null;
		as?: 'div' | 'span';
		class?: string;
	} = $props();

	let element = $state<HTMLElement | null>(null);

	const typesetMath = async () => {
		if (!browser || !element) return;

		try {
			await loadMathJax();
		} catch {
			return;
		}

		const mathJax = (window as Window & { MathJax?: MathJaxApi }).MathJax;
		if (!mathJax?.typesetPromise) return;

		await tick();

		try {
			if (mathJax.startup?.promise) {
				await mathJax.startup.promise;
			}
			mathJax.typesetClear?.([element]);
			await mathJax.typesetPromise([element]);
		} catch {
			// Keep backend content visible even if MathJax fails.
		}
	};

	onMount(() => {
		void typesetMath();
	});

	$effect(() => {
		content;
		void typesetMath();
	});
</script>

<svelte:element this={as} bind:this={element} class={`rich-text ${className}`.trim()}>
	{@html content ?? ''}
</svelte:element>
