importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAXrJP8BI1Ww7Wb9Rj1BPKv4QbMMsA3Kdc",
  authDomain: "carematchisrael.firebaseapp.com",
  projectId: "carematchisrael",
  storageBucket: "carematchisrael.firebasestorage.app",
  messagingSenderId: "203730812542",
  appId: "1:203730812542:web:25f782eb91cfb2ee9be22f",
  measurementId: "G-PXZK6MK5JY"
});

const messaging = firebase.messaging();

self.addEventListener('fetch', () => {});

messaging.onBackgroundMessage((payload) => {
  const { notification } = payload;
  if (!notification) return;

  self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: '/apple-touch-icon.png',
    clickAction: payload.data?.url || '/'
  });
});
