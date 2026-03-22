// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { RowData } from '@tanstack/table-core';

declare module '@tanstack/table-core' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		grow?: boolean;
		align?: 'left' | 'center' | 'right';
	}
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				full_name: string;
				email: string;
				phone?: string;
				role_id: number;
				organization_id: number;
				created_by_id?: number | null;
				is_active: boolean;
				created_date: string;
				modified_date: string;
				is_deleted: boolean;
				states: any[];
				districts: any[];
				permissions: string[];
			} | null;
			session: string | null;
			organization: {
				logo: string;
				name: string;
				shortcode: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
