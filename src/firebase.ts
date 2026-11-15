import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() ||
    firebaseConfig.apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() ||
    firebaseConfig.authDomain,
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() ||
    firebaseConfig.projectId,
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() ||
    firebaseConfig.appId,
};

// Initialize Firebase App
export const app =
  getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

const firestoreDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

// Initialize Firestore (support custom database id if provided)
export const db =
  firestoreDbId && firestoreDbId !== '(default)'
    ? getFirestore(app, firestoreDbId)
    : getFirestore(app);

// Standard Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Dedicated Google Sheets Provider for Moderator Workspace Integration
export const sheetsProvider = new GoogleAuthProvider();
sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
sheetsProvider.setCustomParameters({
  prompt: 'consent',
});

// Strictly in-memory OAuth access token storage (NEVER persisted to localStorage or sessionStorage)
let inMemorySheetsAccessToken: string | null = null;

export function setInMemorySheetsToken(token: string | null) {
  inMemorySheetsAccessToken = token;
}

export function getInMemorySheetsToken(): string | null {
  return inMemorySheetsAccessToken;
}

// Clear in-memory token automatically on Firebase sign-out
onAuthStateChanged(auth, (fbUser) => {
  if (!fbUser) {
    inMemorySheetsAccessToken = null;
  }
});

// Acquire a fresh Google Sheets OAuth access token via popup for the moderator
export async function connectGoogleSheetsAccess(): Promise<string> {
  try {
    const result = await signInWithPopup(auth, sheetsProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      throw new Error('Google Sheets permission was not granted.');
    }
    inMemorySheetsAccessToken = accessToken;
    return accessToken;
  } catch (err: any) {
    if (
      err?.code === 'auth/unauthorized-domain' ||
      String(err?.message || '').includes('auth/unauthorized-domain')
    ) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      throw new Error(
        `Domain "${host}" is not authorized in Firebase Console → Authentication → Settings → Authorized domains.`
      );
    }
    throw err;
  }
}

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
};
export type { FirebaseUser };
export const firebaseAppConfig = resolvedFirebaseConfig;
