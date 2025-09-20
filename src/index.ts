import express, { Request, Response, NextFunction } from 'express';
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

// Generic error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
