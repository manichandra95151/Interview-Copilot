import 'dotenv/config';
import { env } from './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import sessionRoutes  from './routes/session.js';
import questionRoutes from './routes/question.js';
import answerRoutes   from './routes/answer.js';
import reportRoutes   from './routes/report.js';

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

app.use('/api/session',   sessionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers',   answerRoutes);
app.use('/api/report',    reportRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => console.log(`\n🚀 CopilotHire API → http://localhost:${env.PORT}\n`));
