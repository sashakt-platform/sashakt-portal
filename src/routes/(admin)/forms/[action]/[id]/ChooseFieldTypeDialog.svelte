<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { fieldTypeLabels, fieldTypeCategories, type FormFieldTypeValue } from './schema.js';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Building2 from '@lucide/svelte/icons/building-2';
	import Minus from '@lucide/svelte/icons/minus';
	import AlignLeft from '@lucide/svelte/icons/align-left';
	import Hash from '@lucide/svelte/icons/hash';
	import Calendar from '@lucide/svelte/icons/calendar';
	import SquareCheck from '@lucide/svelte/icons/square-check';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ToggleLeft from '@lucide/svelte/icons/toggle-left';
	import type { Component } from 'svelte';

	interface Props {
		open: boolean;
		onSelect: (fieldType: FormFieldTypeValue) => void;
		onClose: () => void;
	}

	let { open = $bindable(), onSelect, onClose }: Props = $props();

	const fieldTypeIcons: Record<string, Component<{ class?: string }>> = {
		full_name: UserRound,
		email: Mail,
		phone: Phone,
		state: MapPin,
		district: MapPin,
		block: MapPin,
		entity: Building2,
		text: Minus,
		textarea: AlignLeft,
		number: Hash,
		date: Calendar,
		checkbox: SquareCheck,
		radio: CircleDot,
		select: ChevronDown,
		toggle: ToggleLeft
	};

	function handleSelect(fieldType: FormFieldTypeValue) {
		onSelect(fieldType);
	}
</script>

<Dialog.Root bind:open onOpenChange={(val) => !val && onClose()}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Choose Field Type</Dialog.Title>
		</Dialog.Header>

		<div class="flex flex-col gap-6 py-2">
			{#each Object.entries(fieldTypeCategories) as [category, types] (category)}
				<div class="flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<span class="text-primary text-xs font-semibold tracking-wider uppercase">
							{category}
						</span>
						<div class="bg-border h-px flex-1"></div>
					</div>

					<div class="grid grid-cols-4 gap-2">
						{#each types as type (type)}
							{@const IconComponent = fieldTypeIcons[type]}
							<button
								type="button"
								class="hover:bg-accent flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
								onclick={() => handleSelect(type)}
							>
								{#if IconComponent}
									<IconComponent class="text-muted-foreground h-4 w-4" />
								{/if}
								<span>{fieldTypeLabels[type]}</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
