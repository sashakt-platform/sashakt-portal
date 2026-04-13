<script lang="ts">
	const { active }: { active: boolean } = $props();
</script>

<span
	style="width:110px; height:29px; padding: 6px 14px 6px 12px; gap:6px; border-radius:1000px; background:{active
		? '#D5F5EB'
		: '#F0F0F0'};"
	class="inline-flex items-center justify-center text-sm font-medium {active ? 'text-green-700' : 'text-gray-500'}"
>
	{active ? 'Active' : 'Inactive'}
</span>
