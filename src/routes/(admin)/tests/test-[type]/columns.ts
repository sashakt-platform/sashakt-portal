import type { ColumnDef } from '@tanstack/table-core';
import { createSortableColumn } from '$lib/components/data-table/column-helpers';
import { formatDate, downloadQRCode } from '$lib/utils';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
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
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	},
	user?: User | null
): ColumnDef<Test>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.name })
	}),
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => renderComponent(TagCell, { tags: row.original.tags ?? [] })
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	{
		id: 'actions',
		header: '',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => {
			const test = row.original;
			const baseUrl = `/tests/test-${isTemplate ? 'template' : 'session'}`;

			// Create custom actions array
			const customActions = [];

			customActions.push({
				label: 'Make a Copy',
				href: `${baseUrl}/${test.id}?/clone`,
				icon: 'copy',
				method: 'POST'
			});

			// Add template-specific actions
			if (isTemplate) {
				customActions.push({
					label: 'Make a Test',
					href: `/tests/test-session/convert/?template_id=${test.id}`,
					icon: 'file-plus'
				});
			} else {
				// Add session-specific actions

				if (test.link) {
					customActions.push({
						label: 'Conduct Test',
						action: () => window.open(`${testTakerUrl}/test/${test.link}`, '_blank'),
						icon: 'external-link'
					});

					customActions.push({
						label: 'Download QR Code',
						action: async () => {
							const fileName = `qr-${test.name.replace(/\s+/g, '-').toLowerCase()}`;
							try {
								await downloadQRCode(`${testTakerUrl}/test/${test.link}`, fileName);
							} catch (error) {
								console.error('Failed to download QR code:', error);
							}
						},
						icon: 'qr-code'
					});
				}
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
				entityName: isTemplate ? 'Test Template' : 'Test Session',
				editUrl: `${baseUrl}/${test.id}/`,
				deleteUrl: `${baseUrl}/${test.id}?/delete`,
				customActions,
				onDelete: () => onDelete(test.id),
				canEdit: (permissions?.canEdit ?? true) && !isRestricted,
				canDelete: (permissions?.canDelete ?? true) && !isRestricted
			});
		}
	}
];
