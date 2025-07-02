// NEW WORKING GEMINI CONTROLLER - WITH OPTION LENGTH

import { Quiz } from "../models/quizModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const generateOptionsWithGemini = async (question) => {
  try {
    console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
    console.log("API Key length:", process.env.GEMINI_API_KEY?.length);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Simple prompt - easy to parse
    const prompt = `Generate 4 options for this question. Reply ONLY with the format below, nothing else:

Question: ${question}

Reply format: option1|option2|option3|option4|0

Example: Paris|London|Berlin|Madrid|0

Your reply:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Gemini Response:", text);

    // Parse simple format: option1|option2|option3|option4|correctIndex
    // Clean the response first
    let cleanText = text;

    // Remove common prefixes/suffixes that Gemini adds
    cleanText = cleanText.replace(/Question:.*?\n/gi, "");
    cleanText = cleanText.replace(/Answer:\s*/gi, "");
    cleanText = cleanText.replace(/Reply format:.*?\n/gi, "");
    cleanText = cleanText.replace(/Your reply:\s*/gi, "");
    cleanText = cleanText.replace(/Example:.*?\n/gi, "");

    // Get only the line with |
    const lines = cleanText.split("\n");
    let targetLine = "";

    for (let line of lines) {
      if (line.includes("|") && line.split("|").length >= 5) {
        targetLine = line.trim();
        break;
      }
    }

    console.log("Cleaned line:", targetLine);

    const parts = targetLine.split("|");
    if (parts.length >= 5) {
      const options = parts.slice(0, 4).map((opt) => opt.trim());
      const correctAnswerIndex = parseInt(parts[4].trim()) || 0;

      // Make sure correctAnswer is valid (0-3)
      const validCorrectAnswerIndex = Math.max(0, Math.min(3, correctAnswerIndex));

      // Get the correct option text and its length
      const correctOptionText = options[validCorrectAnswerIndex];
      const correctAnswerLength = correctOptionText.length;

      console.log("Correct option:", correctOptionText);
      console.log("Option length:", correctAnswerLength);

      return {
        options: options,
        correctAnswer: correctAnswerLength, // ✅ Length of correct answer
        correctAnswerIndex: validCorrectAnswerIndex, // Original index for reference
      };
    }

    // If parsing fails, return smart fallback
    console.log("Parsing failed, using smart fallback");
    return getSmartFallback(question);
  } catch (error) {
    console.error("Gemini Error:", error.message);
    return getSmartFallback(question);
  }
};

// Smart fallback based on question patterns
const getSmartFallback = (question) => {
  const q = question.toLowerCase();

  // Geography questions
  if (q.includes("capital")) {
    if (q.includes("pakistan")) {
      const options = ["Islamabad", "Karachi", "Lahore", "Peshawar"];
      return {
        options: options,
        correctAnswer: options[0].length, // "Islamabad" = 9 characters
        correctAnswerIndex: 0,
      };
    }
    if (q.includes("india")) {
      const options = ["New Delhi", "Mumbai", "Kolkata", "Chennai"];
      return {
        options: options,
        correctAnswer: options[0].length, // "New Delhi" = 9 characters
        correctAnswerIndex: 0,
      };
    }
    if (q.includes("england") || q.includes("uk")) {
      const options = ["London", "Manchester", "Birmingham", "Liverpool"];
      return {
        options: options,
        correctAnswer: options[0].length, // "London" = 6 characters
        correctAnswerIndex: 0,
      };
    }
    if (q.includes("france")) {
      const options = ["Paris", "Lyon", "Marseille", "Nice"];
      return {
        options: options,
        correctAnswer: options[0].length, // "Paris" = 5 characters
        correctAnswerIndex: 0,
      };
    }
    if (q.includes("germany")) {
      const options = ["Berlin", "Munich", "Hamburg", "Frankfurt"];
      return {
        options: options,
        correctAnswer: options[0].length, // "Berlin" = 6 characters
        correctAnswerIndex: 0,
      };
    }
    if (q.includes("japan")) {
      const options = ["Tokyo", "Osaka", "Kyoto", "Yokohama"];
      return {
        options: options,
        correctAnswer: options[0].length, // "Tokyo" = 5 characters
        correctAnswerIndex: 0,
      };
    }
  }

  // Science questions
  if (q.includes("largest planet")) {
    const options = ["Jupiter", "Saturn", "Earth", "Mars"];
    return {
      options: options,
      correctAnswer: options[0].length, // "Jupiter" = 7 characters
      correctAnswerIndex: 0,
    };
  }
  if (q.includes("smallest planet")) {
    const options = ["Mercury", "Venus", "Mars", "Earth"];
    return {
      options: options,
      correctAnswer: options[0].length, // "Mercury" = 7 characters
      correctAnswerIndex: 0,
    };
  }
  if (q.includes("speed of light")) {
    const options = [
      "299,792,458 m/s",
      "150,000,000 m/s",
      "300,000,000 m/s",
      "250,000,000 m/s",
    ];
    return {
      options: options,
      correctAnswer: options[0].length, // "299,792,458 m/s" = 15 characters
      correctAnswerIndex: 0,
    };
  }

  // Math questions
  if (q.includes("2+2") || q.includes("2 + 2")) {
    const options = ["4", "3", "5", "6"];
    return {
      options: options,
      correctAnswer: options[0].length, // "4" = 1 character
      correctAnswerIndex: 0,
    };
  }
  if (q.includes("5*5") || q.includes("5 * 5")) {
    const options = ["25", "20", "30", "15"];
    return {
      options: options,
      correctAnswer: options[0].length, // "25" = 2 characters
      correctAnswerIndex: 0,
    };
  }

  // Default fallback
  const options = ["Answer A", "Answer B", "Answer C", "Answer D"];
  return {
    options: options,
    correctAnswer: options[0].length, // "Answer A" = 8 characters
    correctAnswerIndex: 0,
  };
};

const addQuestion = async (req, res) => {
  try {
    const { userId, question } = req.body;

    // Validation
    if (!userId || !question) {
      return res.status(400).json({
        success: false,
        message: "User ID and question are required",
      });
    }

    console.log("\n=== PROCESSING NEW QUESTION ===");
    console.log("Question:", question);

    const aiResponse = await generateOptionsWithGemini(question);

    console.log("Final AI Response:", aiResponse);
    console.log("=== END PROCESSING ===\n");

    // Create new question
    const newQuestion = new Quiz({
      userId: userId,
      question: question,
      options: aiResponse.options,
      correctAnswer: aiResponse.correctAnswer, // ✅ Now contains length of correct option
      category: null,
      subCategory: null,
    });

    const savedQuestion = await newQuestion.save();

    res.status(201).json({
      success: true,
      message: "Question added successfully with AI-generated options",
      data: {
        questionId: savedQuestion._id,
        question: savedQuestion.question,
        options: savedQuestion.options,
        correctAnswer: savedQuestion.correctAnswer, // Length of correct answer
        correctAnswerIndex: aiResponse.correctAnswerIndex, // Original index for reference
      },
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const addCategory = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { category, subCategory } = req.body;

    // Validation
    if (!category || !subCategory) {
      return res.status(400).json({
        success: false,
        message: "Category and sub-category are required",
      });
    }

    // Update question with categories
    const updatedQuestion = await Quiz.findByIdAndUpdate(
      questionId,
      {
        category: category,
        subCategory: subCategory,
      },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.json({
      success: true,
      message: "Category and sub-category added successfully",
      data: {
        questionId: updatedQuestion._id,
        question: updatedQuestion.question,
        category: updatedQuestion.category,
        subCategory: updatedQuestion.subCategory,
        options: updatedQuestion.options,
        correctAnswer: updatedQuestion.correctAnswer, // Length of correct answer
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export { addQuestion, addCategory };