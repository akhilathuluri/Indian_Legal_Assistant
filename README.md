# Indian Legal Assistant

## Overview
Indian Legal Assistant is a comprehensive platform designed to assist legal professionals and individuals with legal research, analysis, and documentation. The application leverages modern technologies and AI to provide intelligent legal assistance across various domains of Indian law.

## System Architecture

### Tech Stack
- **Frontend**:
  - React 18 with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - React Router for navigation
  - React Hot Toast for notifications
  - PDF.js for document processing
  - React Media Recorder for audio handling
  - Google Generative AI for analysis

- **Backend**:
  - Express.js server
  - Node.js runtime
  - CORS enabled for cross-origin requests
  - Axios for HTTP requests
  - Environment variable management with dotenv

- **Database & Storage**:
  - Supabase for:
    - Authentication
    - PostgreSQL database
    - File storage
    - Real-time subscriptions

- **External APIs**:
  - Indian Kanoon API for case law
  - World News API for legal news
  - Google Generative AI for analysis

### Database Schema

#### Tables
1. **audio_transcripts**
   ```sql
   - id (uuid, primary key)
   - user_id (uuid, references auth.users)
   - name (text, unique per user)
   - audio_url (text)
   - transcript (text)
   - language (text)
   - summary (text)
   - created_at (timestamptz)
   ```

2. **documents**
   ```sql
   - id (uuid, primary key)
   - user_id (uuid, references auth.users)
   - name (text, unique per user)
   - file_url (text)
   - file_type (text)
   - extracted_text (text)
   - analysis (text)
   - created_at (timestamptz)
   ```

3. **case_analysis**
   ```sql
   - id (uuid, primary key)
   - user_id (uuid, references auth.users)
   - name (text, unique per user)
   - analysis (jsonb)
   - audio_transcript_id (uuid, optional)
   - document_id (uuid, optional)
   - created_at (timestamptz)
   ```

4. **case_searches**
   ```sql
   - id (uuid, primary key)
   - user_id (uuid, references auth.users)
   - query (text)
   - results (jsonb)
   - created_at (timestamptz)
   ```

### Security
- Row Level Security (RLS) enabled on all tables
- User-specific data access policies
- Secure file storage with user-specific buckets
- Environment variable protection
- API key management

## Core Features & Workflows

### 1. Audio Transcription
- **Workflow**:
  1. User records audio in multiple languages (English, Hindi, Telugu)
  2. Audio is processed and stored in Supabase storage
  3. Transcription is performed using browser's Speech Recognition API
  4. AI-generated summary is created using Google Generative AI
  5. Results are stored in the database

### 2. Document Analysis
- **Workflow**:
  1. User uploads PDF or text documents
  2. Document is stored in Supabase storage
  3. Text is extracted using PDF.js
  4. AI analysis is performed using Google Generative AI
  5. Results are stored with document metadata

### 3. Case Law Research
- **Workflow**:
  1. User enters search query
  2. Backend proxies request to Indian Kanoon API
  3. Results are formatted and displayed
  4. User can view detailed case information
  5. Search history is maintained

### 4. Legal Analysis
- **Workflow**:
  1. User provides case information
  2. System combines multiple inputs (documents, audio, text)
  3. AI generates comprehensive analysis
  4. Results include:
     - Case category
     - Applicable sections
     - Requirements
     - Key points
     - Similar cases
     - Summary

### 5. Legal Code Analysis
- **Workflow**:
  1. User searches for specific IPC sections
  2. System retrieves section details from database
  3. Related sections are suggested
  4. User can view full section content
  5. Search history is maintained

### 6. Legal Flowcharts
- **Workflow**:
  1. User selects predefined flowchart or creates custom
  2. AI generates interactive flowchart
  3. User can navigate through steps
  4. Flowchart adapts based on user choices
  5. Results can be saved for future reference

### 7. Crime Data Visualization
- **Workflow**:
  1. User views interactive India map
  2. Clicks on state to view statistics
  3. Data is displayed in modal
  4. Historical trends are shown
  5. Data is sourced from government databases

### 8. Legal News
- **Workflow**:
  1. System fetches latest legal news
  2. News is categorized and displayed
  3. User can view full articles
  4. News is updated periodically
  5. User can filter by category

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Supabase account
- Google AI API key
- World News API key
- Indian Kanoon API token

### Installation
1. **Clone the Repository**: 
   ```bash
   git clone <repository-url>
   cd Indian_Legal_Assistant
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_AI_KEY=your_google_ai_key
   VITE_WORLDNEWS_API_KEY=your_worldnews_api_key
   VITE_INDIANKANOON_API_TOKEN=your_indiankanoon_api_token
   ```

4. **Database Setup**:
   - Create a new Supabase project
   - Run the migration files in the `supabase/migrations` directory
   - Set up storage buckets for documents and recordings

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

6. **Build for Production**:
   ```bash
   npm run build
   ```

## Development Guidelines

### Code Structure
```
src/
├── api/          # API integration
├── components/   # React components
├── context/      # React context providers
├── data/         # Static data
├── hooks/        # Custom React hooks
├── lib/          # Utility libraries
├── pages/        # Page components
├── services/     # Service layer
├── types/        # TypeScript types
└── utils/        # Utility functions
```

### Best Practices
- Follow TypeScript strict mode
- Use functional components with hooks
- Implement proper error handling
- Write unit tests for critical functions
- Document complex logic
- Follow React best practices
- Use proper security measures

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
