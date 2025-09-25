import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/config.js';
import { db } from './utils/database.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  constructor() {
    this.app = express();
    this.port = config.port;
    
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeDatabase() {
    await db.connect();
  }

  initializeMiddlewares() {
    // CORS
    this.app.use(cors({
      origin: config.clientUrl,
      credentials: true,
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Serve static files in production
    if (config.nodeEnv === 'production') {
      this.app.use(express.static(path.join(__dirname, '../../frontend/dist')));
      
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
      });
    }
  }

  initializeErrorHandling() {
    this.app.use(notFound);
    this.app.use(errorHandler);
  }

  start() {
    this.app.listen(this.port, () => {
      console.log('🚀 Event Management Backend Server Started');
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`📍 Port: ${this.port}`);
      console.log(`📍 Client URL: ${config.clientUrl}`);
      console.log(`📍 Database: ${config.databaseUrl ? 'Connected' : 'Not configured'}`);
      console.log('📚 API Documentation: http://localhost:5000/api/health');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await db.disconnect();
      process.exit(0);
    });
  }
}

// Create and start the application
const app = new App();
app.start();

export default app.app;