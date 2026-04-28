import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase with error handling
let app;
let auth;
let googleProvider;
let db;

try {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config: ${missingKeys.join(", ")}`);
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();

  // Configure Google provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export { auth, googleProvider, db };

export const loginWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      throw new Error("Firebase not properly initialized");
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    return {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      avatar: user.photoURL || undefined,
    };
  } catch (error: any) {
    console.error("Google login error:", error);

    // Handle specific Firebase errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Popup was blocked by browser. Please allow popups and try again.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Authentication was cancelled.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your internet connection and try again.");
    } else {
      throw new Error(error.message || "Authentication failed. Please try again.");
    }
  }
};

export const logout = async () => {
  try {
    if (!auth) {
      throw new Error("Firebase auth not initialized");
    }
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.error("Firebase auth not initialized");
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

export const isFirebaseReady = () => {
  return !!(app && auth && googleProvider);
};
