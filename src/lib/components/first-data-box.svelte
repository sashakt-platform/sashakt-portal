<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Button from './ui/button/button.svelte';
	import FileUp from '@lucide/svelte/icons/file-up';
	import WhiteEmptyBox from './white-empty-box.svelte';
	import StatLogo from '$lib/icons/StatLogo.svelte';

	interface OptionButtons {
		title: string;
		link?: string;
		click: () => void;
	}
	export let title;
	export let subtitle;
	export let leftButton: OptionButtons;
	export let rightButton: OptionButtons | null = null;
</script>

<!-- <div class="m-10 h-screen w-3/4 rounded-2xl bg-white text-center align-middle shadow-2xl">
	<div class="flex h-full flex-col items-center justify-center"> -->
<WhiteEmptyBox>
	<StatLogo />
	<h1 class="mt-4 text-3xl font-bold text-gray-800">{title}</h1>
	<p class="mt-4 text-gray-400">
		{subtitle}
	</p>
	<div class="mt-4">
		{#if leftButton}
			<a href={leftButton.link}>
				<Button
					variant="outline"
					class="mr-4 h-12 cursor-pointer hover:bg-[#0369A1] hover:text-white"
					onclick={leftButton.click}><Plus /> {leftButton.title}</Button
				>
			</a>
		{/if}
		{#if rightButton}
			<a href={rightButton.link}>
				<Button
					variant="outline"
					class="bg-primary mr-4 h-12 cursor-pointer text-white"
					onclick={rightButton.click}
				>
					<FileUp />{rightButton.title}
				</Button></a
			>
		{/if}
	</div>
</WhiteEmptyBox>
<!-- </div>
</div> -->
