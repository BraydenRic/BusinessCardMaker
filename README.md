# Business Card Maker

A full-stack React application for creating and managing professional business cards. Supports two creation modes: a form-based template editor and a freeform canvas editor. Cards are saved to the cloud and can be printed at standard business card dimensions.

## Features

- **Google Authentication** via Firebase Auth
- **Cloud Storage** with Cloud Firestore — cards persist across devices
- **Template Editor** — fill in your details and choose from 6 professional templates with live preview
- **Canvas Editor** — drag-and-drop text, shapes, images, and QR codes on a freeform 3.5" x 2" canvas
- **Start from Template** — open any of the 6 templates in the canvas editor as a starting point
- **Front and Back** — both editors support designing the front and back of the card
- **QR Code Generation** — generate QR codes from any URL or text and place them on your card
- **3D Card Flip Preview** — interactive preview modal with drag-to-rotate
- **Print Export** — print-ready layout at 3.5" x 2" (standard business card size)
- **Undo / Snap Guides** — canvas editor includes undo history and smart alignment snapping

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Routing | React Router v7 |
| Build tool | Vite 7 |
| Styling | Vanilla CSS |
| Auth | Firebase Auth (Google OAuth 2.0) |
| Database | Cloud Firestore |
| Hosting | Vercel |

## Prerequisites

- Node.js v20.19 or v22.12+ (required by Vite 7)
- A Firebase project with Google Auth and Firestore enabled

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a project at [console.firebase.google.com](https://console.firebase.google.com), then:

1. Enable **Google** as a sign-in provider under Authentication
2. Create a **Firestore** database in production mode
3. Add these Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Copy your Firebase config into `src/firebase/config.js`:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── BusinessCard/
│   │   ├── BusinessCard.jsx      # Template card renderer
│   │   ├── CardBack.jsx          # Card back renderer
│   │   ├── CardFlipModal.jsx     # 3D interactive preview modal
│   │   └── templates.js          # Template definitions and styles
│   ├── Canvas/
│   │   └── CanvasPreview.jsx     # Read-only canvas card renderer
│   └── Shared/
│       ├── ConfirmLeaveModal.jsx  # Unsaved changes guard
│       ├── ExportPanel.jsx        # Print/export logic
│       ├── Navbar.jsx
│       └── SaveStatus.jsx
├── context/
│   └── AuthContext.jsx            # Firebase auth state
├── firebase/
│   └── config.js                  # Firebase initialization
├── hooks/
│   ├── useBusinessCards.js        # Firestore CRUD
│   └── useDebounce.js
├── pages/
│   ├── Landing.jsx                # Hero and template gallery
│   ├── Dashboard.jsx              # Saved cards management
│   ├── Editor.jsx                 # Form-based template editor
│   └── CanvasEditor.jsx           # Freeform canvas editor
└── App.jsx                        # Router and protected routes
```

## Templates

| Name | Style |
|------|-------|
| Modern Professional | Dark background, blue accents |
| Minimal Clean | White, black and grey |
| Bold Gradient | Dark with amber/red accents |
| Elegant Dark | Dark with gold accents |
| Tech Blue | Dark, teal, monospace font |
| Creative Colorful | Dark with pink accents |

## How to Use

### Template editor
1. Sign in with Google
2. Click **New Card** on the dashboard
3. Select a template and fill in your details
4. Customize colors if desired
5. Save — the card appears on your dashboard
6. Open the card to print or view the 3D flip preview

### Canvas editor
1. Click **Custom Canvas** on the dashboard
2. Choose **Blank Canvas** or pick a template as a starting point
3. Add text, shapes, images, or QR codes from the toolbar
4. Drag to move, use the blue handle to resize, double-click text to edit
5. Use Ctrl+Z to undo, Backspace to delete the selected element
6. Switch between Front and Back tabs to design both sides
7. Save and print from the dashboard

## Security

- Firestore rules enforce per-user data isolation
- Google OAuth handles authentication — no passwords stored
- Firebase config keys are client-safe (restricted by domain in the Firebase console)
