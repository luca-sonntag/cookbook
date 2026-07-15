import { Link, Route, Routes } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import DataDeletionPage from './pages/DataDeletionPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LegalPage from './pages/LegalPage';
import TermsPage from './pages/TermsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans transition-colors dark:bg-gray-950 dark:text-gray-100">
      <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/icon-192.png" alt="Snagbite Logo" className="w-6 h-6 mr-2 rounded-md" />
            <span className="font-bold text-inherit text-xl">Snagbite</span>
          </Link>
          <nav className="hidden sm:flex gap-4">
            <Link to="/privacy" className="text-sm hover:text-emerald-500 transition-colors">Datenschutz</Link>
            <Link to="/legal" className="text-sm hover:text-emerald-500 transition-colors">Impressum</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/delete-data" element={<DataDeletionPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </main>

      <footer className="w-full p-6 flex flex-col items-center text-sm text-gray-500 gap-2 text-center mt-auto border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-4 flex-wrap justify-center max-w-md">
          <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Datenschutzerklärung</Link>
          <Link to="/legal" className="hover:text-gray-900 dark:hover:text-white transition-colors">Impressum</Link>
          <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">AGB</Link>
          <Link to="/delete-data" className="hover:text-gray-900 dark:hover:text-white transition-colors">Daten löschen</Link>
        </div>
        <p>© {new Date().getFullYear()} Snagbite. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  );
}
