let addNotification = null;

export function setNotificationHandler(fn) {
  addNotification = fn;
}

export function notify(message, type = 'info', icon = null, meta = {}) {
  if (addNotification) {
    addNotification(message, type, icon, meta);
  }
} 