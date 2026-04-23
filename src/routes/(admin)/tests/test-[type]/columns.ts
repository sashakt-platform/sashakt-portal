import type { ColumnDef } from '@tanstack/table-core';
import { toast } from 'svelte-sonner';
import { createSortableColumn } from '$lib/components/data-table/column-helpers';
import { downloadQRCode } from '$lib/utils';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import { DataTableActions } from '$lib/components/data-table/index.js';
import TagCell from '$lib/components/data-table/TagCell.svelte';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';
import {
	isStateAdmin,
	hasAssignedDistricts,
	getUserState,
	getUserDistrict,
	type User
} from '$lib/utils/permissions.js';
import { resolve } from '$app/paths';
import type { NomenclatureKey } from '$lib/nomenclature';

export interface Test {
	id: string;
	name: string;
	tags?: Array<{ name: string; tag_type?: { name: string } }>;
	modified_date: string;
	is_template: boolean;
	link?: string;
	states?: Array<{ id: string | number; name: string }>;
	districts?: Array<{ id: string | number; name: string }>;
}

/**
 * Check if a state admin can edit/delete this test
 * Test must be assigned ONLY to their state (not shared with other states)
 */
function canStateAdminAccessTest(user: User | null, test: Test): boolean {
	const userState = getUserState(user);
	if (!userState) return false;

	// Test must have exactly 1 state assigned, and it must be user's state
	if (!test.states || test.states.length !== 1) return false;

	return String(test.states[0].id) === String(userState.id);
}

/**
 * Check if a district admin can edit/delete this test
 * Test must be assigned ONLY to their state AND ONLY to their district(s)
 */
function canDistrictAdminAccessTest(user: User | null, test: Test): boolean {
	const userState = getUserState(user);
	const userDistricts = getUserDistrict(user);

	if (!userState || !userDistricts || userDistricts.length === 0) return false;

	// Test must have exactly 1 state assigned, and it must be user's state
	if (!test.states || test.states.length !== 1) return false;
	if (String(test.states[0].id) !== String(userState.id)) return false;

	// Test must have districts assigned
	if (!test.districts || test.districts.length === 0) return false;

	// All test districts must be within user's assigned districts
	const userDistrictIds = userDistricts.map((d) => String(d.id));
	return test.districts.every((district) => userDistrictIds.includes(String(district.id)));
}

export const createTestColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	currentPage: number,
	pageSize: number,
	isTemplate: boolean,
	testTakerUrl: string,
	onDelete: (testId: string) => void,
	term: (key: NomenclatureKey) => string,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	},
	user?: User | null
): ColumnDef<Test>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.name }),
		meta: { grow: true }
	}),
	{
		accessorKey: 'tags',
		header: term('tags'),
		cell: ({ row }) => renderComponent(TagCell, { tags: row.original.tags ?? [] }),
		size: 200
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	{
		id: 'actions',
		size: 240,
		header: '',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => {
			const test = row.original;
			const baseUrl = `/tests/test-${isTemplate ? 'template' : 'session'}`;

			// Create custom actions array
			const customActions = [];

			customActions.push({
				label: 'Duplicate',
				href: resolve(`${baseUrl}/${test.id}?/clone`),
				icon: 'copy',
				method: 'POST'
			});

			// Add template-specific actions
			if (isTemplate) {
				customActions.push({
					label: 'Make a Test',
					href: resolve(`/tests/test-session/convert/?template_id=${test.id}`),
					icon: 'null',
					inline: true
				});
			} else {
				// Add session-specific actions

				customActions.push({
					label: `Copy ${term('test')} Link`,
					action: async () => {
						try {
							// ClipboardItem with a Promise preserves the user gesture context
							// across the async fetch, avoiding NotAllowedError
							await navigator.clipboard.write([
								new ClipboardItem({
									'text/plain': fetch(`/api/test-link?test_id=${test.id}`)
										.then((res) => {
											if (!res.ok) throw new Error(`${res.status}`);
											return res.json();
										})
										.then(
											(data) =>
												new Blob([`${testTakerUrl}/test/${data.uuid}`], {
													type: 'text/plain'
												})
										)
								})
							]);
							toast.success(`${term('test')} link copied`);
						} catch (error) {
							console.error('Failed to copy test link:', error);
							toast.error('Failed to copy test link');
						}
					},
					icon: 'copy-link'
				});

				customActions.push({
					label: 'Download QR',
					action: async () => {
						const fileName = `qr-${test.name.replace(/\s+/g, '-').toLowerCase()}`;
						try {
							const res = await fetch(`/api/test-link?test_id=${test.id}`);
							if (!res.ok) throw new Error('Failed to fetch link');
							const data = await res.json();
							await downloadQRCode(`${testTakerUrl}/test/${data.uuid}`, fileName);
						} catch (error) {
							console.error('Failed to download QR code:', error);
							toast.error('Failed to download QR code');
						}
					},
					icon: 'null',
					inline: true
				});
			}

			// Restrict edit/delete for state/district admins to their jurisdiction
			let isRestricted = false;

			// Check district admin FIRST (has both state and districts)
			// Then fall back to state admin (has state but no districts)
			if (hasAssignedDistricts(user)) {
				// District admin can only edit/delete tests assigned to their district
				isRestricted = !canDistrictAdminAccessTest(user, test);
			} else if (isStateAdmin(user)) {
				// State admin can only edit/delete tests assigned to their state
				isRestricted = !canStateAdminAccessTest(user, test);
			}

			return renderComponent(DataTableActions, {
				id: test.id,
				entityName: isTemplate ? term('test_template') : term('test'),
				editUrl: resolve(`${baseUrl}/${test.id}/`),
				deleteUrl: resolve(`${baseUrl}/${test.id}?/delete`),
				customActions,
				onDelete: () => onDelete(test.id),
				canEdit: (permissions?.canEdit ?? true) && !isRestricted,
				canDelete: (permissions?.canDelete ?? true) && !isRestricted,
				editInline: true
			});
		}
	}
];
