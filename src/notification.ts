import Notification from './Notification.svelte';
import { listen } from '@tauri-apps/api/event';

const app = new Notification({
  target: document.getElementById('app'),
  props: {
	notificationData: {}
  }
});

// Listen for notification data
listen('notification-data', (event) => {
  app.$set({ notificationData: event.payload });
});

export default app;