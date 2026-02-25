import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const BuilderContext = createContext();

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilder must be used within BuilderProvider');
  }
  return context;
};

export const BuilderProvider = ({ children }) => {
  // Form data state - persisted in localStorage
  const [formData, setFormData] = useLocalStorage('landing-page-data', {
    businessName: '',
    productName: '',
    tagline: '',
    description: '',
    price: '',
    imageUrl: '',
    contactEmail: '',
    features: ['', '', '']
  });

  // Selected template
  const [selectedTemplate, setSelectedTemplate] = useLocalStorage('selected-template', 'modern');

  // Update individual form fields
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update feature at specific index
  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  // Reset all data
  const resetForm = () => {
    setFormData({
      businessName: '',
      productName: '',
      tagline: '',
      description: '',
      price: '',
      imageUrl: '',
      contactEmail: '',
      features: ['', '', '']
    });
  };

  const value = {
    formData,
    setFormData,
    updateField,
    updateFeature,
    resetForm,
    selectedTemplate,
    setSelectedTemplate
  };

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
};
