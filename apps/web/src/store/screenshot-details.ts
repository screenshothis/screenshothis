import { create } from "zustand";

interface ScreenshotDetailsState {
	isOpen: boolean;
	screenshotId: string | null;
	open: (id: string) => void;
	close: () => void;
}

export const useScreenshotDetails = create<ScreenshotDetailsState>()((set) => ({
	isOpen: false,
	screenshotId: null,
	open: (id) => set({ isOpen: true, screenshotId: id }),
	close: () => set({ isOpen: false, screenshotId: null }),
}));
