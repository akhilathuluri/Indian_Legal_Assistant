import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Search, Filter, Book } from 'lucide-react';
import { searchCases, getDocument } from '../services/indianKanoon';
import type { SearchResult, DocumentResult, SearchFilters } from '../types/indianKanoon';
import DocumentViewer from '../components/DocumentViewer';
import toast from 'react-hot-toast';

export default function CaseLaw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSearch = async (page: number = 0) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const searchResults = await searchCases(searchQuery, page, filters);
      console.log('Search results:', searchResults);
      
      if (!searchResults.docs?.length) {
        toast.info('No results found for your search');
        return;
      }

      setResults([searchResults]);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentView = async (docId: string) => {
    setIsLoading(true);
    try {
      const doc = await getDocument(docId);
      setSelectedDoc(doc);
    } catch (error: any) {
      console.error('Document fetch error:', error);
      toast.error(error.message || 'Failed to fetch document');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Book className="h-8 w-8 text-indigo-600 mr-3" />
          Case Law Research
        </h1>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6">
            {results[0].docs.map((doc) => (
              <div
                key={doc.tid}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {doc.docsource}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(doc.publishdate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2"
                      dangerouslySetInnerHTML={{ __html: doc.title }} />
                  
                  <div className="text-gray-600 mb-4 line-clamp-3"
                       dangerouslySetInnerHTML={{ __html: doc.headline }} />

                  <div className="flex items-center justify-between">
                    {doc.author && (
                      <span className="text-sm text-gray-500">
                        Author: {doc.author}
                      </span>
                    )}
                    <button
                      onClick={() => handleDocumentView(doc.tid)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Read more →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDoc && (
          <DocumentViewer
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </div>
    </div>
  );
}