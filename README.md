# Business Card Maker

A professional, full-stack React application for creating and managing stunning business cards. Features Google authentication, cloud storage, 6 unique templates, and print-ready exports with a sleek dark theme.

## ✨ Features

### Core Functionality
- **Google Authentication**: Secure sign-in with Firebase Auth
- **Cloud Storage**: Save unlimited business cards to Firestore
- **6 Professional Templates**: Modern, Minimal, Bold, Elegant, Tech, and Creative designs
- **Real-time Preview**: See changes instantly as you customize
- **Print Ready**: Export in standard 3.5" × 2" format
- **Dark Theme**: Eye-friendly professional design with smooth animations

### User Experience
- **Landing Page**: Beautiful template gallery with live previews
- **Dashboard**: Manage all your saved business cards
- **Editor**: Intuitive form-based customization with live preview
- **Mobile Responsive**: Works perfectly on all devices
- **Smooth Animations**: Carefully crafted micro-interactions

## 🚀 React & Full-Stack Concepts

This project demonstrates:

- **Authentication**: Firebase Auth with Google OAuth
- **Database Integration**: Firestore for CRUD operations
- **Custom Hooks**: `useBusinessCards`, `useAuth`
- **Context API**: Global auth state management
- **React Router**: Multi-page navigation
- **Component Composition**: Reusable, modular design
- **State Management**: Complex form handling
- **Async Operations**: Loading states, error handling

## 📋 Prerequisites

1. **Node.js** (v16+)
2. **Firebase Account** (free tier works)
3. **Google Account** (for testing auth)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Follow the detailed instructions in `FIREBASE_SETUP.md`:

1. Create a Firebase project
2. Enable Google Authentication
3. Create Firestore database
4. Copy your config to `src/firebase/config.js`

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   └── BusinessCard/        # Card templates and rendering
├── context/
│   └── AuthContext.jsx      # Firebase auth state
├── firebase/
│   └── config.js            # Firebase configuration
├── hooks/
│   └── useBusinessCards.js  # Firestore CRUD operations
├── pages/
│   ├── Landing.jsx          # Template gallery & hero
│   ├── Dashboard.jsx        # Manage saved cards
│   └── Editor.jsx           # Create/edit cards
└── App.jsx                  # Router setup
```

## 🎨 Available Templates

1. **Modern Professional** - Gradient accents, clean layout
2. **Minimal Clean** - Black & white simplicity
3. **Bold Gradient** - Eye-catching colors
4. **Elegant Dark** - Sophisticated gold accents
5. **Tech Blue** - Developer-friendly monospace
6. **Creative Colorful** - Playful and artistic

## 🔐 Security

- Firestore rules restrict users to their own data
- Google OAuth for secure authentication
- No API keys exposed in client code

## 📱 How to Use

1. **Sign In**: Click "Sign in with Google" on landing page
2. **Choose Template**: Browse and select from 6 templates
3. **Customize**: Fill in your information in the editor
4. **Save**: Store to your Firebase account
5. **Print**: Export print-ready cards anytime
6. **Manage**: View, edit, or delete from dashboard

## 🖨️ Printing Your Cards

1. Open a saved card from dashboard
2. Click "Print" button
3. Print settings:
   - Paper size: Letter (8.5" × 11")
   - Margins: None
   - Scale: 100%
   - Multiple cards per page supported

## 🌐 Technologies

- **Frontend**: React 19, React Router
- **Build Tool**: Vite 7
- **Styling**: CSS3 (vanilla, no frameworks)
- **Backend**: Firebase (Auth + Firestore)
- **Authentication**: Google OAuth 2.0
- **Database**: Cloud Firestore

## 🎓 Learning Outcomes

This project teaches:
- Full-stack React development
- Firebase integration
- OAuth authentication flows
- NoSQL database design
- CRUD operations
- Secure client-side apps
- Modern React patterns (hooks, context, router)

## 🚧 Future Enhancements

- [ ] QR code generation
- [ ] Multiple card designs per user
- [ ] Export as PDF
- [ ] Batch printing
- [ ] Team collaboration
- [ ] Custom color themes
- [ ] Image upload for logos
- [ ] Social media links
