import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  app.use(express.json({ limit: '10mb' }));

  // AI Generation Endpoint
  app.post('/api/ai/jersey-tryon', async (req: any, res: any) => {
    try {
      const { userImageBase64, jerseyImageBase64 } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is missing on server' });
      }

      const genAIModule = await import('@google/genai');
      const genAI = new (genAIModule.GoogleGenAI as any)(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Merge these two images into one professional portrait.
STRICT INSTRUCTIONS:
1. Use the person's face from the first image EXACTLY. Maintain their identity, hair, and facial features 100%.
2. Dress them in the Al Ittihad Alexandria club jersey shown in the second image. The jersey must look like it's realistically worn by the person.
3. Place the person in a cinematic, highly detailed "Al Ittihad Alexandria" supporter's room in Alexandria, Egypt. 
4. Include green and white club colors, flags, and a scarf with "Unionawy" or "Itthad" branding in the background.
5. Lighting should be professional studio lighting, 8k resolution, photorealistic.`;

      const result = await model.generateContent([
        { inlineData: { data: userImageBase64, mimeType: 'image/jpeg' } },
        { inlineData: { data: jerseyImageBase64, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]);

      const response = await result.response;
      const imagePart = response.candidates?.[0]?.content.parts.find(p => p.inlineData);
      
      if (imagePart?.inlineData) {
        res.json({ image: `data:image/jpeg;base64,${imagePart.inlineData.data}` });
      } else {
        res.status(500).json({ error: 'AI failed to generate an image' });
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      res.status(500).json({ error: error.message || 'AI processing failed' });
    }
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

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
