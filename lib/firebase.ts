import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxsovhTBOoFvAeXbJdUSAgDAKKDhcJAl4",
  authDomain: "fir-55bda.firebaseapp.com",
  projectId: "fir-55bda",
  storageBucket: "fir-55bda.firebasestorage.app",
  messagingSenderId: "956662071456",
  appId: "1:956662071456:web:99e94623b7f088d5e009c5",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);