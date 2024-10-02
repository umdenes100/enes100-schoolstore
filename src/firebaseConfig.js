// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBAMDAGYHNMtPaXAwJl-BRvxvl37E7Z3xE",
  authDomain: "engr-enes100tool-inv-firebase.firebaseapp.com",
  databaseURL: "https://engr-enes100tool-inv-firebase-school-store.firebaseio.com/",
  projectId: "engr-enes100tool-inv-firebase",
  storageBucket: "engr-enes100tool-inv-firebase.appspot.com",
  messagingSenderId: "763916402491",
  appId: "1:763916402491:web:e598de3c258f7d4faa811e"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const database = getDatabase(app);

// Export both the app and database instances for use in other files
export { app, database };
