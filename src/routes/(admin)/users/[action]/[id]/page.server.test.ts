import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

// Mock supervalidate
vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async (data, schema) => {
		// If data is a Request, extract form data
		if (data instanceof Request) {
			const formData = await data.formData();
			const formDataObj: any = {};
			formData.forEach((value, key) => {
				formDataObj[key] = value;
			});

			// Parse state_ids if it's a JSON string
			if (formDataObj.state_ids) {
				try {
					formDataObj.state_ids = JSON.parse(formDataObj.state_ids);
				} catch (e) {
					formDataObj.state_ids = [];
				}
			} else {
				formDataObj.state_ids = [];
			}

			// Convert is_active to boolean
			if (formDataObj.is_active !== undefined) {
				formDataObj.is_active = formDataObj.is_active === 'true';
			}

			return {
				valid: true,
				data: formDataObj
			};
		}

		// For load functions
		return {
			valid: false,
			data: {}
		};
	})
}));

// Mock auth functions
vi.mock('$lib/server/auth.js', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({
		id: 1,
		username: 'testuser',
		email: 'test@example.com',
		organization_id: 'org-123',
		permissions: ['create_user', 'update_user', 'delete_user']
	}))
}));

// Mock permissions
vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		CREATE_USER: 'create_user',
		UPDATE_USER: 'update_user',
		DELETE_USER: 'delete_user',
		CREATE_ORGANIZATION: 'create_organization',
		UPDATE_ORGANIZATION: 'update_organization',
		DELETE_ORGANIZATION: 'delete_organization'
	}
}));

// Mock flash message redirect
vi.mock('sveltekit-flash-message/server', () => ({
	redirect: vi.fn((status, path, message, cookies) => {
		const error: any = new Error('Redirect');
		error.status = status;
		error.location = path;
		error.message = message;
		throw error;
	})
}));

