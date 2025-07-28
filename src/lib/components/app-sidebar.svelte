<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import FileQuestion from '@lucide/svelte/icons/file-question';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import User from '@lucide/svelte/icons/user';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	// Menu items.
	const menu_items = {
		dashboard: {
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutGrid
		},
		question: {
			title: 'Question Bank',
			url: '/questionbank',
			icon: FileQuestion
		},
		tests: {
			title: 'Test Management',
			url: '/tests',
			icon: ClipboardList,
			submenu: {
				test_template: {
					title: 'Test Template',
					url: '/tests/test-template'
				},
				test_sessions: {
					title: 'Test Sessions',
					url: '/tests/test-session'
				}
			}
		},
		user: {
			title: 'User Management',
			url: '/users',
			icon: User
		}
	};

	let currentitem = $state(menu_items.dashboard.title);
	let { data } = $props();
</script>

{#snippet sidebaritems(item: any)}
	<Sidebar.MenuItem class="text-secondary-foreground m-1">
		<Sidebar.MenuButton
			isActive={currentitem == item.title}
			onclick={() => (currentitem = item.title)}
		>
			{#snippet child({ props })}
				<a href={item.url} {...props}>
					<item.icon />
					<span>{item.title}</span>
				</a>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
{/snippet}

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
					{@render sidebaritems(menu_items.dashboard)}
					{@render sidebaritems(menu_items.question)}

					<!---- Collapsible menu for Tests ---->
					<Collapsible.Root class="group/collapsible m-1 ">
						<Sidebar.MenuItem>
							<Collapsible.Trigger>
								<Sidebar.MenuButton
									onclick={() => (currentitem = menu_items.tests.submenu.test_template.title)}
								>
									{#snippet child({ props })}
										<a href={menu_items.tests.submenu.test_template.url} {...props}>
											<ClipboardList />
											<span>{menu_items.tests.title}</span>
											<ChevronRight
												class="ml-auto items-end transition-transform group-data-[state=open]/collapsible:rotate-90 "
											/>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									<Sidebar.MenuButton
										isActive={currentitem == menu_items.tests.submenu.test_template.title}
										onclick={() => (currentitem = menu_items.tests.submenu.test_template.title)}
									>
										{#snippet child({ props })}
											<a href={menu_items.tests.submenu.test_template.url} {...props}>
												<span>{menu_items.tests.submenu.test_template.title}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
									<Sidebar.MenuButton
										isActive={currentitem == menu_items.tests.submenu.test_sessions.title}
										onclick={() => (currentitem = menu_items.tests.submenu.test_sessions.title)}
									>
										{#snippet child({ props })}
											<a href={menu_items.tests.submenu.test_sessions.url} {...props}>
												<span>{menu_items.tests.submenu.test_sessions.title}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					</Collapsible.Root>
					<!---- Collapsible menu for Tests ---->

					{@render sidebaritems(menu_items.user)}
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
								{data.user && data.user.full_name}
								<ChevronUp class="ml-auto" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						side="top"
						align="end"
						class="w-[--bits-dropdown-menu-anchor-width]"
					>
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
