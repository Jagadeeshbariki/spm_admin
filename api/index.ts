import app from '../server';

// Add a direct route here to bypass any issues in server.ts if they exist
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', message: 'API index is alive' });
});

export default app;
