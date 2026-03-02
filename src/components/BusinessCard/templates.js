// Business card templates with different styles

export const templates = [
  {
    id: 'modern',
    name: 'Modern Professional',
    preview: '/templates/modern-preview.png',
    style: {
      backgroundColor: '#1a1d27',
      primaryColor: '#3b82f6',
      secondaryColor: '#60a5fa',
      textColor: '#f1f5f9',
      accentColor: '#94a3b8',
      fontFamily: "'Inter', sans-serif",
      layout: 'modern'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    preview: '/templates/minimal-preview.png',
    style: {
      backgroundColor: '#ffffff',
      primaryColor: '#000000',
      secondaryColor: '#333333',
      textColor: '#000000',
      accentColor: '#666666',
      fontFamily: "'Helvetica Neue', sans-serif",
      layout: 'minimal'
    }
  },
  {
    id: 'bold',
    name: 'Bold Gradient',
    preview: '/templates/bold-preview.png',
    style: {
      backgroundColor: '#0f172a',
      primaryColor: '#f59e0b',
      secondaryColor: '#ef4444',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      fontFamily: "'Poppins', sans-serif",
      layout: 'bold'
    }
  },
  {
    id: 'elegant',
    name: 'Elegant Dark',
    preview: '/templates/elegant-preview.png',
    style: {
      backgroundColor: '#18181b',
      primaryColor: '#d4af37',
      secondaryColor: '#c9a961',
      textColor: '#fafafa',
      accentColor: '#a1a1aa',
      fontFamily: "'Playfair Display', serif",
      layout: 'elegant'
    }
  },
  {
    id: 'tech',
    name: 'Tech Blue',
    preview: '/templates/tech-preview.png',
    style: {
      backgroundColor: '#0a192f',
      primaryColor: '#64ffda',
      secondaryColor: '#00d9ff',
      textColor: '#ccd6f6',
      accentColor: '#8892b0',
      fontFamily: "'Roboto Mono', monospace",
      layout: 'tech'
    }
  },
  {
    id: 'creative',
    name: 'Creative Colorful',
    preview: '/templates/creative-preview.png',
    style: {
      backgroundColor: '#1e1e1e',
      primaryColor: '#ff6b9d',
      secondaryColor: '#c06c84',
      textColor: '#f8f8f2',
      accentColor: '#ffc8dd',
      fontFamily: "'Montserrat', sans-serif",
      layout: 'creative'
    }
  }
];

export const defaultCardData = {
  cardLabel: '',
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  linkedIn: '',
  customFields: [],
  template: 'modern',
  backLogo: '',
  backTagline: '',
  backBgColor: '',
  backQrUrl: '',
  backQrDotColor: '',
  backQrBgColor: '',
  backQr: ''
};
