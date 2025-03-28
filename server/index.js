import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const API_BASE_URL = 'https://api.indiankanoon.org';
const API_TOKEN = process.env.VITE_INDIANKANOON_API_TOKEN;

const validateResponse = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format');
  }
  return true;
};

app.post('/api/search', async (req, res) => {
  try {
    console.log('Search request params:', req.query);
    
    if (!API_TOKEN) {
      return res.status(500).json({ error: 'API token not configured' });
    }

    const response = await axios({
      method: 'post', // Changed to POST
      url: `${API_BASE_URL}/search/`,
      params: {
        formInput: req.query.formInput,
        pagenum: req.query.pagenum || '0',
        maxcites: req.query.maxcites || '5'
      },
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache'
      }
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    validateResponse(response.data);

    // Format response according to API structure
    const formattedResponse = {
      docs: response.data?.docs || [],
      categories: response.data?.categories || [],
      found: response.data?.found || 0,
      encodedformInput: req.query.formInput
    };

    console.log('Formatted response:', formattedResponse);
    res.json(formattedResponse);
  } catch (error) {
    console.error('Search API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });

    res.status(error.response?.status || 500).json({
      error: error.message || 'Failed to fetch search results',
      details: error.response?.data
    });
  }
});

app.post('/api/doc/:docId', async (req, res) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/doc/${req.params.docId}/`,
      params: req.query,
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache'
      }
    });

    res.json({
      doc: response.data.doc,
      tid: req.params.docId,
      title: response.data.title,
      citeList: response.data.citeList || [],
      citedbyList: response.data.citedbyList || []
    });
  } catch (error) {
    console.error('Document API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
