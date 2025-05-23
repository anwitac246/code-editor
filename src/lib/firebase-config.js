import { initializeApp } from "firebase/app";

import { getAuth,GoogleAuthProvider  } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyC-5oSb-nYyr0NhPN-jPioTK-R-T2Gpnwc",
  authDomain: "braniacshub.firebaseapp.com",
  projectId: "braniacshub",
  storageBucket: "braniacshub.firebasestorage.app",
  messagingSenderId: "732670028291",
  appId: "1:732670028291:web:0840770a24c61bb4dd7c36",
  measurementId: "G-5HBE89CH4G"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };