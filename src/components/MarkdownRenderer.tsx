import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem'}} {...props} />,
          h2: ({node, ...props}) => <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '0.75rem'}} {...props} />,
          h3: ({node, ...props}) => <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.5rem'}} {...props} />,
          h4: ({node, ...props}) => <h4 style={{fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem'}} {...props} />,
          p: ({node, ...props}) => <p style={{color: '#4B5563', marginBottom: '1rem'}} {...props} />,
          ul: ({node, ...props}) => <ul style={{listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem'}} {...props} />,
          ol: ({node, ...props}) => <ol style={{listStyle: 'decimal', paddingLeft: '1.5rem', marginBottom: '1rem'}} {...props} />,
          li: ({node, ...props}) => <li style={{color: '#4B5563', marginBottom: '0.25rem'}} {...props} />,
          strong: ({node, ...props}) => <strong style={{fontWeight: '600', color: '#111827'}} {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote 
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: '#6366F1',
                paddingLeft: '1rem',
                fontStyle: 'italic',
                margin: '1rem 0'
              }} 
              {...props} 
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
