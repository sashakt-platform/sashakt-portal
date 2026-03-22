<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChartColumnIncreasing from '@lucide/svelte/icons/chart-column-increasing';
	import FileWarning from '@lucide/svelte/icons/file-warning';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import User from '@lucide/svelte/icons/user';
	import MessageSquareCode from '@lucide/svelte/icons/message-square-code';
	import Building from '@lucide/svelte/icons/building-2';
	import { canRead, hasPermission, PERMISSIONS } from '$lib/utils/permissions.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import FileText from '@lucide/svelte/icons/file-text';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Boxes from '@lucide/svelte/icons/boxes';
	import Settings from '@lucide/svelte/icons/settings';
	import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	// Menu items.
	const menu_items = {
		dashboard: {
			title: 'Dashboard',
			url: '/dashboard',
			icon: ChartColumnIncreasing
		},
		question: {
			title: 'Question Bank',
			url: '/questionbank',
			icon: FileWarning
		},
		test_template: {
			title: 'Test Templates',
			url: '/tests/test-template',
			icon: ClipboardList
		},
		test_session: {
			title: 'Test Sessions',
			url: '/tests/test-session',
			icon: ClipboardCheck
		},
		tags: {
			title: 'Tag Management',
			url: '/tags',
			icon: MessageSquareCode
		},
		forms: {
			title: 'Forms',
			url: '/forms',
			icon: FileText
		},
		certificate: {
			title: 'Certificates',
			url: '/certificate',
			icon: ShieldCheck
		},
		entity: {
			title: 'Entities',
			url: '/entity',
			icon: Boxes
		},
		user: {
			title: 'Users',
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
	<Sidebar.MenuItem class="m-1">
		<Sidebar.MenuButton
			isActive={currentitem == item.title}
			onclick={() => handleMenuClick(item.title)}
		>
			{#snippet child({ props })}
				<a href={resolve(item.url)} {...props}>
					<item.icon />
					<span>{item.title}</span>
				</a>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
{/snippet}

<Sidebar.Root>
	<Sidebar.Header class="flex-row items-center justify-between py-4">
		{#if data.organization?.logo}
			<img
				src={data.organization.logo}
				alt={data.organization?.name}
				class="h-10 w-auto object-contain"
			/>
		{:else}
			<h4
				class="w-full scroll-m-20 pl-3 text-xl font-extrabold tracking-tighter text-white uppercase"
			>
				Sashakt
			</h4>
		{/if}
		<button
			onclick={() => sidebar.toggle()}
			class="flex h-8 w-8 items-center justify-center rounded-md border border-white/30 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
		>
			<ChevronsLeft class="h-5 w-5" />
		</button>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent class="text-base leading-1">
				<Sidebar.Menu>
					{@render sidebaritems(menu_items.dashboard)}

					{#if canRead(data.user, 'question')}
						{@render sidebaritems(menu_items.question)}
					{/if}

					{#if canRead(data.user, 'test-template')}
						{@render sidebaritems(menu_items.test_template)}
					{/if}

					{#if canRead(data.user, 'test')}
						{@render sidebaritems(menu_items.test_session)}
					{/if}

					{#if canRead(data.user, 'tag')}
						{@render sidebaritems(menu_items.tags)}
					{/if}
					{#if canRead(data.user, 'certificate')}
						{@render sidebaritems(menu_items.certificate)}
					{/if}

					{#if canRead(data.user, 'form')}
						{@render sidebaritems(menu_items.forms)}
					{/if}

					{#if canRead(data.user, 'entity')}
						{@render sidebaritems(menu_items.entity)}
					{/if}

					{#if canRead(data.user, 'user')}
						{@render sidebaritems(menu_items.user)}
					{/if}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="m-1">
				<Sidebar.MenuButton
					isActive={currentitem == 'Settings'}
					onclick={() => handleMenuClick('Settings')}
				>
					{#snippet child({ props })}
						<a href={resolve('/organization')} {...props}>
							<Settings />
							<span>Settings</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem class="m-1">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								{...props}
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<User />
								<span>{data.user && data.user.full_name}</span>
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						side="top"
						align="end"
						class="w-(--bits-dropdown-menu-anchor-width)"
					>
						{#if hasPermission(data.user, PERMISSIONS.UPDATE_MY_ORGANIZATION)}
							<DropdownMenu.Item onSelect={() => handleDropdownNavigate(resolve('/organization'))}>
								<Building class="mr-2 size-4" />
								<span>My Organization</span>
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
						{/if}
						<DropdownMenu.Item onSelect={() => handleDropdownNavigate(resolve('/profile'))}>
							<span>My Profile</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							onSelect={() => handleDropdownNavigate(resolve('/profile/password'))}
						>
							<span>Change Password</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item onSelect={() => handleDropdownNavigate(resolve('/logout'))}>
							<span>Sign out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
