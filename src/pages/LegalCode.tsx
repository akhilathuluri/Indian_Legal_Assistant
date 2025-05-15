import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Book, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SectionModal from '../components/SectionModal';

interface Section {
  section_number: string;  // Will use IPC Section
  chapter: string;        // Will use BNS Section as chapter reference
  section_title: string;  // Will use IPC Heading
  content: string;        // Will use IPC Descriptions
  bns_heading?: string;   // Optional BNS Heading
  bns_description?: string; // Optional BNS description
}

const ITEMS_PER_PAGE = 12;

export default function LegalCode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchSections();
  }, [user, navigate]);

  const fetchSections = async () => {
    try {
      console.log('Fetching sections...'); 

      const { count, error: countError } = await supabase
        .from('sections')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Count error:', countError);
        throw countError;
      }

      const { data, error } = await supabase
        .from('sections')
        .select(`
          "IPC Section",
          "BNS Section",
          "IPC Heading",
          "IPC Descriptions",
          "BNS Heading",
          "BNS description"
        `)
        .order('"IPC Section"');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        const transformedData: Section[] = data.map(item => ({
          section_number: item['IPC Section'] || '',
          chapter: item['BNS Section'] || '',
          section_title: item['IPC Heading'] || '',
          content: item['IPC Descriptions'] || '',
          bns_heading: item['BNS Heading'],
          bns_description: item['BNS description']
        }));

        setSections(transformedData);
        setFilteredSections(transformedData);
        setTotalPages(Math.ceil(transformedData.length / ITEMS_PER_PAGE));
      }
    } catch (error: any) {
      console.error('Error details:', error);
      toast.error('Failed to load legal sections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = sections.filter(section =>
        section.section_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.section_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.bns_heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.bns_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSections(filtered);
      setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
      setCurrentPage(1);
    } else {
      setFilteredSections(sections);
      setTotalPages(Math.ceil(sections.length / ITEMS_PER_PAGE));
    }
  }, [searchQuery, sections]);

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSections.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Book className="h-8 w-8 text-indigo-600 mr-3" />
            IPC Code Sections
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search sections, chapters, or content..."
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Book className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or clear the search to see all sections.
            </p>
          </div>
        ) : (
          <>
            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {getCurrentPageItems().map((section) => (
                <div
                  key={section.section_number}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-100 rounded-full px-3 py-1">
                        <span className="text-sm font-medium text-indigo-800">
                          Section {section.section_number}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full px-3 py-1">
                        <span className="text-sm font-medium text-gray-800">
                          Chapter {section.chapter}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {section.section_title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-4">
                      {section.content}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedSection(section);
                        setIsModalOpen(true);
                      }}
                      className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Read more →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredSections.length)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredSections.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{filteredSections.length}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNumber
                              ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {selectedSection && (
        <SectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          section={selectedSection}
        />
      )}
    </div>
  );
}
