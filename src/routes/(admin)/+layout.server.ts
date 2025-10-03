import { getRequestEvent } from '$app/server';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ url }) => {
	const { locals } = getRequestEvent();
	const token = getSessionTokenCookie();

	let states = [];
	let tags = [];
	let districts = [];
	let tagtypes = [];

	const stateSearch = url.searchParams.get('state_search') || '';
	const tagSearch = url.searchParams.get('tag_search') || '';
	const tagTypeSearch = url.searchParams.get('tag_type_search') || '';
	const districtSearch = url.searchParams.get('district_search') || '';
	const selectedStateIds = url.searchParams.get('selected_state_ids') || '';

	const responseState = await fetch(
		`${BACKEND_URL}/location/state/?name=${encodeURIComponent(stateSearch)}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!responseState.ok) {
		console.error('Failed to fetch states:', responseState.status, responseState.statusText);
	} else {
		states = await responseState.json();
	}

	const responseTags = await fetch(`${BACKEND_URL}/tag/?name=${encodeURIComponent(tagSearch)}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseTags.ok) {
		console.error('Failed to fetch tags:', responseTags.status, responseTags.statusText);
	} else {
		const rawTags = await responseTags.json();
		// Transform tags to include tag type in the name
		tags = {
			...rawTags,
			items:
				rawTags.items?.map((tag: any) => ({
					...tag,
					name: tag.tag_type?.name ? `${tag.name} - (${tag.tag_type.name})` : tag.name
				})) || []
		};
	}

	const districtParams = new URLSearchParams({
		name: districtSearch
	});

	if (selectedStateIds) {
		const stateIds = selectedStateIds.split(',').filter(Boolean);
		for (const id of stateIds) {
			districtParams.append('state_ids', id);
		}
	}

	const responseDistricts = await fetch(
		`${BACKEND_URL}/location/district/?${districtParams.toString()}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!responseDistricts.ok) {
		console.error(
			'Failed to fetch districts:',
			responseDistricts.status,
			responseDistricts.statusText
		);
	} else {
		districts = await responseDistricts.json();
	}

	const responseTagtypes = await fetch(
		`${BACKEND_URL}/tagtype/?name=${encodeURIComponent(tagTypeSearch)}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!responseTagtypes.ok) {
		console.error(
			'Failed to fetch tagtypes:',
			responseTagtypes.status,
			responseTagtypes.statusText
		);
	} else {
		tagtypes = await responseTagtypes.json();
	}

	return {
		user: locals.user,
		states: states,
		tags: tags,
		districts: districts,
		tagtypes: tagtypes
	};
};
