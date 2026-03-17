import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config, validateEnv } from './config';
import { initWebSocket } from './websocket';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import invitationRoutes from './routes/invitations';
import developerRoutes from './routes/developers';
import webhookRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';

// Validate environment
validateEnv();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Error Handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server + WebSocket ───────────────────────────────────────
const server = createServer(app);
initWebSocket(server);

server.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🚀  PM Platform Server                        ║
  ║   📡  REST:  http://localhost:${config.port}/api     ║
  ║   🔌  WS:    ws://localhost:${config.port}/ws        ║
  ║   🌍  ENV:   ${config.nodeEnv.padEnd(33)}║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

export default app;
