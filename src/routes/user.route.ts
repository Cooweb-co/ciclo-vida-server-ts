import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express + TypeScript!' });
});

router.get('/echo', (req: Request, res: Response) => {
  const q = req.query.q || null;
  res.json({ echo: q });
});

export default router;
