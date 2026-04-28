import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: "nocap-chat.firebaseapp.com",
    projectId: "nocap-chat",
    storageBucket: "nocap-chat.firebasestorage.app",
    messagingSenderId: "93908764336",
    appId: "1:93908764336:web:ae9b29ee7973d91a02dd75"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const db = getFirestore(app)