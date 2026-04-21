<script lang="ts">
	import {
		MAX_NOMENCLATURE_LABEL_LEN,
		NOMENCLATURE_DEFAULTS,
		type NomenclatureKey
	} from '$lib/nomenclature';
	import type { OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();

	type ConceptRow = {
		plural: NomenclatureKey;
		singular?: NomenclatureKey;
	};

	const rows: ConceptRow[] = [
		{ plural: 'dashboard' },
		{ plural: 'question_bank' },
		{ plural: 'tag_management' },
		{ plural: 'tests', singular: 'test' },
		{ plural: 'tags', singular: 'tag' },
		{ plural: 'test_templates', singular: 'test_template' },
		{ plural: 'tag_types', singular: 'tag_type' },
		{ plural: 'forms', singular: 'form' },
		{ plural: 'certificates', singular: 'certificate' },
		{ plural: 'entities', singular: 'entity' },
		{ plural: 'users', singular: 'user' }
	];

	let isCustom = $derived(settings.platform_nomenclature.mode === 'custom');
</script>

<section class="border-border rounded-2xl border bg-white shadow-sm">
	<header class="flex items-start justify-between gap-6 px-8 pt-7 pb-6">
		<div class="max-w-xl min-w-0">
			<h3 class="text-xl font-semibold text-gray-800">Platform Nomenclature</h3>
			<p class="text-muted-foreground mt-2 text-sm">
				Rename sections across the platform to match your organisation's terminology
			</p>
		</div>
		<div class="bg-muted flex h-[41px] w-[176px] shrink-0 items-center rounded-[10px] p-1">
			<button
				type="button"
				class={[
					'h-full flex-1 rounded-lg text-sm transition-colors',
					!isCustom
						? 'bg-background text-primary font-semibold shadow-sm'
						: 'font-medium text-gray-500'
				]}
				onclick={() => (settings.platform_nomenclature.mode = 'default')}
			>
				Default
			</button>
			<button
				type="button"
				class={[
					'h-full flex-1 rounded-lg text-sm transition-colors',
					isCustom
						? 'bg-background text-primary font-semibold shadow-sm'
						: 'font-medium text-gray-500'
				]}
				onclick={() => (settings.platform_nomenclature.mode = 'custom')}
			>
				Custom
			</button>
		</div>
	</header>
	<hr class="border-border mx-8" />
	<div class="px-8 py-7">
		{#if !isCustom}
			<p class="text-muted-foreground mb-4 text-sm">
				Built-in names will be used for this organization.
			</p>
		{/if}

		<div class="border-border overflow-hidden rounded-xl border">
			<div
				class="bg-muted/60 text-muted-foreground grid grid-cols-2 px-6 py-3 text-xs font-semibold tracking-wider uppercase"
			>
				<span>Default</span>
				<span>Custom</span>
			</div>
			<div class="divide-border divide-y">
				{#each rows as row (row.plural)}
					<div class="grid grid-cols-2 items-start gap-4 px-6 py-3">
						<div class="flex flex-col gap-2 pt-2">
							<span class={['text-sm', isCustom ? 'text-foreground' : 'text-muted-foreground']}>
								{NOMENCLATURE_DEFAULTS[row.plural]}
								{#if row.singular}
									<span class="text-muted-foreground ml-1 text-xs">(plural)</span>
								{/if}
							</span>
							{#if row.singular}
								<span
									class={['text-sm', isCustom ? 'text-foreground' : 'text-muted-foreground']}
								>
									{NOMENCLATURE_DEFAULTS[row.singular]}
									<span class="text-muted-foreground ml-1 text-xs">(singular)</span>
								</span>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label
								class={[
									'border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center rounded-[10px] border bg-white px-4 shadow-xs focus-within:ring-[3px]',
									!isCustom && 'opacity-60'
								]}
							>
								<input
									type="text"
									maxlength={MAX_NOMENCLATURE_LABEL_LEN}
									placeholder="Use default"
									disabled={!isCustom}
									class="text-foreground placeholder:text-muted-foreground w-full min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
									bind:value={settings.platform_nomenclature.value[row.plural]}
								/>
							</label>
							{#if row.singular}
								<label
									class={[
										'border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center rounded-[10px] border bg-white px-4 shadow-xs focus-within:ring-[3px]',
										!isCustom && 'opacity-60'
									]}
								>
									<input
										type="text"
										maxlength={MAX_NOMENCLATURE_LABEL_LEN}
										placeholder="Use default"
										disabled={!isCustom}
										class="text-foreground placeholder:text-muted-foreground w-full min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
										bind:value={settings.platform_nomenclature.value[row.singular]}
									/>
								</label>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
