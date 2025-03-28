import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, FileText, Scale, BookOpen, Gavel, Book } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const features = [
    {
      title: 'Audio Transcription',
      description: 'Record and transcribe legal proceedings in multiple languages',
      icon: Mic,
      path: '/transcription'
    },
    {
      title: 'Document Analysis',
      description: 'Analyze legal documents and evidence with AI assistance',
      icon: FileText,
      path: '/documents'
    },
    {
      title: 'Case Law Research',
      description: 'Access comprehensive database of Indian case laws and judgments',
      icon: BookOpen,
      path: '/case-law'
    },
    {
      title: 'Legal Analysis',
      description: 'Comprehensive case analysis using AI with multiple inputs',
      icon: Gavel,
      path: '/legal-analysis'
    },
    {
      title: 'Legal Code',
      description: 'Comprehensive IPC Sections and other legal codes Analysis',
      icon: Book,
      path: '/legal-code'
    }
  ];

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="text-center">
        <Scale className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" />
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
          Welcome to Indian Legal Assistant
        </h1>
        <p className="mt-4 text-base sm:text-lg text-gray-500">
          Your comprehensive platform for legal research, analysis, and documentation
        </p>
      </div>

      <div className="mt-8 sm:mt-12 lg:mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                onClick={() => navigate(feature.path)}
                className="relative group bg-white p-4 sm:p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}