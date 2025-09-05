<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import History from '@lucide/svelte/icons/history';
	import Label from '$lib/components/ui/label/label.svelte';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	const { data } = $props();

	let revisions = data?.questionRevisions;
	let openrevisionDialog: boolean = $state(false);
</script>

<div class="m-4 flex h-1/2 flex-col gap-4">
	<Dialog.Root bind:open={openrevisionDialog}>
		<Label
			onclick={() => (openrevisionDialog = true)}
			class="text-primary flex cursor-pointer flex-row items-center text-xl font-semibold"
			><History /> Revision History</Label
		>
		<Dialog.Content
			class=" flex max-h-[608px]  w-[440px] flex-col items-start justify-start sm:h-[70%] sm:max-w-[45%]"
		>
			<Dialog.Header class="m-0 h-fit  py-1">
				<Dialog.Title class="m-0 p-0 text-[20px]">Revision history</Dialog.Title>
				<p class="  m-0 p-0 text-[14px] text-gray-600">
					View the logs & changes done to this question
				</p>
			</Dialog.Header>
			<div class=" w-full overflow-y-auto">
				{#if revisions && revisions.length > 0}
					{#each revisions as revision, i (revision.id || revision.created_date)}
						{@const length = revisions.length}
						<div class="m-10">
							<div class="  flex items-center gap-4 text-xl">
								<div class="relative flex flex-col items-center">
									{#if revision.is_current}
										<CircleCheck
											class="z-10 flex h-4 w-4 items-center justify-center  rounded-full   bg-green-600 text-white "
										/>
									{:else}
										<div class="z-10 h-4 w-4 rounded-full border-1 bg-sky-100"></div>
									{/if}

									{#if i < length - 1}
										<div class="absolute h-32 w-0.5 bg-sky-100"></div>
									{/if}
								</div>

								<p
									class="flex h-8 w-15 items-center justify-center rounded-md bg-sky-50 text-[14px] font-semibold"
								>
									#{length - i}
								</p>

								<p class=" text-[15px] font-semibold text-gray-500">
									{new Date(revision.created_date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									}) +
										', ' +
										new Date(revision.created_date).toLocaleTimeString('en-GB', {
											hour: 'numeric',
											minute: '2-digit',
											hour12: true
										})}
								</p>
							</div>
							<p class="mt-2 ml-8 text-[14px] font-medium text-gray-500">
								{revision.created_by_id?.full_name}
							</p>
						</div>
					{/each}
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
