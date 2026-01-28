<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import FileQuestion from '@lucide/svelte/icons/file-question';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import User from '@lucide/svelte/icons/user';
	import Tags from '@lucide/svelte/icons/tags';
	import Building from '@lucide/svelte/icons/building-2';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { canRead, hasPermission, PERMISSIONS } from '$lib/utils/permissions.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import { goto } from '$app/navigation';

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
		tags: {
			title: 'Tag Management',
			url: '/tags',
			icon: Tags
		},
		certificate: {
			title: 'Certificate Management',
			url: '/certificate',
			icon: ShieldCheck
		},
		user: {
			title: 'User Management',
			url: '/users',
			icon: User
		}
	};

	let currentitem = $state(menu_items.dashboard.title);
	let { data } = $props();
	const sidebar = useSidebar();

	// Helper function to close mobile sidebar when menu item is clicked
	// also for normal navigation
	function handleMenuClick(itemTitle: string) {
		currentitem = itemTitle;
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	// Helper function to handle dropdown menu item navigation
	function handleDropdownNavigate(url: string) {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
		goto(url);
	}
</script>

{#snippet sidebaritems(item: any)}
	<Sidebar.MenuItem class="text-secondary-foreground m-1">
		<Sidebar.MenuButton
			isActive={currentitem == item.title}
			onclick={() => handleMenuClick(item.title)}
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
					class="text-primary w-full scroll-m-20 pb-4 text-xl font-extrabold tracking-tighter uppercase"
				>
					Sashakt
				</h4></Sidebar.GroupLabel
			>
			<Sidebar.GroupContent class="pt-4 text-base leading-1 ">
				<Sidebar.Menu>
					{@render sidebaritems(menu_items.dashboard)}

					{#if canRead(data.user, 'question')}
						{@render sidebaritems(menu_items.question)}
					{/if}

					<!---- Collapsible menu for Tests ---->
					{#if canRead(data.user, 'test') || canRead(data.user, 'test-template')}
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
										{#if canRead(data.user, 'test-template')}
											<Sidebar.MenuButton
												isActive={currentitem == menu_items.tests.submenu.test_template.title}
												onclick={() =>
													handleMenuClick(menu_items.tests.submenu.test_template.title)}
											>
												{#snippet child({ props })}
													<a href={menu_items.tests.submenu.test_template.url} {...props}>
														<span>{menu_items.tests.submenu.test_template.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuButton>
										{/if}
										{#if canRead(data.user, 'test')}
											<Sidebar.MenuButton
												isActive={currentitem == menu_items.tests.submenu.test_sessions.title}
												onclick={() =>
													handleMenuClick(menu_items.tests.submenu.test_sessions.title)}
											>
												{#snippet child({ props })}
													<a href={menu_items.tests.submenu.test_sessions.url} {...props}>
														<span>{menu_items.tests.submenu.test_sessions.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuButton>
										{/if}
									</Sidebar.MenuSub>
								</Collapsible.Content>
							</Sidebar.MenuItem>
						</Collapsible.Root>
					{/if}
					<!---- Collapsible menu for Tests ---->

					{#if canRead(data.user, 'tag')}
						{@render sidebaritems(menu_items.tags)}
					{/if}
					{#if canRead(data.user, 'certificate')}
						{@render sidebaritems(menu_items.certificate)}
					{/if}

					{#if canRead(data.user, 'user')}
						{@render sidebaritems(menu_items.user)}
					{/if}
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
						class="w-(--bits-dropdown-menu-anchor-width)"
					>
						{#if hasPermission(data.user, PERMISSIONS.UPDATE_MY_ORGANIZATION)}
							<DropdownMenu.Item onSelect={() => handleDropdownNavigate('/organization')}>
								<Building class="mr-2 size-4" />
								<span>My Organization</span>
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
						{/if}
						<DropdownMenu.Item onSelect={() => handleDropdownNavigate('/profile')}>
							<span>My Profile</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item onSelect={() => handleDropdownNavigate('/profile/password')}>
							<span>Change Password</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item onSelect={() => handleDropdownNavigate('/logout')}>
							<span>Sign out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
