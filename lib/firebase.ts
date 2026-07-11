import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxsovhTBOoFvAeXbJdUSAgDAKKDhcJAl4",
  authDomain: "fir-55bda.firebaseapp.com",
  projectId: "fir-55bda",
  storageBucket: "fir-55bda.firebasestorage.app",
  messagingSenderId: "956662071456",
  appId: "1:956662071456:web:99e94623b7f088d5e009c5",
};

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);

void setPersistence(auth, browserLocalPersistence);

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});