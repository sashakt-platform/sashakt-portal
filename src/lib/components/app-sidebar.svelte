<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import FileQuestion from '@lucide/svelte/icons/file-question';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import User from '@lucide/svelte/icons/user';

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

	let { data } = $props();
</script>

<Sidebar.Root class="bg-white p-3">
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel
				><h4
					class="w-ful text-primary scroll-m-20 pb-4 text-xl font-extrabold tracking-tighter uppercase"
				>
					Sashakt
				</h4></Sidebar.GroupLabel
			>
			<Sidebar.GroupContent class="pt-4 text-base leading-1 ">
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem class="text-secondary-foreground m-1">
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
	<Sidebar.Footer class="border-t-primary">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								{...props}
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								{data.user.full_name}
								<ChevronUp class="ml-auto" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content side="top" class="w-[--bits-dropdown-menu-anchor-width]">
						<DropdownMenu.Item>
							<span>My Account</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<a href="/logout">
								<span>Sign out</span>
							</a>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
