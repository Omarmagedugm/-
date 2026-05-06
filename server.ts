import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Gemini AI Initialization
  const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
  const ai = geminiApiKey.length > 5 ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

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

  // Gemini AI Processing Route (Supported via two paths for compatibility)
  const handleAIProcess = async (req: any, res: any) => {
    try {
      if (!ai) {
        console.error('AI Processing Error: AI service not initialized. API Key length:', geminiApiKey?.length);
        return res.status(500).json({ 
          error: 'AI service not configured on server. Please ensure GEMINI_API_KEY is correctly set in Settings.' 
        });
      }

      const { userImageBase64, jerseyImageBase64, logoImageBase64, prompt } = req.body;

      if (!userImageBase64 || !jerseyImageBase64) {
        return res.status(400).json({ error: 'Missing required images' });
      }

      // Use gemini-3-flash-preview as per newest SDK guidance
      const aiParts: any[] = [
        { text: "Customer Image (Identity to preserve):" },
        { inlineData: { data: userImageBase64, mimeType: 'image/jpeg' } },
        { text: "Target Jersey to Wear:" },
        { inlineData: { data: jerseyImageBase64, mimeType: 'image/jpeg' } }
      ];

      if (logoImageBase64) {
        aiParts.push({ text: "Official Club Logo (Brand Reference):" });
        aiParts.push({ inlineData: { data: logoImageBase64, mimeType: 'image/jpeg' } });
      }

      aiParts.push({ text: prompt || "Replace person's shirt with the target jersey. Maintain identity." });

      console.log('Calling Gemini AI (gemini-3-flash-preview)...');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: aiParts }
      });
      let generatedImageBase64 = '';
      
      const candidates = response.candidates || [];
      if (candidates.length > 0 && candidates[0].content) {
        const parts = candidates[0].content.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            generatedImageBase64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!generatedImageBase64) {
        const text = response.text || 'No text content';
        console.error('No image returned from AI. Response text:', text);
        return res.status(500).json({ 
          error: 'AI failed to generate an image. This model may be restricted or busy. ' + (text ? `Reason: ${text.slice(0, 100)}` : 'Please try again.')
        });
      }

      res.json({ 
        imageBase64: generatedImageBase64,
        image: `data:image/jpeg;base64,${generatedImageBase64}` // Support both formats
      });
    } catch (error: any) {
      console.error('Gemini processing error:', error);
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      res.status(status).json({ error: message });
    }
  };

  app.post('/api/ai/process', handleAIProcess);
  app.post('/api/ai/jersey-tryon', handleAIProcess);

  // Cloudinary Upload Endpoint
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
