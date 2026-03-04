import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyAjHco9TancULFwaB-eJtvlwMIOqjA1Fr0",
    authDomain: "introprogramming24-25.firebaseapp.com",
    projectId: "introprogramming24-25",
    storageBucket: "introprogramming24-25.appspot.com",
    messagingSenderId: "38051148755",
    appId: "1:38051148755:web:58a0f27bb36bd2e0b43526",
    measurementId: "G-5S9VCJJWFZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
