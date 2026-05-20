<script lang="ts">
	import { untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Highlight from '@tiptap/extension-highlight';
	import Link from '@tiptap/extension-link';
	import Underline from '@tiptap/extension-underline';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import UnderlineIcon from '@lucide/svelte/icons/underline';
	import ListIcon from '@lucide/svelte/icons/list';
	import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
	import HighlighterIcon from '@lucide/svelte/icons/highlighter';
	import LinkIcon from '@lucide/svelte/icons/link';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Code2Icon from '@lucide/svelte/icons/code-2';

	let {
		value = $bindable(null),
		placeholder = ''
	}: {
		value?: string | null;
		placeholder?: string;
	} = $props();

	let editorEl = $state<HTMLDivElement | null>(null);
	let editor = $state<Editor | null>(null);
	let editorState = $state({
		bold: false,
		italic: false,
		underline: false,
		bulletList: false,
		orderedList: false,
		highlight: '#ffffff',
		link: false,
		heading: 0 as 0 | 1 | 2 | 3
	});
	let linkInput = $state({ open: false, href: '' });
	let mathHintOpen = $state(false);
	let sourceOpen = $state(false);

	$effect(() => {
		if (!editorEl) return;

		const instance = new Editor({
			element: editorEl,
			extensions: [
				StarterKit,
				Placeholder.configure({ placeholder }),
				Highlight.configure({ multicolor: true }),
				Link.configure({ openOnClick: false }),
				Underline
			],
			content: untrack(() => value ?? ''),
			editorProps: {
				attributes: {
					class: 'focus:outline-none min-h-24 px-3 py-2 text-sm'
				}
			},
			onUpdate({ editor: e }) {
				const html = e.getHTML();
				value = html === '<p></p>' ? null : html;
			},
			onTransaction({ editor: e }) {
				editorState.bold = e.isActive('bold');
				editorState.italic = e.isActive('italic');
				editorState.underline = e.isActive('underline');
				editorState.bulletList = e.isActive('bulletList');
				editorState.orderedList = e.isActive('orderedList');
				editorState.highlight = (e.getAttributes('highlight').color as string) ?? '#ffffff';
				editorState.link = e.isActive('link');
				editorState.heading =
					([1, 2, 3] as const).find((l) => e.isActive('heading', { level: l })) ?? 0;
			}
		});

		editor = instance;

		return () => {
			instance.destroy();
			editor = null;
		};
	});

	$effect(() => {
		if (!editor) return;
		const currentHTML = editor.getHTML();
		const targetHTML = value ?? '';
		const normalizedCurrent = currentHTML === '<p></p>' ? '' : currentHTML;
		const normalizedTarget = targetHTML === '<p></p>' ? '' : targetHTML;
		if (normalizedCurrent !== normalizedTarget) {
			editor.commands.setContent(targetHTML, { emitUpdate: false });
		}
	});

	function toolbarBtn(active: boolean) {
		return [
			'rounded p-1 transition-colors hover:bg-accent',
			active ? 'bg-accent text-foreground' : 'text-muted-foreground'
		];
	}

	function setHeading(e: Event) {
		const level = Number((e.target as HTMLSelectElement).value) as 0 | 1 | 2 | 3;
		if (level === 0) {
			editor?.chain().focus().setParagraph().run();
		} else {
			editor?.chain().focus().setHeading({ level }).run();
		}
	}

	function applyHighlight(e: Event) {
		const color = (e.target as HTMLInputElement).value;
		editor?.chain().focus().setHighlight({ color }).run();
	}

	function toggleLink() {
		if (editorState.link) {
			editor?.chain().focus().unsetLink().run();
			return;
		}
		linkInput.href = '';
		linkInput.open = true;
	}

	function applyLink() {
		const href = linkInput.href.trim();
		if (href) {
			editor?.chain().focus().setLink({ href }).run();
		}
		linkInput.open = false;
		linkInput.href = '';
	}

	function cancelLink() {
		linkInput.open = false;
		linkInput.href = '';
	}

	function handleLinkKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			applyLink();
		} else if (e.key === 'Escape') {
			cancelLink();
		}
	}
</script>

<div
	class="border-input bg-background focus-within:border-ring focus-within:ring-ring/50 rounded-md border focus-within:ring-[3px]"
