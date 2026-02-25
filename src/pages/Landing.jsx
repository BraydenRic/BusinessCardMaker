import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { templates } from '../components/BusinessCard/templates';
import BusinessCard from '../components/BusinessCard/BusinessCard';
import { defaultCardData } from '../components/BusinessCard/templates';
import SimpleParticles from '../components/Shared/SimpleParticles';
import './Landing.css';

const Landing = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
        navigate('/dashboard');
      } catch (error) {
        console.error('Sign in error:', error);
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleTemplateSelect = async (templateId) => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Sign in error:', error);
        return;
      }
    }
    navigate(`/editor?template=${templateId}`);
  };

  const sampleData = {
    name: 'John Doe',
    title: 'Senior Developer',
    company: 'Tech Solutions Inc.',
    email: 'john@techsolutions.com',
    phone: '+1 (555) 123-4567',
    website: 'www.johndoe.dev'
  };

  return (
    <div className="landing-page">
      <SimpleParticles />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Create Professional Business Cards</h1>
          <p className="hero-subtitle">
            Design, customize, and save stunning business cards with Google authentication
          </p>
          <div className="hero-buttons">
            <button onClick={handleGetStarted} className="cta-button primary">
              {user ? 'Go to Dashboard' : 'Sign in with Google'}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sample card preview */}
        <div className="hero-card-preview">
          <BusinessCard data={sampleData} templateId="modern" scale={1.2} />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose Our Card Maker?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
              </svg>
            </div>
            <h3>6 Professional Templates</h3>
            <p>Choose from modern, minimal, bold, elegant, tech, and creative designs</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3>Secure Google Auth</h3>
            <p>Sign in safely with your Google account and access your cards anywhere</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
            <h3>Save Multiple Cards</h3>
            <p>Create and save unlimited business cards for different purposes</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </div>
            <h3>Print Ready</h3>
            <p>Export print-ready cards in standard 3.5" × 2" format</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <h3>Real-time Preview</h3>
            <p>See changes instantly as you customize your business card</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h3>Easy Customization</h3>
            <p>Simple form-based editor with live preview updates</p>
          </div>
        </div>
      </section>

      {/* Templates Gallery */}
      <section className="templates-gallery">
        <h2>Choose Your Template</h2>
        <p className="gallery-subtitle">Click any template to start customizing</p>
        <div className="templates-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-item"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="template-preview">
                <BusinessCard data={sampleData} templateId={template.id} scale={0.9} />
              </div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <button className="template-select-btn">
                  Use Template →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Create Your Business Card?</h2>
        <button onClick={handleGetStarted} className="cta-button primary large">
          {user ? 'Go to Dashboard' : 'Sign in with Google to Get Started'}
        </button>
      </section>
    </div>
  );
};

export default Landing;
