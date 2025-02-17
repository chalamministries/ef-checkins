import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

const container = document.getElementById('notifications-container');
const notifications = new Map();

async function removeNotification(id, element) {
  if (!element) return;
  
  element.classList.add('removing');
  await new Promise(resolve => setTimeout(resolve, 200));
  element.remove();
  notifications.delete(id);

  if (notifications.size === 0) {
	await appWindow.hide();
  }
}

function addNotification(data) {
  console.log('Adding notification:', data);
  const id = Date.now().toString();
  const div = document.createElement('div');
  div.className = `notification ${data.type || 'green'}`;
  div.innerHTML = `
	<img class="avatar" 
		 src="${data.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRTBFMEUwIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNyIgZmlsbD0iIzlFOUU5RSIvPjxwYXRoIGQ9Ik04IDM2YzAtOCA2LTEyIDEyLTEyczEyIDQgMTIgMTIiIGZpbGw9IiM5RTlFOUUiLz48L3N2Zz4='}"
		 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRTBFMEUwIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNyIgZmlsbD0iIzlFOUU5RSIvPjxwYXRoIGQ9Ik04IDM2YzAtOCA2LTEyIDEyLTEyczEyIDQgMTIgMTIiIGZpbGw9IiM5RTlFOUUiLz48L3N2Zz4='">
	<div class="content">
	  <div class="title">${data.title || 'No Title'}</div>
	  <div class="message">${data.message || 'No Message'}</div>
	</div>
  `;

  div.addEventListener('click', () => removeNotification(id, div));
  container.appendChild(div);
  notifications.set(id, div);

  if (!data.requiresInteraction) {
	setTimeout(() => removeNotification(id, div), 4000);
  }

  appWindow.show();
}

function init() {
  console.log('Setting up notification listener');
  listen('notification-data', (event) => {
	console.log('Received notification:', event);
	addNotification(event.payload);
  });

  appWindow.hide();
}

// Initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}