describe('User CRUD Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load() - Add User', () => {
		it('should check create permission for add action', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: [] })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] })
				});

			await load({
				params: { action: 'add', id: 'new' }
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_USER
			);
		});

		it('should fetch roles and organizations for add action', async () => {
			const mockRoles = [
				{ id: '1', label: 'Admin' },
				{ id: '2', label: 'User' }
			];
			const mockOrganizations = [
				{ id: '1', name: 'Org 1' },
				{ id: '2', name: 'Org 2' }
			];

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: mockRoles })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: mockOrganizations })
				});

			const result = await load({
				params: { action: 'add', id: 'new' }
			} as any);

			expect(result.action).toBe('add');
			expect(result.user).toBeNull();
			expect(result.roles).toEqual(mockRoles);
			expect(result.organizations).toEqual(mockOrganizations);
		});
	});

	describe('load() - Edit User', () => {
		it('should check update permission for edit action', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: '123', name: 'Test User' })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: [] })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] })
				});

			await load({
				params: { action: 'edit', id: '123' }
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_USER
			);
		});

		it('should fetch user data, roles and organizations for edit action', async () => {
			const mockUser = {
				id: '123',
				full_name: 'John Doe',
				email: 'john@example.com'
			};
			const mockRoles = [{ id: '1', label: 'Admin' }];
			const mockOrganizations = [{ id: '1', name: 'Org 1' }];

			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockUser
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: mockRoles })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: mockOrganizations })
				});

			const result = await load({
				params: { action: 'edit', id: '123' }
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/123',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer mock-token'
					})
				})
			);

			expect(result.action).toBe('edit');
			expect(result.id).toBe('123');
			expect(result.user).toEqual(mockUser);
			expect(result.roles).toEqual(mockRoles);
			expect(result.organizations).toEqual(mockOrganizations);
		});

		it('should handle user fetch failure gracefully', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: false,
					statusText: 'Not Found'
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: [] })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] })
				});

			const result = await load({
				params: { action: 'edit', id: '999' }
			} as any);

			expect(result.user).toBeNull();
		});
	});

	describe('load() - Delete User', () => {
		it('should check delete permission for delete action', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ data: [] })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [] })
				});

			await load({
				params: { action: 'delete', id: '123' }
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_USER
			);
		});
	});

	describe('actions.save - Create User', () => {
		it('should check create permission', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'New User',
					email: 'new@example.com',
					password: 'password123',
					phone: '1234567890',
					organization_id: '1',
					role_id: '1',
					is_active: 'true'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '456' })
			});

			try {
				await actions.save({
					request: mockRequest,
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
			} catch (error: any) {
				// Expected redirect
				expect(error.location).toBe('/users');
			}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_USER
			);
		});

		it('should create user with correct data', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'New User',
					email: 'new@example.com',
					password: 'password123',
					phone: '1234567890',
					organization_id: '1',
					role_id: '2',
					is_active: 'true',
					state_ids: '["state1","state2"]',
					district_ids: '["district1","district2"]'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '456' })
			});

			try {
				await actions.save({
					request: mockRequest,
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
			} catch (error: any) {
				// Expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: 'Bearer mock-token'
					}),
					body: expect.stringContaining('New User')
				})
			);
		});

		it('should redirect to users list on success', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'New User',
					email: 'new@example.com',
					password: 'password123',
					organization_id: '1',
					role_id: '1',
					is_active: 'true'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '456' })
			});

			try {
				await actions.save({
					request: mockRequest,
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.location).toBe('/users');
			}
		});

		it('should auto-assign organization for non-super admin', async () => {
			// Mock non-super admin user
			const { requireLogin } = await import('$lib/server/auth.js');
			vi.mocked(requireLogin).mockReturnValueOnce({
				id: 2,
				username: 'regularuser',
				organization_id: 'org-456',
				permissions: ['create_user']
			} as any);

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'New User',
					email: 'new@example.com',
					password: 'password123',
					organization_id: '999', // This should be overridden
					role_id: '1',
					is_active: 'true'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '789' })
			});

			try {
				await actions.save({
					request: mockRequest,
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.organization_id).toBe('org-456');
		});
	});

	describe('actions.save - Update User', () => {
		it('should check update permission', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'Updated User',
					email: 'updated@example.com',
					phone: '1234567890',
					organization_id: '1',
					role_id: '1',
					is_active: 'true'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '123' })
			});

			try {
				await actions.save({
					request: mockRequest,
					params: { action: 'edit', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_USER
			);
		});

		it('should update user with PATCH method', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'Updated User',
					email: 'updated@example.com',
					phone: '9876543210',
					organization_id: '1',
					role_id: '2',
					is_active: 'false',
					state_ids: '["state1"]',
					district_ids: '["district1"]'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '123' })
			});

			try {
				await actions.save({
					request: mockRequest,
					params: { action: 'edit', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/123',
				expect.objectContaining({
					method: 'PATCH',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			);

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.full_name).toBe('Updated User');
			expect(callBody.is_active).toBe('false');
		});

		it('should only include password if provided', async () => {
			const mockRequestWithPassword = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'Updated User',
					email: 'updated@example.com',
					password: 'newpassword123',
					organization_id: '1',
					role_id: '1',
					is_active: 'true'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '123' })
			});

			try {
				await actions.save({
					request: mockRequestWithPassword,
					params: { action: 'edit', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.password).toBe('newpassword123');
		});

		it('should exclude password if not provided', async () => {
			const mockRequestNoPassword = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					full_name: 'Updated User',
					email: 'updated@example.com',
					organization_id: '1',
					role_id: '1',
					is_active: 'true'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: '123' })
			});

			try {
				await actions.save({
					request: mockRequestNoPassword,
					params: { action: 'edit', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.password).toBeUndefined();
		});
	});

	describe('actions.delete', () => {
		it('should check delete permission', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({})
			});

			try {
				await actions.delete({
					params: { action: 'delete', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_USER
			);
		});

		it('should delete user with correct API call', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({})
			});

			try {
				await actions.delete({
					params: { action: 'delete', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/123',
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({
						Authorization: 'Bearer mock-token'
					})
				})
			);
		});

		it('should redirect with success message on successful delete', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({})
			});

			try {
				await actions.delete({
					params: { action: 'delete', id: '123' },
					cookies: {} as any
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.location).toBe('/users');
			}
		});

		it('should handle delete failure with error message', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				statusText: 'Bad Request',
				json: async () => ({ detail: 'Cannot delete user' })
			});

			try {
				await actions.delete({
					params: { action: 'delete', id: '123' },
					cookies: {} as any
				} as any);
			} catch (error) {
				// Expected error or redirect
			}

			// Should still attempt the API call
			expect(mockFetch).toHaveBeenCalled();
		});
	});
});
