import { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import './ExportPanel.css';

const ExportPanel = () => {
  const { formData } = useBuilder();
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.productName || 'My Landing Page'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #f1f5f9;
      background: #1a1d27;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .hero {
      text-align: center;
      padding: 4rem 0;
    }

    .business-name {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 1.5rem;
      color: #3b82f6;
      font-weight: 600;
      display: inline-block;
      padding: 0.5rem 1.25rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 20px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .product-name {
      font-size: 3.5rem;
      font-weight: 800;
      margin: 1.5rem 0;
      line-height: 1.1;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .tagline {
      font-size: 1.35rem;
      margin: 1.5rem auto;
      color: #94a3b8;
      max-width: 600px;
      line-height: 1.6;
    }

    .price {
      font-size: 3rem;
      font-weight: 800;
      margin: 2rem 0;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 12px;
      border: 2px solid #334155;
    }

    .product-image {
      margin: 3rem 0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
    }

    .product-image img {
      width: 100%;
      height: auto;
      display: block;
    }

    .section {
      background: #12141a;
      padding: 2.5rem;
      margin: 2rem 0;
      border-radius: 16px;
      border: 1px solid #1e293b;
    }

    .section h2 {
      font-size: 1.875rem;
      margin-bottom: 1.5rem;
      color: #f1f5f9;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section h2::before {
      content: '';
      width: 4px;
      height: 28px;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      border-radius: 2px;
    }

    .section p {
      font-size: 1.125rem;
      line-height: 1.8;
      color: #94a3b8;
    }

    .features-list {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 1rem;
    }

    .features-list li {
      padding: 1rem 1.25rem;
      padding-left: 3rem;
      position: relative;
      font-size: 1.125rem;
      color: #94a3b8;
      background: #1a1d27;
      border-radius: 10px;
      border: 1px solid #1e293b;
    }

    .features-list li::before {
      content: "✓";
      position: absolute;
      left: 1rem;
      color: #3b82f6;
      font-weight: bold;
      font-size: 1.25rem;
      width: 28px;
      height: 28px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contact-section {
      text-align: center;
    }

    .contact-button {
      display: inline-block;
      padding: 1.125rem 2.5rem;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1.125rem;
      margin-top: 1rem;
      transition: transform 0.3s ease;
    }

    .contact-button:hover {
      transform: translateY(-3px);
    }

    .footer {
      text-align: center;
      padding: 3rem 0 1rem;
      margin-top: 4rem;
      color: #64748b;
      font-size: 0.875rem;
      border-top: 1px solid #1e293b;
    }

    @media (max-width: 768px) {
      .product-name {
        font-size: 2.5rem;
      }
      .container {
        padding: 2rem 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      ${formData.businessName ? `<div class="business-name">${formData.businessName}</div>` : ''}
      <h1 class="product-name">${formData.productName || 'Your Product'}</h1>
      ${formData.tagline ? `<p class="tagline">${formData.tagline}</p>` : ''}
      ${formData.price ? `<div class="price">${formData.price}</div>` : ''}
    </div>

    ${formData.imageUrl ? `
    <div class="product-image">
      <img src="${formData.imageUrl}" alt="${formData.productName || 'Product'}">
    </div>
    ` : ''}

    ${formData.description ? `
    <div class="section">
      <h2>About This Product</h2>
      <p>${formData.description}</p>
    </div>
    ` : ''}

    ${formData.features.some(f => f) ? `
    <div class="section">
      <h2>Key Features</h2>
      <ul class="features-list">
        ${formData.features.filter(f => f).map(feature => `<li>${feature}</li>`).join('\n        ')}
      </ul>
    </div>
    ` : ''}

    ${formData.contactEmail ? `
    <div class="section contact-section">
      <h2>Get In Touch</h2>
      <a href="mailto:${formData.contactEmail}" class="contact-button">Contact Us</a>
    </div>
    ` : ''}

    <div class="footer">
      <p>Built with Landing Page Builder</p>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownload = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.productName || 'landing-page'}.html`.toLowerCase().replace(/\s+/g, '-');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleCopyHTML = async () => {
    const html = generateHTML();
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenPreview = () => {
    const html = generateHTML();
    const newWindow = window.open();
    newWindow.document.write(html);
    newWindow.document.close();
  };

  return (
    <div className="export-panel">
      <h3>Export Your Landing Page</h3>
      <div className="export-buttons">
        <button onClick={handleDownload} className="export-btn primary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 13L10 3M10 13L7 10M10 13L13 10M3 17L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {exported ? 'Downloaded!' : 'Download HTML'}
        </button>

        <button onClick={handleCopyHTML} className="export-btn secondary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 7V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V12C17 13.1046 16.1046 14 15 14H12M5 8H11C12.1046 8 13 8.89543 13 10V16C13 17.1046 12.1046 18 11 18H5C3.89543 18 3 17.1046 3 16V10C3 8.89543 3.89543 8 5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {copied ? 'Copied!' : 'Copy HTML'}
        </button>

        <button onClick={handleOpenPreview} className="export-btn secondary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 6.5C7.23858 6.5 4.76408 8.11395 3 10.5C4.76408 12.886 7.23858 14.5 10 14.5C12.7614 14.5 15.2359 12.886 17 10.5C15.2359 8.11395 12.7614 6.5 10 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 12.5C11.1046 12.5 12 11.6046 12 10.5C12 9.39543 11.1046 8.5 10 8.5C8.89543 8.5 8 9.39543 8 10.5C8 11.6046 8.89543 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Preview
        </button>
      </div>

      <div className="export-info">
        <p>💡 Download creates a standalone HTML file you can host anywhere</p>
      </div>
    </div>
  );
};

export default ExportPanel;
