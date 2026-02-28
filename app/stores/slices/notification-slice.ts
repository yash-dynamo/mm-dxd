import { StateCreator } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface NotificationState {
  notification: Notification;
  createdAt: number;
  active: boolean;
}

export interface NotificationActions {
  setNotification: (notification: Notification) => void;
  removeNotification: () => void;
  getNotification: () => Notification | undefined;
}

export type NotificationStoreState = NotificationState & NotificationActions;

export const createNotificationSlice: StateCreator<NotificationStoreState> = (set, get) => ({
  notification: {
    id: '',
    title: '',
    message: '',
    type: 'success',
  },
  createdAt: 0,
  active: false,

  setNotification: (notification: Notification) => {
    set({ notification, createdAt: Date.now(), active: true });
  },

  removeNotification: () => {
    set({ notification: { id: '', title: '', message: '', type: 'success' } });
    set({ createdAt: 0 });
    set({ active: false });
  },

  getNotification: () => {
    const { notification } = get();
    return notification;
  },
});
