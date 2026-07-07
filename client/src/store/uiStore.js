import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarOpen: true,
  modalStack: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),

  openModal: (modalId, props = {}) =>
    set((s) => ({ modalStack: [...s.modalStack, { id: modalId, props }] })),

  closeModal: () =>
    set((s) => ({ modalStack: s.modalStack.slice(0, -1) })),

  closeAllModals: () => set({ modalStack: [] }),
}));

export default useUIStore;
