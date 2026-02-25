import { useBuilder } from '../../context/BuilderContext';
import ModernTemplate from '../Templates/ModernTemplate';
import './PreviewPanel.css';

const PreviewPanel = () => {
  const { formData, selectedTemplate } = useBuilder();

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate data={formData} />;
      default:
        return <ModernTemplate data={formData} />;
    }
  };

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Live Preview</h3>
        <span className="preview-badge">Updates in real-time</span>
      </div>
      <div className="preview-container">
        {renderTemplate()}
      </div>
    </div>
  );
};

export default PreviewPanel;
