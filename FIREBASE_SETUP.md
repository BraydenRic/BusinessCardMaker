# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it: `business-card-maker`
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Enable Google Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **Sign-in method** tab
4. Click on **Google** provider
5. Toggle "Enable"
6. Select a support email
7. Click "Save"

## Step 3: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll secure it later)
4. Select a location (choose closest to you)
5. Click "Enable"

## Step 4: Get Your Config

1. In Firebase Console, go to **Project Overview** (gear icon) → **Project settings**
2. Scroll down to "Your apps"
3. Click the **</>** (Web) icon
4. Register app with name: `Business Card Maker`
5. Copy the `firebaseConfig` object

## Step 5: Add Config to Project

1. Open `src/firebase/config.js`
2. Replace the placeholder config with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",  // Your actual values
  authDomain: "business-card-maker-xxxxx.firebaseapp.com",
  projectId: "business-card-maker-xxxxx",
  storageBucket: "business-card-maker-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

## Step 6: Update Firestore Rules (Security)

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own business cards
    match /users/{userId}/cards/{cardId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## You're Done! 🎉

Run `npm run dev` and test Google Sign-In.
