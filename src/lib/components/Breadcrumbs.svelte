<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { page } from '$app/state';
	import HomeIcon from '@lucide/svelte/icons/home';

	// Function to convert path segments to readable labels
	function formatLabel(segment: string): string {
		// Handle dynamic route segments
		if (segment === 'add') return 'Add';
		if (segment === 'edit') return 'Edit';
		if (segment === 'view') return 'View';
		if (segment === 'import') return 'Import';

		// Handle special cases
		const specialCases: Record<string, string> = {
			questionbank: 'Question Bank',
			'single-question': 'Question',
			'test-template': 'Test Template',
			'test-session': 'Test Session',
			'test-practice': 'Practice Test',
			'test-assessment': 'Assessment Test',
			password: 'Change Password'
		};

		if (specialCases[segment]) {
			return specialCases[segment];
		}

		// Capitalize first letter of each word
		return segment
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Generate breadcrumb items from the current path
	const breadcrumbs = $derived.by(() => {
		const pathname = page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);

		const items: Array<{ label: string; href: string; isLast: boolean }> = [];

		// Add home/dashboard as the first item
		items.push({
			label: 'Dashboard',
			href: '/dashboard',
			isLast: false
		});

		// Build breadcrumbs from segments
		let currentPath = '';
		segments.forEach((segment: string, index: number) => {
			// Skip the dashboard segment since we already added it
			if (segment === 'dashboard') return;

			currentPath += `/${segment}`;
			const isLast = index === segments.length - 1;

			items.push({
				label: formatLabel(segment),
				href: currentPath,
				isLast
			});
		});

		return items;
	});
</script>

{#if breadcrumbs.length > 1}
	<Breadcrumb.Root>
		<Breadcrumb.List>
			{#each breadcrumbs as crumb, index}
				<Breadcrumb.Item>
					{#if crumb.isLast}
						<Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
					{:else}
						<Breadcrumb.Link href={crumb.href}>
							{#if index === 0}
								<HomeIcon class="h-4 w-4" />
							{:else}
								{crumb.label}
							{/if}
						</Breadcrumb.Link>
					{/if}
				</Breadcrumb.Item>
				{#if !crumb.isLast}
					<Breadcrumb.Separator />
				{/if}
			{/each}
		</Breadcrumb.List>
	</Breadcrumb.Root>
{/if}
