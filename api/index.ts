import app from '../server';

// Set Vercel serverless function max duration to 60 seconds (maximum for Hobby tier)
export const maxDuration = 60;

export default app;
