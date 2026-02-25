import './ModernTemplate.css';

const ModernTemplate = ({ data }) => {
  const isEmpty = !data.businessName && !data.productName && !data.tagline &&
                  !data.description && !data.price && !data.imageUrl &&
                  !data.contactEmail && !data.features.some(f => f);

  if (isEmpty) {
    return (
      <div className="modern-template empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7H15M9 7V5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7M9 7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 14L11 16L15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Start Building Your Landing Page</h3>
          <p>Fill in the form on the left to see your landing page come to life in real-time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-template">
      <header className="hero-section">
        <div className="business-name">{data.businessName || 'Your Business'}</div>
        <h1 className="product-name">{data.productName || 'Your Product'}</h1>
        <p className="tagline">{data.tagline || 'Add a compelling tagline'}</p>
        {data.price && <div className="price">{data.price}</div>}
      </header>

      {data.imageUrl && (
        <div className="product-image">
          <img src={data.imageUrl} alt={data.productName || 'Product'} />
        </div>
      )}

      {data.description && (
        <section className="description-section">
          <h2>About This Product</h2>
          <p>{data.description}</p>
        </section>
      )}

      {data.features.some(f => f) && (
        <section className="features-section">
          <h2>Key Features</h2>
          <ul className="features-list">
            {data.features
              .filter(feature => feature)
              .map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
          </ul>
        </section>
      )}

      {data.contactEmail && (
        <section className="contact-section">
          <h2>Get In Touch</h2>
          <a href={`mailto:${data.contactEmail}`} className="contact-button">
            Contact Us
          </a>
        </section>
      )}

      <footer className="template-footer">
        <p>Built with Landing Page Builder</p>
      </footer>
    </div>
  );
};

export default ModernTemplate;
