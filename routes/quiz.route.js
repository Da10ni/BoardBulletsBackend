import express from "express";
import { addCategory, addQuestion } from "../controllers/quiz-controller.js";

const router = express.Router();

router.post("/add-question", addQuestion);

// 2. Category Add API (Screen 2)
router.put("/add-category/:questionId", addCategory);

export default router;
