/**
 * error.js — central error handling.
 * Logs full detail server-side but returns a generic message to the client in
 * production so stack traces and internals are never leaked.
 */
import { isProd } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  // Always log full error server-side.
  console.error(`[error] ${req.method} ${req.originalUrl} →`, err);

  const message =
    status < 500
      ? err.message || 'Request error'
      : isProd
        ? 'Internal server error'
        : err.message || 'Internal server error';

  res.status(status).json({ error: message });
}
