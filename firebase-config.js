// firebase-config.js

// Your live Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCG9PiY1pdZKm0-Z9raOWQfx8k3YL50n4k",
  authDomain: "flowers-to-doorstep.firebaseapp.com",
  databaseURL: "https://flowers-to-doorstep-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "flowers-to-doorstep",
  storageBucket: "flowers-to-doorstep.firebasestorage.app",
  messagingSenderId: "849984447371",
  appId: "1:849984447371:web:63ea8c98abec5eb218858e",
  measurementId: "G-Y02LJJHGHZ"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const storage = firebase.storage();
