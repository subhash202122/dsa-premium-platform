import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();

router.put('/', requireAuth, async (request, response) => {
  const completedTopics = Array.isArray(request.body.completedTopics)
    ? [...new Set(request.body.completedTopics.map(String))].slice(0, 200)
    : null;
  const quizAttempts = Number(request.body.quizAttempts);
  if (!completedTopics || !Number.isInteger(quizAttempts) || quizAttempts < 0) {
    return response.status(400).json({ message: 'Invalid progress data' });
  }
  const user = await User.findByIdAndUpdate(
    request.user.id,
    { $set: { 'progress.completedTopics': completedTopics, 'progress.quizAttempts': quizAttempts } },
    { new: true }
  );
  response.json({ progress: user.progress });
});

export default router;
