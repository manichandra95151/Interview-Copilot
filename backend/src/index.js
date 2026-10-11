import 'dotenv/config';
import { env } from './config/env.js';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { attachInterviewWS } from './ws/interview.js';

import sessionRoutes   from './routes/session.js';
import questionRoutes  from './routes/question.js';
import answerRoutes    from './routes/answer.js';
import reportRoutes    from './routes/report.js';
import candidateRoutes from './routes/candidates.js';
import scheduleRoutes  from './routes/schedule.js';
import livekitRoutes   from './routes/livekit.js';

import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(globalLimiter);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/api/session',    sessionRoutes);
app.use('/api/questions',  questionRoutes);
app.use('/api/answers',    answerRoutes);
app.use('/api/report',     reportRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/schedule',   scheduleRoutes);
app.use('/api/livekit',    livekitRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
attachInterviewWS(server); // ws at /ws/interview

server.listen(env.PORT, () => {
  console.log(`\n🚀 CopilotHire API → http://localhost:${env.PORT}`);
  console.log(`🎙️  Interview WS  → ws://localhost:${env.PORT}/ws/interview\n`);
});
