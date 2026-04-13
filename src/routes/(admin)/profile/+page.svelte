<script>
	import AccountForm from './AccountForm.svelte';
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';

	const { data } = $props();
</script>

<div
	class="bg-background border-border sticky top-0 z-10 flex h-23 items-center justify-between gap-[14px] border-b p-8"
>
	<h1 class="font-sans text-[24px] leading-[140%] font-bold tracking-[0px]">
		{data.currentUser?.full_name ?? 'My Profile'}
	</h1>
	<div class="flex gap-2">
		<a href={resolve('/dashboard')}>
			<Button variant="outline" class="border-primary text-primary border text-sm sm:text-base"
				>Cancel</Button
			>
		</a>
		<Button type="submit" form="profile-form" class="bg-primary text-sm sm:text-base">Save</Button>
	</div>
</div>

<AccountForm {data} />
