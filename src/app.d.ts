// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
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
				permissions: string[];
			} | null;
			session: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
