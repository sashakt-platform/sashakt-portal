<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import FileQuestion from '@lucide/svelte/icons/file-question';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import User from '@lucide/svelte/icons/user';

	// Menu items.

	// Menu items.
	const items = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutGrid
		},
		{
			title: 'Question Bank',
			url: '/questionbank',
			icon: FileQuestion
		},
		{
			title: 'Tests',
			url: '/tests',
			icon: ClipboardList
		},
		{
			title: 'User Management',
			url: '/user',
			icon: User
		}
	];
</script>

<Sidebar.Root>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel
				><h4 class="w-ful scroll-m-20 pb-4 text-xl font-extrabold tracking-tighter text-black">
					Sashakt
				</h4></Sidebar.GroupLabel
			>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
