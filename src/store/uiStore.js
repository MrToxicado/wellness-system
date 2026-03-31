import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // Active nav tab
  activeTab: 'Home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Panel/Modal state
  isPanelOpen: false,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isCancelModalOpen: false,

  // Toast notifications
  toasts: [],

  // Drag state
  isDragging: false,
  dragBookingId: null,

  // Panel actions
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),

  openCreateModal: (prefillData = null) => set({ isCreateModalOpen: true, createPrefill: prefillData }),
  closeCreateModal: () => set({ isCreateModalOpen: false, createPrefill: null }),

  openEditModal: () => set({ isEditModalOpen: true }),
  closeEditModal: () => set({ isEditModalOpen: false }),

  openCancelModal: () => set({ isCancelModalOpen: true }),
  closeCancelModal: () => set({ isCancelModalOpen: false }),

  createPrefill: null,

  // Toast
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  showSuccess: (msg) => get().addToast(msg, 'success'),
  showError: (msg) => get().addToast(msg, 'error', 6000),
  showInfo: (msg) => get().addToast(msg, 'info'),
  showWarning: (msg) => get().addToast(msg, 'warning'),

  // Drag
  setDragging: (isDragging, bookingId = null) => set({ isDragging, dragBookingId: bookingId }),
}));

export default useUIStore;
