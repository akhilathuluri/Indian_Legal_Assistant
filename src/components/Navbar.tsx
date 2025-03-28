import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Audio Transcription', href: '/transcription' },
    { name: 'Document Analysis', href: '/documents' },
    { name: 'Case Law', href: '/case-law' },
    { name: 'Legal Analysis', href: '/legal-analysis' },
    { name: 'Legal Code', href: '/legal-code' },
    { name: 'Legal News', href: '/legal-news' },
    { name: 'Legal Flowcharts', href: '/legal-flowcharts' },
    { name: 'Crime Data', href: '/crime-data' },
    { name: 'Settings', href: '/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Scale className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LegalAI</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:ml-6">
            <div className="flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="ml-4">
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-4 text-sm text-gray-500 hover:text-gray-700"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`${
                location.pathname === item.href
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              } block px-3 py-2 text-base font-medium`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        {user ? (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-3">
              <button
                onClick={() => {
                  handleSignOut();
                  setIsOpen(false);
                }}
                className="block text-base text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-3">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-base text-gray-500 hover:text-gray-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}