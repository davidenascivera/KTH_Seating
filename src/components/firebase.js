// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDiy5SW8ODXZ4nK5FxmfPi-0HPsTE7-drc",
  authDomain: "kthseating-e5b41.firebaseapp.com",
  databaseURL: "https://kthseating-e5b41-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kthseating-e5b41",
  storageBucket: "kthseating-e5b41.firebasestorage.app",
  messagingSenderId: "217943021344",
  appId: "1:217943021344:web:69ce4fe6658af425f72945",
  measurementId: "G-3SRE35X9TJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { database, ref, onValue };
