import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin initialization
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    const app = getApps().length === 0 
      ? initializeApp({ projectId: config.projectId })
      : getApp();
    
    // Support custom database ID if available
    db = getFirestore(app, config.firestoreDatabaseId || '(default)');
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

  // Serve robots.txt and llms.txt as plain text explicitly
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.type('text/plain').sendFile(robotsPath);
    } else {
      res.type('text/plain').send("User-agent: *\nAllow: /\n");
    }
  });

  app.get('/llms.txt', (req, res) => {
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    if (fs.existsSync(llmsPath)) {
      res.type('text/plain; charset=utf-8').sendFile(llmsPath);
    } else {
      res.status(404).type('text/plain').send('Not found');
    }
  });

  app.post('/api/users/sync-auth', async (req: any, res: any) => {
    try {
      if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
      }
      const adminApp = getApps()[0];
      if (!adminApp) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
      }
      const authInstance = getAuth(adminApp);
      
      const authUsers: any[] = [];
      let nextPageToken: string | undefined = undefined;
      
      do {
        const listUsersResult = await authInstance.listUsers(1000, nextPageToken);
        authUsers.push(...listUsersResult.users);
        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken);
      
      console.log(`Fetched ${authUsers.length} users from Firebase Auth`);

      const usersColl = db.collection('users');
      const snapshot = await usersColl.get();
      const existingUids = new Set<string>();
      snapshot.forEach((doc: any) => {
        existingUids.add(doc.id);
      });

      let createdCount = 0;
      let currentBatch = db.batch();
      let batchSize = 0;

      for (const authUser of authUsers) {
        if (!existingUids.has(authUser.uid)) {
          const docRef = usersColl.doc(authUser.uid);
          const name = authUser.displayName || authUser.email?.split('@')[0] || 'عضو غير معروف';
          
          const userData = {
            uid: authUser.uid,
            name: name,
            email: authUser.email || '',
            role: 'user',
            tier: 'new',
            joinDate: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            lastActive: authUser.metadata.lastSignInTime ? new Date(authUser.metadata.lastSignInTime).toISOString() : new Date().toISOString(),
            createdAt: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime).toISOString() : new Date().toISOString()
          };
          
          currentBatch.set(docRef, userData);
          batchSize++;
          createdCount++;

          if (batchSize >= 400) {
            await currentBatch.commit();
            currentBatch = db.batch();
            batchSize = 0;
          }
        }
      }

      if (batchSize > 0) {
        await currentBatch.commit();
      }

      res.json({
        success: true,
        authUserCount: authUsers.length,
        firestoreUserCountBefore: existingUids.size,
        createdCount,
        totalNow: existingUids.size + createdCount
      });
    } catch (error: any) {
      console.error('Error syncing auth users with firestore:', error);
      res.status(500).json({ error: error.message || 'Synchronization failed' });
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
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('Serving static files from:', distPath);
    } else {
      console.error('DIST folder not found! Build may have failed.');
      app.get('*all', (req, res) => {
        res.status(500).send('Application is building or failed to build. Please check logs.');
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
