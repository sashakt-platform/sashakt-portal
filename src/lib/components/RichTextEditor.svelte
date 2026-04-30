<script lang="ts">
	import { untrack } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import { TextStyle } from '@tiptap/extension-text-style';
	import Color from '@tiptap/extension-color';
	import Highlight from '@tiptap/extension-highlight';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import ListIcon from '@lucide/svelte/icons/list';
	import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
	import BaselineIcon from '@lucide/svelte/icons/baseline';
	import HighlighterIcon from '@lucide/svelte/icons/highlighter';

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
		bulletList: false,
		orderedList: false,
		color: '#000000',
		highlight: '#ffffff'
	});

	$effect(() => {
		if (!editorEl) return;

		const instance = new Editor({
			element: editorEl,
			extensions: [
				StarterKit,
				Placeholder.configure({ placeholder }),
				TextStyle,
				Color,
				Highlight.configure({ multicolor: true })
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
				editorState.bulletList = e.isActive('bulletList');
				editorState.orderedList = e.isActive('orderedList');
				editorState.color = (e.getAttributes('textStyle').color as string) ?? '#000000';
				editorState.highlight =
					(e.getAttributes('highlight').color as string) ?? '#ffffff';
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

	function applyColor(e: Event) {
		const color = (e.target as HTMLInputElement).value;
		editor?.chain().focus().setColor(color).run();
	}

	function applyHighlight(e: Event) {
		const color = (e.target as HTMLInputElement).value;
		editor?.chain().focus().setHighlight({ color }).run();
	}
</script>

<div
	class="rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
>
	<div class="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
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
		<div class="mx-1 h-4 w-px bg-border"></div>
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
		<div class="mx-1 h-4 w-px bg-border"></div>
		<!-- Text color -->
		<label class="relative cursor-pointer" title="Text Color">
			<span class={toolbarBtn(false)}>
				<BaselineIcon class="h-4 w-4 text-muted-foreground" />
				<span
					class="absolute right-1 bottom-1 left-1 h-[3px] rounded-full"
					style="background-color: {editorState.color}"
				></span>
			</span>
			<input
				type="color"
				class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				value={editorState.color}
				onchange={applyColor}
			/>
		</label>
		<!-- Highlight color -->
		<label class="relative cursor-pointer" title="Highlight Color">
			<span class={toolbarBtn(false)}>
				<HighlighterIcon class="h-4 w-4 text-muted-foreground" />
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
	</div>

	<div bind:this={editorEl}></div>
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
</style>
