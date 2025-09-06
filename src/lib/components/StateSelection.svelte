<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { goto } from '$app/navigation';
	import { type Filter } from '$lib/types/filters';
	import Filteration from './Filteration.svelte';

	let stateList = $derived.by(() => page?.data?.states?.items ?? []);
	let { states = $bindable(), ...rest } = $props();
</script>

<Filteration bind:items={states} itemName="state" bind:itemList={stateList} {...rest} />
