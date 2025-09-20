import express, { Request, Response, NextFunction } from 'express';
import exampleRouter from './routes/user.route';
import reviewRouter from './routes/review.route';
import recyclerRouter from './routes/recycler.route';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Example routes
app.use('/api', exampleRouter);

// Review routes
app.use('/api', reviewRouter);

// Recycler routes
app.use('/api', recyclerRouter);

// Generic error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
