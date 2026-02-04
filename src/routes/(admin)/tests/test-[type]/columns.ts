import type { ColumnDef } from '@tanstack/table-core';
import { createSortableColumn } from '$lib/components/data-table/column-helpers';
import { formatDate, downloadQRCode } from '$lib/utils';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { DataTableActions } from '$lib/components/data-table/index.js';
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
 * Check if a state admin can access this test (test is assigned to their state)
 */
function canStateAdminAccessTest(user: User | null, test: Test): boolean {
	const userState = getUserState(user);
	if (!userState) return false;

	// Check if test's states includes user's state
	return test.states?.some((state) => String(state.id) === String(userState.id)) ?? false;
}

/**
 * Check if a district admin can access this test (test is assigned to their district)
 */
function canDistrictAdminAccessTest(user: User | null, test: Test): boolean {
	const userDistricts = getUserDistrict(user);
	if (!userDistricts || userDistricts.length === 0) return false;

	// Check if test's districts includes any of user's districts
	const userDistrictIds = userDistricts.map((d) => String(d.id));
	return (
		test.districts?.some((district) => userDistrictIds.includes(String(district.id))) ?? false
	);
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
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => {
			const tags = row.original.tags;
			if (tags && tags.length > 0) {
				return tags
					.map((tag) => {
						const tagTypeName = tag.tag_type?.name ?? '';
						return tagTypeName ? `${tag.name} (${tagTypeName})` : tag.name;
					})
					.join(', ');
			}
			return '';
		}
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

			if (isStateAdmin(user)) {
				// State admin can only edit/delete tests assigned to their state
				isRestricted = !canStateAdminAccessTest(user, test);
			} else if (hasAssignedDistricts(user)) {
				// District admin can only edit/delete tests assigned to their district
				isRestricted = !canDistrictAdminAccessTest(user, test);
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
