import { SearchFilters, SearchResult, DocumentResult } from '../types/indianKanoon';

const API_BASE_URL = '/api';

export const searchCases = async (
  query: string,
  pageNum: number = 0,
  filters: SearchFilters = {},
  maxcites: number = 5
): Promise<SearchResult> => {
  const params = new URLSearchParams({
    formInput: query,
    pagenum: pageNum.toString(),
    maxcites: maxcites.toString(),
    ...filters
  });

  try {
    const response = await fetch(`${API_BASE_URL}/search?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `Server error: ${response.status}`
      );
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.docs)) {
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error) {
    console.error('Search error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch search results');
  }
};

export const getDocument = async (
  docId: string,
  maxcites: number = 5,
  maxcitedby: number = 5
): Promise<DocumentResult> => {
  const params = new URLSearchParams({
    maxcites: maxcites.toString(),
    maxcitedby: maxcitedby.toString()
  });

  try {
    const response = await fetch(`${API_BASE_URL}/doc/${docId}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch document (${response.status})`);
    }
    
    return data;
  } catch (error) {
    console.error('Document fetch error:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch document');
  }
};
