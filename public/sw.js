self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'approve',
        title: 'Approve'
      },
      {
        action: 'deny',
        title: 'Deny'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'approve' || event.action === 'deny') {
    const contentId = event.notification.data.contentId;
    
    event.waitUntil(
      fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          action: event.action
        })
      })
    );
  }
}); 