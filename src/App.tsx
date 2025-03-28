import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AudioTranscription from './pages/AudioTranscription';
import DocumentAnalysis from './pages/DocumentAnalysis';
import CaseLaw from './pages/CaseLaw';
import LegalAnalysis from './pages/LegalAnalysis';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import LegalCode from './pages/LegalCode';
import LegalFlowcharts from './pages/LegalFlowcharts';
import ChatbotButton from './components/ChatbotButton';
import LegalNews from './pages/LegalNews';
import ConnectionBanner from './components/ConnectionBanner';
import CrimeData from './pages/CrimeData';
import ConsentModal from './components/ConsentModal';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';

function AppContent() {
  const { user, hasConsent, setConsent } = useAuth();
  const [showConsentModal, setShowConsentModal] = React.useState(false);

  React.useEffect(() => {
    // Show consent modal if user is logged in but hasn't given consent
    if (user && !hasConsent) {
      setShowConsentModal(true);
    } else {
      setShowConsentModal(false);
    }
  }, [user, hasConsent]);

  const handleAcceptConsent = () => {
    setConsent(true);
    setShowConsentModal(false);
  };

  const handleDeclineConsent = () => {
    setConsent(false);
    setShowConsentModal(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        {user && <ConnectionBanner />}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/transcription" element={<AudioTranscription />} />
            <Route path="/documents" element={<DocumentAnalysis />} />
            <Route path="/case-law" element={<CaseLaw />} />
            <Route path="/legal-analysis" element={<LegalAnalysis />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/legal-code" element={<LegalCode />} />
            <Route path="/legal-flowcharts" element={<LegalFlowcharts />} />
            <Route path="/crime-data" element={<CrimeData />} />
            <Route path="/legal-news" element={<LegalNews />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </div>
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'text-sm sm:text-base'
          }}
        />
      </div>
      <ChatbotButton />
      <ConsentModal
        isOpen={showConsentModal}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppContent />
    </AuthProvider>
  );
}

export default App;