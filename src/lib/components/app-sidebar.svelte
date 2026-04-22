<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import FileWarning from '@lucide/svelte/icons/file-warning';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import User from '@lucide/svelte/icons/user';
	import MessageSquareCode from '@lucide/svelte/icons/message-square-code';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { canRead, hasAnyPermission, hasPermission, PERMISSIONS } from '$lib/utils/permissions.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import FileText from '@lucide/svelte/icons/file-text';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Boxes from '@lucide/svelte/icons/boxes';
	import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	// Menu items
	const menu_items = [
		{ title: 'Question Bank', url: '/questionbank', icon: FileWarning, entity: 'question' },
		{
			title: 'Test Templates',
			url: '/tests/test-template',
			icon: ClipboardList,
			entity: 'test-template'
		},
		{ title: 'Tests', url: '/tests/test-session', icon: ClipboardCheck, entity: 'test' },
		{ title: 'Tag Management', url: '/tags', icon: MessageSquareCode, entity: 'tag' },
		{ title: 'Certificates', url: '/certificate', icon: ShieldCheck, entity: 'certificate' },
		{ title: 'Forms', url: '/forms', icon: FileText, entity: 'form' },
		{ title: 'Entities', url: '/entity', icon: Boxes, entity: 'entity' },
		{ title: 'Users', url: '/users', icon: User, entity: 'user' }
	];

	let { data } = $props();
	const sidebar = useSidebar();

	const currentitem = $derived.by(() => {
		const path = page.url.pathname;
		const match = menu_items.find((item) => path === item.url || path.startsWith(item.url + '/'));
		return match?.title ?? menu_items[0].title;
	});

	const myOrgChildren = $derived.by(() => {
		const children: { title: string; url: string }[] = [];
		if (hasPermission(data.user, PERMISSIONS.UPDATE_MY_ORGANIZATION)) {
			children.push({ title: 'Organisation Details', url: '/organization' });
		}
		if (
			hasAnyPermission(data.user, [
				PERMISSIONS.UPDATE_ORGANIZATION_SETTINGS,
				PERMISSIONS.UPDATE_MY_ORGANIZATION_SETTINGS
			])
		) {
			children.push({ title: 'Organisation Settings', url: '/organization/settings' });
		}
		return children;
	});

	const isMyOrgActive = $derived(
		myOrgChildren.some(
			(c) => page.url.pathname === c.url || page.url.pathname.startsWith(c.url + '/')
		)
	);

	function handleMenuClick() {
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
		<Sidebar.MenuButton isActive={currentitem == item.title} onclick={() => handleMenuClick()}>
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
					{#each menu_items as item (item.url)}
						{#if !item.entity || canRead(data.user, item.entity)}
							{@render sidebaritems(item)}
						{/if}
					{/each}

					{#if myOrgChildren.length > 0}
						<Collapsible.Root open={isMyOrgActive} class="group/collapsible">
							<Sidebar.MenuItem class="m-1">
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton {...props} isActive={isMyOrgActive}>
											<Briefcase />
											<span>My Organisation</span>
											<ChevronRight
												class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
											/>
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<Sidebar.MenuSub>
										{#each myOrgChildren as subItem (subItem.url)}
											<Sidebar.MenuSubItem>
												<Sidebar.MenuSubButton
													isActive={page.url.pathname === subItem.url}
													onclick={() => handleMenuClick()}
												>
													{#snippet child({ props })}
														<a href={subItem.url} {...props}>
															<span>{subItem.title}</span>
														</a>
													{/snippet}
												</Sidebar.MenuSubButton>
											</Sidebar.MenuSubItem>
										{/each}
									</Sidebar.MenuSub>
								</Collapsible.Content>
							</Sidebar.MenuItem>
						</Collapsible.Root>
					{/if}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
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
						<DropdownMenu.Item onSelect={() => handleDropdownNavigate(resolve('/profile'))}>
							<span>My Profile</span>
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
