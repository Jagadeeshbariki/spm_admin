import app from '../server.js';

// Minimal health check that runs before any complex logic
app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'The backend is alive and responding on Vercel.' 
  });
});

export default app;
