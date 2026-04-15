<script lang="ts">
	import AccountForm from './AccountForm.svelte';
	import ChangePassword from './ChangePassword.svelte';
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { profileSchema } from './schema';

	const { data } = $props();

	const form = superForm(data.currentUser ? { ...data.currentUser } : data.form, {
		validators: zod4Client(profileSchema),
		dataType: 'json',
		onResult({ result }) {
			if (result.type === 'redirect') {
				form.form.update((f) => ({
					...f,
					current_password: '',
					new_password: '',
					confirm_password: ''
				}));
			}
		}
	});
	const { enhance } = form;
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

<form id="profile-form" method="POST" action="?/save" use:enhance>
	<AccountForm {form} />
	<ChangePassword {form} />
</form>
