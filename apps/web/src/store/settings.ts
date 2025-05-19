import { create } from "zustand";

interface SettingsState {
	isOpen: boolean;
	setOpen: () => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
	isOpen: false,
	setOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
