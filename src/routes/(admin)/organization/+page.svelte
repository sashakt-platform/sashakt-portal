<script lang="ts">
	import OrganizationForm from './OrganizationForm.svelte';
	const { data } = $props();
</script>

<OrganizationForm {data} />
