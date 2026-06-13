import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD02u_btQ3-TLxOXZZ6HPavJS8vjfNVWqg",
  authDomain: "mundial-2026-d161a.firebaseapp.com",
  projectId: "mundial-2026-d161a",
  storageBucket: "mundial-2026-d161a.firebasestorage.app",
  messagingSenderId: "699470976042",
  appId: "1:699470976042:web:3de2fe59bab0344cccdf53",
  measurementId: "G-0MT4ZQ00EY",
  // Firebase a veces omite esta URL si creaste la app web antes que la base de datos,
  // pero el formato siempre es el mismo basado en el ID del proyecto.
  databaseURL: "https://mundial-2026-d161a-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);
