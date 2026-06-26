/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { saveToLocalOnly } from './admin/db';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Test Connection to Firestore as required by constraints
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'stats', 'connection-test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// OPERATION TYPE AND ERROR HANDLING
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// CLOUD SYNC ENGINE
// Bridges the existing localStorage DB layer with Firestore Cloud
// -------------------------------------------------------------

// Active unsubscribers list to prevent duplicate subscriptions
let activeSubscriptions: (() => void)[] = [];

// Helper to write a local storage key and dispatch standard storage event for reactivity
function updateLocalAndNotify(key: string, data: any) {
  saveToLocalOnly(key, data);
  // Dispatch custom storage event for local window listeners
  window.dispatchEvent(new Event('storage'));
}

/**
 * Syncs Firestore Collections/Documents to local storage in real-time.
 * Determines subscription access based on authorization status.
 */
export function startFirebaseSync(isAdminUser: boolean) {
  // Clear any existing subscriptions first
  activeSubscriptions.forEach(unsub => unsub());
  activeSubscriptions = [];

  // 1. PUBLIC READ-ONLY SYNC (Available to everyone)
  const publicCollections = [
    { coll: 'portfolio', localKey: 'olamide_visuals_portfolio_items' },
    { coll: 'media', localKey: 'olamide_visuals_media' },
    { coll: 'crew', localKey: 'olamide_visuals_crew' },
    { coll: 'blog', localKey: 'olamide_visuals_blog' },
    { coll: 'instagram', localKey: 'olamide_visuals_instagram_posts' },
    { coll: 'spotlight', localKey: 'olamide_visuals_spotlight' }
  ];

  publicCollections.forEach(({ coll, localKey }) => {
    try {
      const unsub = onSnapshot(collection(db, coll), (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data());
        });
        if (items.length > 0) {
          updateLocalAndNotify(localKey, items);
        }
      }, (error) => {
        // Handle error gracefully if no permission
        console.warn(`Public sync failed for ${coll}:`, error.message);
      });
      activeSubscriptions.push(unsub);
    } catch (err) {
      console.warn(`Failed to init snapshot for ${coll}:`, err);
    }
  });

  // Website Content Document Sync (Public Read)
  try {
    const unsubContent = onSnapshot(doc(db, 'content', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        updateLocalAndNotify('olamide_visuals_content', docSnap.data());
      }
    }, (error) => {
      console.warn(`Content document sync failed:`, error.message);
    });
    activeSubscriptions.push(unsubContent);
  } catch (err) {
    console.warn(`Failed to init snapshot for content document:`, err);
  }

  // 2. PRIVILEGED SYNC (Available strictly to logged-in administrator)
  if (isAdminUser) {
    const adminCollections = [
      { coll: 'bookings', localKey: 'olamide_visuals_bookings' },
      { coll: 'messages', localKey: 'olamide_visuals_messages' },
      { coll: 'transactions', localKey: 'olamide_visuals_transactions' },
      { coll: 'logs', localKey: 'olamide_visuals_logs' }
    ];

    adminCollections.forEach(({ coll, localKey }) => {
      try {
        const unsub = onSnapshot(collection(db, coll), (snapshot) => {
          const items: any[] = [];
          snapshot.forEach((doc) => {
            items.push(doc.data());
          });
          updateLocalAndNotify(localKey, items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, coll);
        });
        activeSubscriptions.push(unsub);
      } catch (err) {
        console.error(`Failed to init admin snapshot for ${coll}:`, err);
      }
    });

    // Admin Profile Document Sync
    try {
      const unsubProfile = onSnapshot(doc(db, 'profile', 'admin'), (docSnap) => {
        if (docSnap.exists()) {
          updateLocalAndNotify('olamide_visuals_admin', docSnap.data());
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'profile/admin');
      });
      activeSubscriptions.push(unsubProfile);
    } catch (err) {
      console.error(`Failed to init snapshot for admin profile document:`, err);
    }
  }
}

/**
 * Handles individual item updates from client to Firestore
 */
export async function saveItemToCloud(collectionName: string, id: string, data: any): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    await setDoc(doc(db, collectionName, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Handles individual item deletions from client to Firestore
 */
export async function deleteItemFromCloud(collectionName: string, id: string): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Standardizes Google Auth Popup Login
 */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

/**
 * Signs out active session
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign Out Error:', err);
  }
}
