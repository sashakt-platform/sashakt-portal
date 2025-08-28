// @vitest-environment jsdom
import TagSelect from '../TagsSelection.svelte';
import { render, screen } from '@testing-library/svelte';

describe('TagSelect Component', () => {
    const tagData = {
        items: [
            { id: 1, name: 'Tag1', tag_type: { name: 'TypeA' } },
            { id: 2, name: 'Tag2', tag_type: { name: 'TypeB' } },
        ],
    };

    it('renders placeholder text when no tags selected', () => {
        render(TagSelect, {
            props: {
                tags: [],
                tagList: tagData.items,
            },
        });

        expect(screen.getByText('Select tags')).toBeInTheDocument();
    });



    it('displays selected tags as badges', () => {
        render(TagSelect, {
            props: {
                tags: ['1', '2'],
                tagList: tagData.items,
            },
        });

        expect(screen.getByText('Tag1-(TypeA)')).toBeInTheDocument();
        expect(screen.getByText('Tag2-(TypeB)')).toBeInTheDocument();
    });
});
