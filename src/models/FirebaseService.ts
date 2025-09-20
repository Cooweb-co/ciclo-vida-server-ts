// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration

const firebaseConfig = {

    apiKey: "AIzaSyC-3lCZJYEJHquqZhhQ1vkizCrNVIlnPM8",

    authDomain: "ciclo-vida.firebaseapp.com",

    projectId: "ciclo-vida",

    storageBucket: "ciclo-vida.firebasestorage.app",

    messagingSenderId: "260939649812",

    appId: "1:260939649812:web:6a2e2a421d9a5856146801"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
