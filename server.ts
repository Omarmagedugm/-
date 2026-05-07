import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI Client Lazy Init
let aiClient: GoogleGenerativeAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is missing');
    }
    aiClient = new GoogleGenerativeAI(key);
  }
  return aiClient;
}

// Firebase Admin initialization
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: admin.firestore.Firestore | null = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    admin.initializeApp({
      projectId: config.projectId,
    });
    
    // Support custom database ID if available in firebase-admin v11+
    if (config.firestoreDatabaseId) {
      db = admin.firestore(config.firestoreDatabaseId);
    } else {
      db = admin.firestore();
    }
    console.log('Firebase Admin initialized successfully');
  } catch (err) {
    console.error('Error initializing Firebase Admin:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Multer setup for memory storage
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Cloudinary Initialization
  const initCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary credentials missing. Uploads will fail.');
      return false;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    return true;
  };

  initCloudinary();

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/ai/process', async (req: any, res: any) => {
    try {
      const { userImage, jerseyImage, logoImage, prompt, model } = req.body;
      
      if (!userImage || !jerseyImage) {
        return res.status(400).json({ error: 'Missing required images' });
      }

      const ai = getAI();
      const aiModel = ai.getGenerativeModel({ model: model || 'gemini-3.1-flash-image-preview' });

      const aiParts: any[] = [
        { text: "Customer Image (Identity to preserve):" },
        { inlineData: { data: userImage, mimeType: 'image/jpeg' } },
        { text: "Target Jersey to Wear:" },
        { inlineData: { data: jerseyImage, mimeType: 'image/jpeg' } }
      ];

      if (logoImage) {
        aiParts.push({ text: "Official Club Logo (Brand Reference):" });
        aiParts.push({ inlineData: { data: logoImage, mimeType: 'image/jpeg' } });
      }

      aiParts.push({ text: prompt });

      const result = await aiModel.generateContent(aiParts);
      const responseText = result.response.text();
      
      // Extract base64 from markdown if needed
      const base64Match = responseText.match(/data:image\/[a-zA-Z]+;base64,[^"'\s\)]+/);
      const cleanedImage = base64Match ? base64Match[0] : responseText.trim();

      res.json({ result: cleanedImage });
    } catch (error: any) {
      console.error('AI Processing error:', error);
      res.status(500).json({ 
        error: error.message || 'Internal AI error',
        details: error.response?.data || error
      });
    }
  });

  // Cloudinary Upload Endpoint (Still needed for image management)
  app.post('/api/upload', upload.single('image'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const uploadPreset = process.env.UPLOAD_PRESET || 'jerseys';
      
      // Upload to Cloudinary using buffer
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            upload_preset: uploadPreset,
            folder: 'ittehad-ai'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      res.json(result);
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
