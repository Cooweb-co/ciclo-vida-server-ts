import express, { Request, Response, NextFunction } from 'express';

import exampleRouter from './routes/user.route';
import reviewRouter from './routes/review.route';
import recyclerRouter from './routes/recycler.route';
import locationRouter from './routes/location.route';
import transportRouter from './routes/transport.route';
import creditsRouter from './routes/credits.route';
import userRouter from './routes/user.route';
import appointmentRouter from './routes/appointment.route';


const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/appointments', appointmentRouter);

// Review routes
app.use('/api', reviewRouter);

// Recycler routes
app.use('/api', recyclerRouter);

// Location routes
app.use('/api', locationRouter);

// Transport routes
app.use('/api', transportRouter);

// Credits and Coupons routes
app.use('/api', creditsRouter);

// Generic error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
