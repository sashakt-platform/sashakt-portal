import { vi } from 'vitest';

// Mock DataTransfer for fileProxy in sveltekit-superforms
// This is needed because jsdom doesn't have DataTransfer
const createMockFileList = () => {
	const fileList = {
		length: 0,
		item: () => null,
		[Symbol.iterator]: function* () {}
	};
	return fileList as unknown as FileList;
};

global.DataTransfer = class DataTransfer {
	items = {
		add: vi.fn()
	};
	files = createMockFileList();
} as any;
