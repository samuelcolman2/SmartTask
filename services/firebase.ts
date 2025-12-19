
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCvQfR_9trScuBxarhQjLPsK89h3dZE0Wc",
  authDomain: "daily-b1397.firebaseapp.com",
  databaseURL: "https://daily-b1397-default-rtdb.firebaseio.com",
  projectId: "daily-b1397",
  storageBucket: "daily-b1397.firebasestorage.app",
  messagingSenderId: "1036439937900",
  appId: "1:1036439937900:web:7c39a55fe35ade61ef4949",
  measurementId: "G-5SXXRRCF6X"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
