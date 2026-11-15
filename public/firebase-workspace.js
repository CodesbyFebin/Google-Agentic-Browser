/* Firebase Authentication + Firestore notes inside the existing browser UI.
 * Uses the official Firebase modular browser SDK from Google's versioned CDN.
 * Only public Firebase web configuration reaches this module; never a service account.
 */
(() => {
  'use strict';

  const state = {
    loading: true, configured: false, connected: false, verified: false,
    busy: false, email: '', notes: [], error: '', status: 'Preparing Firebase…',
  };
  let sdk = null;
  let authentication = null;
  let database = null;
  let unsubscribeNotes = null;
  let generation = 0;

  function publish() {
    window.dispatchEvent(new CustomEvent('gab-firebase-update', {
      detail: { ...state, notes: state.notes.map(note => ({ ...note })) },
    }));
  }

  function failureMessage(error, fallback) {
    const code = typeof error?.code === 'string' ? error.code : '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Sign-in cancelled.';
    if (code === 'auth/unauthorized-domain') return 'Add this site to Firebase Authentication authorized domains.';
    if (code === 'permission-denied' || code === 'firestore/permission-denied') return 'Firestore denied this operation. Deploy firestore.rules before using notes.';
    return fallback;
  }

  function cleanupNotes() {
    if (unsubscribeNotes) { unsubscribeNotes(); unsubscribeNotes = null; }
    state.notes = [];
  }

  function userNotes(uid) {
    return sdk.collection(database, 'users', uid, 'notes');
  }

  async function validateUser(user, epoch) {
    cleanupNotes();
    state.verified = false;
    state.connected = Boolean(user);
    state.email = user?.email || '';
    state.error = '';
    state.status = user ? 'Verifying Google sign-in on the server…' : 'Sign in to sync your own notes.';
    publish();
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const result = await fetch('/api/firebase/session', {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (!result.ok) throw new Error('Server verification failed.');
      const body = await result.json();
      if (!body.authenticated || body.user?.uid !== user.uid || epoch !== generation) return;
      state.verified = true;
      state.status = 'Verified session · private Firestore notes';
      const notesQuery = sdk.query(userNotes(user.uid),
        sdk.orderBy('createdAt', 'desc'), sdk.limit(30));
      unsubscribeNotes = sdk.onSnapshot(notesQuery, snapshot => {
        if (epoch !== generation) return;
        state.notes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: typeof data.text === 'string' ? data.text.slice(0, 2000) : '',
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || '',
          };
        });
        publish();
      }, error => {
        if (epoch !== generation) return;
        state.error = failureMessage(error, 'Could not read your private Firestore notes.');
        publish();
      });
    } catch {
      if (epoch !== generation) return;
      state.verified = false;
      state.error = 'Firebase sign-in could not be verified by the server. Please sign in again.';
      state.status = 'Session unverified';
    }
    publish();
  }

  async function initialize() {
    try {
      const response = await fetch('/api/firebase/config', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not check Firebase configuration.');
      const result = await response.json();
      state.configured = Boolean(result.configured && result.config);
      if (!state.configured) {
        state.status = 'Firebase is not configured.';
        return;
      }
      const version = '13.3.0';
      const [appModule, authModule, firestoreModule] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`),
      ]);
      sdk = { ...appModule, ...authModule, ...firestoreModule };
      const app = sdk.initializeApp(result.config, 'google-agentic-browser');
      authentication = sdk.getAuth(app);
      database = sdk.getFirestore(app);
      sdk.onIdTokenChanged(authentication, user => {
        const epoch = ++generation;
        void validateUser(user, epoch);
      });
      state.status = 'Ready for Google sign-in.';
    } catch {
      state.error = 'Firebase SDK could not be initialized. Check the project settings and network.';
      state.status = 'Firebase unavailable';
    } finally {
      state.loading = false;
      publish();
    }
  }

  function requireVerifiedUser() {
    const user = authentication?.currentUser;
    if (!sdk || !user || !state.verified || state.busy) {
      throw new Error('Sign in with Google and wait for server verification.');
    }
    return user;
  }

  async function withBusy(action) {
    state.busy = true;
    state.error = '';
    publish();
    try { await action(); }
    catch (error) {
      state.error = failureMessage(error, 'The requested Firebase operation failed.');
    } finally {
      state.busy = false;
      publish();
    }
  }

  window.gabFirebaseWorkspace = {
    signIn: async () => {
      if (!sdk || !authentication || state.busy) return;
      await withBusy(async () => {
        // Google account sign-in is a user-initiated popup. It does NOT grant
        // Google Drive or Gmail access; those require separate OAuth consent.
        await sdk.signInWithPopup(authentication, new sdk.GoogleAuthProvider());
      });
    },
    signOut: async () => {
      if (!sdk || !authentication || state.busy) return;
      await withBusy(async () => { await sdk.signOut(authentication); });
    },
    addNote: async text => {
      if (typeof text !== 'string' || text.trim().length < 1 || text.trim().length > 2000) {
        state.error = 'Notes must contain 1–2000 characters.';
        publish();
        return;
      }
      let user;
      try { user = requireVerifiedUser(); }
      catch {
        state.error = 'Sign in and wait for server verification first.';
        publish();
        return;
      }
      await withBusy(async () => {
        await sdk.addDoc(userNotes(user.uid), {
          ownerUid: user.uid, text: text.trim(), createdAt: sdk.serverTimestamp(),
        });
      });
    },
    deleteNote: async id => {
      if (typeof id !== 'string' || !/^[A-Za-z0-9]{8,40}$/.test(id)) return;
      let user;
      try { user = requireVerifiedUser(); } catch { return; }
      await withBusy(async () => {
        await sdk.deleteDoc(sdk.doc(database, 'users', user.uid, 'notes', id));
      });
    },
  };

  void initialize();
})();
