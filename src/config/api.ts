// Centralized API configuration
// When deploying the persistent backend to Render or Railway, set VITE_API_URL
// in Vercel project environment variables (e.g. https://your-backend.onrender.com).
// For local development or Vercel rewrites, it defaults to relative '/api'.
const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const API_BASE = rawBase ? `${rawBase}/api` : '/api';
