// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCIHukYa07oKC159AJV7RGN1Z-ZMOZQA2k",
  authDomain: "check-ee399.firebaseapp.com",
  databaseURL: "https://check-ee399-default-rtdb.firebaseio.com",
  projectId: "check-ee399",
  storageBucket: "check-ee399.appspot.com",
  messagingSenderId: "616595701207",
  appId: "1:616595701207:web:ee4e998307f445b65f9f92",
  measurementId: "G-8LLFPR7BDT"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const database = getDatabase(app);

// Export both the app and database instances for use in other files
export { app, database };
