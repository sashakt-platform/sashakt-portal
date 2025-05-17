<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import { Link } from '$lib/components/ui/breadcrumb';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import FileUp from '@lucide/svelte/icons/file-up';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
</script>

<div class="mt-10 ml-10 flex w-full items-center align-middle">
	<span class="flex flex-row">
		<h2
			class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
		>
			Tests
		</h2>
		<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
	</span>
</div>
<Label class="my-auto ml-10 align-middle text-sm font-extralight">Manage Tests</Label>

<EmptyBox
	title="Create your first test template"
	subtitle="Define the structure and content of your test template"
	leftButton={{ title: 'Create Template', link: '/test-template', click: () => {} }}
	rightButton={null}
/>
