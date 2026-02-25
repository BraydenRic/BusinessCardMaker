# Getting Started - Business Card Maker

## Overview

A full-stack React application for creating, customizing, and saving professional business cards. Built with React, Firebase (Auth + Firestore), and Vite.

## Running Locally

```bash
npm install
npm run dev
```

Requires Node.js 20+ or 22+.

## Pages

- `/` — Landing page with template gallery and sign-in
- `/dashboard` — View, edit, print, and delete your saved cards
- `/editor` — Create or edit a business card with live preview

## Features

- Google OAuth sign-in via Firebase Auth
- 6 professional card templates (Modern, Minimal, Bold, Elegant, Tech, Creative)
- Customizable card back with logo upload, tagline, and background color
- Real-time front/back preview in the editor
- 3D interactive card preview on the dashboard (drag to rotate, click to flip)
- Save cards to Firestore (per-user, private data)
- Print-ready export in standard 3.5" x 2" format
- Fully responsive, deployed to Vercel

## Project Structure

```
src/
  components/
    BusinessCard/   # Card renderer, templates, CardBack, CardFlipModal
    Shared/         # Navbar, particles, export panel
  pages/            # Landing, Dashboard, Editor
  context/          # AuthContext
  hooks/            # useBusinessCards (Firestore CRUD)
  firebase/         # config.js
```

## Deployment

Deployed to Vercel at businesscardmaker.shop. Vercel handles routing via `vercel.json` (SPA rewrites). Domain DNS managed via Vercel nameservers.
