import type { PageServerLoad, Actions } from './$types.js';
import { testSchema } from './schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async ({ params, url }) => {
	const user = requireLogin();
	let testData = null;
	let templateID = url.searchParams.get('template_id') || null;
	const is_template = params?.type === 'template';

	// Check permissions based on action and type
	if (params?.id === 'new' || params?.id === 'convert') {
		if (is_template) {
			requirePermission(user, PERMISSIONS.CREATE_TEST_TEMPLATE);
		} else {
			requirePermission(user, PERMISSIONS.CREATE_TEST);
		}
	} else {
		if (is_template) {
			requirePermission(user, PERMISSIONS.UPDATE_TEST_TEMPLATE);
		} else {
			requirePermission(user, PERMISSIONS.UPDATE_TEST);
		}
	}

	const token = getSessionTokenCookie();

	try {
		if (params?.id !== 'new' && params?.id !== 'convert') {
			// edit existing test
			const testResponse = await fetch(`${BACKEND_URL}/test/${params.id}?is_template=${is_template}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!testResponse.ok) {
				console.error(`Failed to fetch test data: ${testResponse.statusText}`);
				throw new Error('Failed to fetch test data');
			}

			testData = await testResponse.json();
		} else if (params?.id === 'convert' && templateID) {
			// convert flow: template selected, prefill from it
			const testResponse = await fetch(`${BACKEND_URL}/test/${templateID}?is_template=true`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!testResponse.ok) {
				console.error(`Failed to fetch template data: ${testResponse.statusText}`);
				throw new Error('Failed to fetch template data');
			}

			testData = await testResponse.json();
			testData.is_template = false;
			testData.template_id = templateID;
			testData.link = null;
		}
		// id === 'new' or id === 'convert' without templateID: testData stays null
	} catch (error) {
		console.error('Error fetching test data:', error);
		testData = null;
	}

	// fetch templates list for convert step 1 (no template chosen yet)
	let templates = { items: [], total: 0, pages: 0 };
	let templateParams = { page: 1, size: DEFAULT_PAGE_SIZE, search: '', sortBy: '', sortOrder: 'asc' };
	if (params?.id === 'convert' && !templateID) {
		const tPage = Number(url.searchParams.get('page')) || 1;
		const tSize = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
		const tSearch = url.searchParams.get('search') || '';
		const tSortBy = url.searchParams.get('sortBy') || '';
		const tSortOrder = url.searchParams.get('sortOrder') || 'asc';
		const tTagIds = url.searchParams.getAll('tag_ids');
		const tStateIds = url.searchParams.getAll('state_ids');
		const tTagTypeIds = url.searchParams.getAll('tag_type_ids');
		const tDistrictIds = url.searchParams.getAll('district_ids');

		templateParams = { page: tPage, size: tSize, search: tSearch, sortBy: tSortBy, sortOrder: tSortOrder };

		const tParams = new URLSearchParams({
			is_template: 'true',
			page: tPage.toString(),
			size: tSize.toString(),
			sort_order: tSortOrder,
			...(tSearch && { name: tSearch }),
			...(tSortBy && { sort_by: tSortBy })
		});
		for (const id of tTagIds) tParams.append('tag_ids', id);
		for (const id of tStateIds) tParams.append('state_ids', id);
		for (const id of tTagTypeIds) tParams.append('tag_type_ids', id);
		for (const id of tDistrictIds) tParams.append('district_ids', id);

		try {
			const templatesRes = await fetch(`${BACKEND_URL}/test/?${tParams}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (templatesRes.ok) templates = await templatesRes.json();
		} catch (error) {
			console.error('Error fetching templates:', error);
		}
	}

	const form = await superValidate(zod4(testSchema));
	form.data.is_template = is_template;

	// extract question dialog pagination and filter parameters
	const questionPage = Number(url.searchParams.get('questionPage')) || 1;
	const questionSize = Number(url.searchParams.get('questionSize')) || DEFAULT_PAGE_SIZE;
	const questionSearch = url.searchParams.get('questionSearch') || '';
	const questionTags = url.searchParams.get('tag_ids') || '';
	const questionStates = url.searchParams.get('state_ids') || '';
	const questionSortBy = url.searchParams.get('questionSortBy') || '';
	const questionSortOrder = url.searchParams.get('questionSortOrder') || 'asc';

	// build query parameters for questions API (for dialog)
	const questionParams = new URLSearchParams({
		page: questionPage.toString(),
		size: questionSize.toString(),
		sort_order: questionSortOrder,
		...(questionSearch && { question_text: questionSearch }),
		...(questionSortBy && { sort_by: questionSortBy })
	});

	const tagIds = questionTags ? questionTags.split(',').filter(Boolean) : [];
	for (const id of tagIds) questionParams.append('tag_ids', id);

	const stateIds = questionStates ? questionStates.split(',').filter(Boolean) : [];
	for (const id of stateIds) questionParams.append('state_ids', id);

	const responseQuestions = await fetch(`${BACKEND_URL}/questions/?${questionParams.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	let questions = { items: [], total: 0, pages: 0 };
	if (!responseQuestions.ok) {
		console.error(
			'Failed to fetch questions:',
			responseQuestions.status,
			responseQuestions.statusText
		);
	} else {
		questions = await responseQuestions.json();
	}

	// existing question testData.question_revisions for display
	const selectedQuestions = testData?.question_revisions || [];

	// pass pagination parameters for the question dialog
	const questionPaginationParams = {
		questionPage,
		questionSize,
		questionSearch,
		questionTags,
		questionStates,
		questionSortBy,
		questionSortOrder
	};

	return {
		form,
		testData,
		templates,
		templateParams,
		convertTemplate: params.id === 'convert',
		questions,
		selectedQuestions,
		questionParams: questionPaginationParams
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();
		const is_template = params?.type === 'template';

		// Check permissions based on action and type
		if (params?.id === 'new') {
			if (is_template) {
				requirePermission(user, PERMISSIONS.CREATE_TEST_TEMPLATE);
			} else {
				requirePermission(user, PERMISSIONS.CREATE_TEST);
			}
		} else {
			if (is_template) {
				requirePermission(user, PERMISSIONS.UPDATE_TEST_TEMPLATE);
			} else {
				requirePermission(user, PERMISSIONS.UPDATE_TEST);
			}
		}
		const form = await superValidate(request, zod4(testSchema));
		if (!form.valid) {
			setFlash(
				{ type: 'error', message: 'Test not Created. Please check all the details.' },
				cookies
			);
			return fail(400, { form });
		}
		const transformedFormData = {
			...form.data,
			start_time: form.data.start_time || null,
			end_time: form.data.end_time || null,
			state_ids: form.data.state_ids.map((s) => s.id),
			tag_ids: form.data.tag_ids.map((t) => t.id),
			district_ids: form.data.district_ids.map((d) => d.id),
			random_tag_count: form.data.random_tag_count.map((t) => ({ tag_id: t.id, count: t.count }))
		};
		const response = await fetch(
			`${BACKEND_URL}/test${params.id !== 'new' && params.id !== 'convert' ? `/${params.id}` : '/'}`,
			{
				method: `${params.id !== 'new' && params.id !== 'convert' ? 'PUT' : 'POST'}`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(transformedFormData)
			}
		);

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: `Test not Created. Details: ${errorMessage.detail || response.statusText}`
				},
				cookies
			);
			return fail(500, { form });
		}
		redirect(
			`/tests/test-${form.data.is_template ? 'template' : 'session'}`,
			{
				type: 'success',
				message: `Test ${form.data.is_template ? 'template' : 'session'} saved successfully`
			},
			cookies
		);
	},
	delete: async ({ params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();
		const test_type = params.type === 'template' ? 'template' : 'session';
		const is_template = params.type === 'template';

		// Check delete permissions
		if (is_template) {
			requirePermission(user, PERMISSIONS.DELETE_TEST_TEMPLATE);
		} else {
			requirePermission(user, PERMISSIONS.DELETE_TEST);
		}
		const response = await fetch(`${BACKEND_URL}/test/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			redirect(
				`/tests/test-${test_type}`,
				{
					type: 'error',
					message: `${errorMessage.detail || response.statusText}`
				},
				cookies
			);
		}
		redirect(
			`/tests/test-${test_type}`,
			{ type: 'success', message: `Test ${test_type} deleted successfully` },
			cookies
		);
	},
	clone: async ({ params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();
		const is_template = params.type === 'template';
		const test_type = params.type === 'template' ? 'template' : 'session';

		// Check create permissions (cloning creates a new test/template)
		if (is_template) {
			requirePermission(user, PERMISSIONS.CREATE_TEST_TEMPLATE);
		} else {
			requirePermission(user, PERMISSIONS.CREATE_TEST);
		}
		const response = await fetch(`${BACKEND_URL}/test/${params.id}/clone`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			redirect(
				500,
				`/tests/test-session`,
				{
					type: 'error',
					message: `Failed to clone test. Details: ${errorMessage.detail || response.statusText}`
				},
				cookies
			);
		}
		redirect(
			`/tests/test-${test_type}`,
			{ type: 'success', message: `Test ${test_type} cloned successfully` },
			cookies
		);
	}
};
