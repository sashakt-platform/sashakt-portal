<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import CircleCheck from '@lucide/svelte/icons/circle-check';

	const configSettings = [
		{
			icon: Info,
			title: 'Instructions'
		},
		{
			icon: CircleHelp,
			title: 'Question settings'
		},
		{
			icon: CircleCheck,
			title: 'Answer settings'
		}
	];

	let settingsState = $state({
		Instructions: false,
		QuestionSettings: false,
		AnswerSettings: false
	});
</script>

<div class="mx-auto flex h-dvh">
	<div class="mx-auto mt-10 flex w-1/2 flex-col">
		{#snippet configurationBox(Icon: any, title: string, visibility: boolean = false)}
			<div
				class="hover: hover:bg-secondary my-2 flex w-full cursor-pointer flex-row rounded-lg bg-white px-4 py-5 shadow"
			>
				<span class="bg-primary-foreground my-auto w-1/12 rounded-sm p-3">
					<Icon class={['text-primary mx-auto', visibility && 'rotate-180']} />
				</span>
				<p class="w-10/12 p-2 text-xl font-medium">{title}</p>
				<span class="m-auto w-1/12"><ChevronDown class="mx-auto " /></span>
			</div>
		{/snippet}

		<div>
			<button
				type="button"
				class={[
					'hover: hover:bg-secondary mt-2 flex w-full cursor-pointer flex-row  px-4 py-5 shadow',
					settingsState.Instructions ? 'bg-secondary rounded-t-2xl' : 'rounded-2xl  bg-white'
				]}
				onclick={() => (settingsState.Instructions = !settingsState.Instructions)}
			>
				<span class="bg-primary-foreground my-auto w-1/12 rounded-sm p-3">
					<Info class={['text-primary mx-auto']} />
				</span>
				<p class="w-10/12 p-2 text-left text-xl font-medium">Instructions</p>
				<span class="m-auto w-1/12"
					><ChevronDown class={['mx-auto ', settingsState.Instructions && 'rotate-180']} /></span
				>
			</button>
			<div
				class={[
					!settingsState.Instructions && 'hidden',
					'flex flex-col rounded-b-2xl bg-white p-4 pl-8 '
				]}
			>
				<div class="flex flex-row border-b-1">
					<div>
						<p>Pre-test guidelines</p>
						<p>Detailed instructions before attempting the test</p>
					</div>
					<div></div>
				</div>
				<div>B</div>
			</div>
		</div>

		{@render configurationBox(CircleHelp, 'Question settings')}
		{@render configurationBox(CircleCheck, 'Answer settings')}

		<div>
			{@render configurationBox(Info, 'Instructions')}
		</div>

		<!-- {#each configSettings as config}
			<div class="my-2 flex w-full flex-row rounded-lg bg-white px-4 py-5 shadow">
				<span class="bg-primary-foreground my-auto w-1/12 rounded-sm p-3">
					<svelte:component this={config.icon} class="text-primary mx-auto" />
				</span>
				<p class="w-10/12 p-2 text-xl font-medium">{config.title}</p>
				<span class="m-auto w-1/12"><ChevronDown class="mx-auto" /></span>
			</div>
		{/each} -->
	</div>
</div>
