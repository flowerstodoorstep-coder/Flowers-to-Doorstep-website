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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

const OWNER_WHATSAPP = "919704978710";
const OWNER_UPI_ID = "8095759538@ptyes";
const OWNER_UPI_NAME = "Flowers to Doorstep";
const FREE_DELIVERY_THRESHOLD = 200;
const DELIVERY_FEE = 20;
const DISCOUNT_RATE = 0.10;
const ORDER_CUTOFF_HOUR = 22; // 10 PM

function getExpectedDeliveryDate() {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(ORDER_CUTOFF_HOUR, 0, 0, 0);
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + (now <= cutoff ? 1 : 2));
    return deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

function calcPricing(subtotal) {
    const qualifies = subtotal >= FREE_DELIVERY_THRESHOLD;
    const discount = qualifies ? Math.round(subtotal * DISCOUNT_RATE) : 0;
    const deliveryFee = qualifies ? 0 : DELIVERY_FEE;
    const total = subtotal - discount + deliveryFee;
    return { discount, deliveryFee, total, qualifies };
}
