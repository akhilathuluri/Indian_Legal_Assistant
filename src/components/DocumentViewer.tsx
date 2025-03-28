import React from 'react';
import { X } from 'lucide-react';
import type { DocumentResult } from '../types/indianKanoon';

interface Props {
  document: DocumentResult;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-4">
        <div className="sticky top-0 bg-white p-4 border-b z-10 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 pr-8" 
              dangerouslySetInnerHTML={{ __html: document.title }} />
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="prose max-w-none text-gray-800 leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: document.doc }} />
          </div>
          
          {(document.citeList?.length > 0 || document.citedbyList?.length > 0) && (
            <div className="mt-8 pt-6 border-t">
              {document.citeList?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Citations</h3>
                  <ul className="space-y-2 text-gray-700">
                    {document.citeList.map(cite => (
                      <li 
                        key={cite.tid} 
                        className="pl-4 border-l-2 border-indigo-200 hover:border-indigo-500 transition-colors"
                        dangerouslySetInnerHTML={{ __html: cite.title }} 
                      />
                    ))}
                  </ul>
                </div>
              )}
              
              {document.citedbyList?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Cited By</h3>
                  <ul className="space-y-2 text-gray-700">
                    {document.citedbyList.map(cite => (
                      <li 
                        key={cite.tid}
                        className="pl-4 border-l-2 border-indigo-200 hover:border-indigo-500 transition-colors"
                        dangerouslySetInnerHTML={{ __html: cite.title }}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