>
	<div class="border-border flex items-center gap-0.5 border-b px-2 py-1.5">
		<select
			value={editorState.heading}
			onchange={setHeading}
			title="Heading"
			class="text-muted-foreground hover:bg-accent focus:outline-none cursor-pointer rounded border-0 bg-transparent px-1.5 py-0.5 text-xs"
		>
			<option value={0}>Normal</option>
			<option value={1}>H1</option>
			<option value={2}>H2</option>
			<option value={3}>H3</option>
		</select>
		<div class="bg-border mx-1 h-4 w-px"></div>
		<button
			type="button"
			class={toolbarBtn(editorState.bold)}
			onclick={() => editor?.chain().focus().toggleBold().run()}
			title="Bold"
		>
			<BoldIcon class="h-4 w-4" />
		</button>
		<button
			type="button"
			class={toolbarBtn(editorState.italic)}
			onclick={() => editor?.chain().focus().toggleItalic().run()}
			title="Italic"
		>
			<ItalicIcon class="h-4 w-4" />
		</button>
		<button
			type="button"
			class={toolbarBtn(editorState.underline)}
			onclick={() => editor?.chain().focus().toggleUnderline().run()}
			title="Underline"
		>
			<UnderlineIcon class="h-4 w-4" />
		</button>
		<div class="bg-border mx-1 h-4 w-px"></div>
		<button
			type="button"
			class={toolbarBtn(editorState.bulletList)}
			onclick={() => editor?.chain().focus().toggleBulletList().run()}
			title="Bullet List"
		>
			<ListIcon class="h-4 w-4" />
		</button>
		<button
			type="button"
			class={toolbarBtn(editorState.orderedList)}
			onclick={() => editor?.chain().focus().toggleOrderedList().run()}
			title="Ordered List"
		>
			<ListOrderedIcon class="h-4 w-4" />
		</button>
		<div class="bg-border mx-1 h-4 w-px"></div>
		<!-- Highlight color -->
		<label class="relative cursor-pointer" title="Highlight Color">
			<span class={toolbarBtn(false)}>
				<HighlighterIcon class="text-muted-foreground h-4 w-4" />
				<span
					class="absolute right-1 bottom-1 left-1 h-[3px] rounded-full"
					style="background-color: {editorState.highlight}"
				></span>
			</span>
			<input
				type="color"
				class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				value={editorState.highlight}
				onchange={applyHighlight}
			/>
		</label>
		<div class="bg-border mx-1 h-4 w-px"></div>
		<!-- Link -->
		<button type="button" class={toolbarBtn(editorState.link)} onclick={toggleLink} title="Link">
			<LinkIcon class="h-4 w-4" />
		</button>
		<div class="flex-1"></div>
		<!-- Math hint toggle -->
		<button
			type="button"
			class={toolbarBtn(mathHintOpen)}
			onclick={() => (mathHintOpen = !mathHintOpen)}
			title="Math formula syntax"
		>
			<InfoIcon class="h-4 w-4" />
		</button>
		<button
			type="button"
			class={toolbarBtn(sourceOpen)}
			onclick={() => (sourceOpen = !sourceOpen)}
			title="View source"
		>
			<Code2Icon class="h-4 w-4" />
		</button>
	</div>

	{#if mathHintOpen}
		<div class="border-border bg-muted/40 flex items-start gap-2 border-b px-3 py-2 text-xs">
			<InfoIcon class="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
			<p class="text-muted-foreground">
				For math formulas, use <code class="bg-muted rounded px-1">\(x^2 + y^2\)</code>
			</p>
		</div>
	{/if}

	{#if linkInput.open}
		<div class="border-border flex items-center gap-2 border-b px-3 py-1.5">
			<LinkIcon class="text-muted-foreground h-3.5 w-3.5 shrink-0" />
			<input
				type="url"
				bind:value={linkInput.href}
				placeholder="https://example.com"
				class="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
				onkeydown={handleLinkKeydown}
			/>
			<button
				type="button"
				onclick={applyLink}
				class="text-primary text-xs font-medium hover:underline"
			>
				Apply
			</button>
			<button
				type="button"
				onclick={cancelLink}
				class="text-muted-foreground hover:text-foreground text-xs"
			>
				Cancel
			</button>
		</div>
	{/if}

	{#if sourceOpen}
		<pre class="text-muted-foreground min-h-24 overflow-auto whitespace-pre-wrap break-all px-3 py-2 text-sm font-mono">{value ?? ''}</pre>
	{/if}
	<div bind:this={editorEl} class:hidden={sourceOpen}></div>
</div>

<style>
	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
		color: var(--color-muted-foreground);
		font-weight: 300;
	}

	:global(.ProseMirror ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
	}

	:global(.ProseMirror ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
	}

	:global(.ProseMirror li) {
		margin-top: 0.25rem;
	}

	:global(.ProseMirror a) {
		color: hsl(var(--primary));
		text-decoration: underline;
		cursor: pointer;
	}

	:global(.ProseMirror h1) {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.375;
		margin-top: 0.5rem;
	}

	:global(.ProseMirror h2) {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.375;
		margin-top: 0.5rem;
	}

	:global(.ProseMirror h3) {
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.375;
		margin-top: 0.25rem;
	}
</style>
