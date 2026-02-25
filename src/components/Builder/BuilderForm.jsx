import { useBuilder } from '../../context/BuilderContext';
import './BuilderForm.css';

const BuilderForm = () => {
  const { formData, updateField, updateFeature, resetForm, setFormData } = useBuilder();

  const loadSampleData = () => {
    setFormData({
      businessName: 'TechVision Co.',
      productName: 'CloudSync Pro',
      tagline: 'Seamless cloud synchronization for modern teams',
      description: 'CloudSync Pro revolutionizes the way teams collaborate by providing instant, secure file synchronization across all devices. Experience lightning-fast speeds, military-grade encryption, and intuitive collaboration tools that keep your team in perfect sync.',
      price: '$29/month',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      contactEmail: 'hello@techvision.co',
      features: [
        'Real-time sync across unlimited devices',
        'End-to-end encryption for enterprise security',
        'Collaborative workspace with version control'
      ]
    });
  };

  return (
    <div className="builder-form">
      <div className="form-header">
        <h2>Build Your Landing Page</h2>
        <div className="header-buttons">
          <button className="sample-button" onClick={loadSampleData} title="Load sample data">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V8L11 11M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sample
          </button>
          <button className="reset-button" onClick={resetForm} title="Reset all fields">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C9.84771 2 11.5161 2.84771 12.5962 4.18359M12.5962 4.18359V2M12.5962 4.18359H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reset
          </button>
        </div>
      </div>

      <div className="form-section">
        <label htmlFor="businessName">Business Name</label>
        <input
          type="text"
          id="businessName"
          value={formData.businessName}
          onChange={(e) => updateField('businessName', e.target.value)}
          placeholder="e.g., Acme Products"
        />
      </div>

      <div className="form-section">
        <label htmlFor="productName">Product Name</label>
        <input
          type="text"
          id="productName"
          value={formData.productName}
          onChange={(e) => updateField('productName', e.target.value)}
          placeholder="e.g., Premium Widget"
        />
      </div>

      <div className="form-section">
        <label htmlFor="tagline">Tagline</label>
        <input
          type="text"
          id="tagline"
          value={formData.tagline}
          onChange={(e) => updateField('tagline', e.target.value)}
          placeholder="e.g., The best widget for your needs"
        />
      </div>

      <div className="form-section">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe your product in detail..."
          rows="5"
        />
      </div>

      <div className="form-section">
        <label htmlFor="price">Price</label>
        <input
          type="text"
          id="price"
          value={formData.price}
          onChange={(e) => updateField('price', e.target.value)}
          placeholder="e.g., $99.99"
        />
      </div>

      <div className="form-section">
        <label htmlFor="imageUrl">Product Image URL</label>
        <input
          type="url"
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => updateField('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        {formData.imageUrl && (
          <div className="image-preview">
            <img src={formData.imageUrl} alt="Preview" />
          </div>
        )}
      </div>

      <div className="form-section">
        <label>Key Features (up to 3)</label>
        {formData.features.map((feature, index) => (
          <input
            key={index}
            type="text"
            value={feature}
            onChange={(e) => updateFeature(index, e.target.value)}
            placeholder={`Feature ${index + 1}`}
          />
        ))}
      </div>

      <div className="form-section">
        <label htmlFor="contactEmail">Contact Email</label>
        <input
          type="email"
          id="contactEmail"
          value={formData.contactEmail}
          onChange={(e) => updateField('contactEmail', e.target.value)}
          placeholder="contact@example.com"
        />
      </div>
    </div>
  );
};

export default BuilderForm;
