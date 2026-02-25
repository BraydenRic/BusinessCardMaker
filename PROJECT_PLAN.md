# Landing Page Builder - MVP Plan

## Project Goal
A simple, polished landing page builder where users can create professional product landing pages without coding.

## MVP Features (Focus on Polish First!)

### Core Functionality
1. **Form-Based Builder**
   - Business/Product name
   - Product description
   - Price
   - Product images (URL input)
   - Contact information

2. **Live Preview**
   - Real-time preview as users type
   - Mobile-responsive preview

3. **Multiple Templates**
   - 2-3 clean, professional templates
   - Easy template switching

4. **Local Storage**
   - Auto-save drafts
   - Load previous work

5. **Share/Export**
   - Generate a unique URL/view
   - Copyable shareable link

## React Concepts to Demonstrate
- **State Management**: Form data, template selection, preview mode
- **Custom Hooks**: `useLocalStorage`, `useForm`, `useDebounce`
- **Component Composition**: Builder, Preview, TemplateSelector
- **Context API**: Theme/template context
- **Performance**: Debounced inputs, memoization

## File Structure
```
src/
├── components/
│   ├── Builder/
│   │   ├── BuilderForm.jsx
│   │   ├── FormSection.jsx
│   │   └── ImageUpload.jsx
│   ├── Preview/
│   │   ├── PreviewPanel.jsx
│   │   └── TemplateRenderer.jsx
│   ├── Templates/
│   │   ├── ModernTemplate.jsx
│   │   ├── MinimalTemplate.jsx
│   │   └── BoldTemplate.jsx
│   └── Shared/
│       ├── TemplateSelector.jsx
│       └── ShareModal.jsx
├── hooks/
│   ├── useLocalStorage.js
│   ├── useForm.js
│   └── useDebounce.js
├── context/
│   └── BuilderContext.jsx
├── utils/
│   └── validation.js
└── App.jsx
```

## Phase 1: MVP ✅ COMPLETE!
- ✅ Set up Vite + React
- ✅ Create professional dark-themed layout (Builder + Preview side-by-side)
- ✅ Implement form with state management (Context API + custom hooks)
- ✅ Build modern template with animations
- ✅ Add live preview with real-time updates
- ✅ Implement local storage with auto-save
- ✅ Polish UI/UX with smooth animations and micro-interactions
- ✅ **Export functionality** (Download HTML, Copy HTML, Preview)
- ✅ Sample data loading
- ✅ Reset functionality
- ✅ Save status indicator
- ✅ Empty state handling

## Export Features (Completed!)
- ✅ **Download HTML**: Creates standalone file that works anywhere
- ✅ **Copy to Clipboard**: Easy sharing of HTML code
- ✅ **Preview in New Tab**: See final result before export
- ✅ Self-contained with inline CSS
- ✅ Mobile responsive export

## Authentication Decision
**For MVP: NO AUTH** ✅
- Keeps project simple and focused (professor's recommendation)
- Local storage works perfectly for single-user experience
- No backend/database needed
- Faster development, better for learning React fundamentals

## Phase 2: Future Enhancements (After MVP)
- Authentication system (user accounts)
- Backend integration (save multiple pages to database)
- Shareable public URLs
- Drag-and-drop image upload (vs URL input)
- More templates (Minimal, Bold, Clean, etc.)
- Color/theme customization
- Custom domain mapping
- Team collaboration features
