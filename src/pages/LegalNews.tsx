import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Newspaper, ChevronLeft, ChevronRight, Loader2, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewsItem {
  id: number;
  title: string;
  text: string;
  summary: string;
  url: string;
  image: string;
  publish_date: string;
  authors: string[];
  category: string;
  source_country: string;
}

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsItem;
}

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, news }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">{news.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {news.image && (
            <img 
              src={news.image} 
              alt={news.title} 
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{news.text}</p>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  {news.authors?.length > 0 && (
                    <p>By {news.authors.join(', ')}</p>
                  )}
                  <p>Published: {new Date(news.publish_date).toLocaleDateString()}</p>
                </div>
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                >
                  Read full article
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LegalNews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchNews();
  }, [user, navigate, currentPage]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.worldnewsapi.com/search-news?api-key=${import.meta.env.VITE_WORLDNEWS_API_KEY}&source-countries=in&text=legal+law+court+justice&language=en&number=9&offset=${(currentPage - 1) * 9}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure we have news array, default to empty if not
      setNews(data.news || []);
      // Set total pages, default to 1 if not available
      setTotalPages(Math.ceil((data.available || 9) / 9) || 1);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
      setNews([]); // Set empty array on error
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Newspaper className="h-8 w-8 text-indigo-600 mr-3" />
            Legal & Political News
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (news && news.length > 0) ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        {item.category}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(item.publish_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {item.summary || item.text}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedNews(item);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Read more →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 border rounded-md bg-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Newspaper className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No news found</h3>
          </div>
        )}
      </div>

      {selectedNews && (
        <NewsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          news={selectedNews}
        />
      )}
    </div>
  );
}
