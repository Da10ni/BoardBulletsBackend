// // FINAL PATTERN-BASED CONTROLLER

// import { Quiz } from "../models/quizModel.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const generateOptionsWithGemini = async (question) => {
//   try {
//     console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
//     console.log("API Key length:", process.env.GEMINI_API_KEY?.length);

//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     const prompt = `Create 4 multiple choice options for: ${question}

// Reply ONLY in this format: option1|option2|option3|option4|correctIndex

// Make the first option the correct answer for now:
// correctAnswer|wrongOption1|wrongOption2|wrongOption3|0

// Question: ${question}
// Your reply:`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text().trim();

//     console.log("Gemini Response:", text);

//     // Parse simple format
//     let cleanText = text;
//     cleanText = cleanText.replace(/Question:.*?\n/gi, "");
//     cleanText = cleanText.replace(/Answer:\s*/gi, "");
//     cleanText = cleanText.replace(/Reply format:.*?\n/gi, "");
//     cleanText = cleanText.replace(/Your reply:\s*/gi, "");
//     cleanText = cleanText.replace(/Example:.*?\n/gi, "");

//     const lines = cleanText.split("\n");
//     let targetLine = "";

//     for (let line of lines) {
//       if (line.includes("|") && line.split("|").length >= 5) {
//         targetLine = line.trim();
//         break;
//       }
//     }

//     console.log("Cleaned line:", targetLine);

//     const parts = targetLine.split("|");
//     if (parts.length >= 5) {
//       const options = parts.slice(0, 4).map((opt) => opt.trim());
//       const originalCorrectIndex = parseInt(parts[4].trim()) || 0;
//       const correctText = options[originalCorrectIndex];

//       // GET DATABASE COUNT FOR PATTERN
//       const totalQuestions = await Quiz.countDocuments();
//       const targetCorrectIndex = totalQuestions % 4;

//       console.log(`📊 Database count: ${totalQuestions}`);
//       console.log(`🎯 Target index: ${targetCorrectIndex}`);
//       console.log(`Original correct: ${originalCorrectIndex} (${correctText})`);

//       // REARRANGE OPTIONS: Place correct answer at target position
//       const newOptions = ["", "", "", ""];
//       const wrongOptions = options.filter(
//         (_, index) => index !== originalCorrectIndex
//       );

//       // Place correct answer at target position
//       newOptions[targetCorrectIndex] = correctText;

//       // Fill remaining positions with wrong answers
//       let wrongIndex = 0;
//       for (let i = 0; i < 4; i++) {
//         if (i !== targetCorrectIndex) {
//           newOptions[i] = wrongOptions[wrongIndex];
//           wrongIndex++;
//         }
//       }

//       console.log(`✅ Rearranged options:`, newOptions);
//       console.log(
//         `✅ Correct "${correctText}" now at index ${targetCorrectIndex}`
//       );

//       return {
//         options: newOptions,
//         correctAnswer: targetCorrectIndex,
//       };
//     }

//     console.log("Parsing failed, using smart fallback");
//     return await getSmartFallback(question);
//   } catch (error) {
//     console.error("Gemini Error:", error.message);
//     console.log("🔄 Using fallback due to Gemini error");
//     return await getSmartFallback(question);
//   }
// };

// // Smart fallback with pattern logic
// const getSmartFallback = async (question) => {
//   const q = question.toLowerCase();

//   // GET DATABASE COUNT FOR PATTERN
//   const totalQuestions = await Quiz.countDocuments();
//   const targetCorrectIndex = totalQuestions % 4;

//   console.log(
//     `🔄 FALLBACK: Pattern index ${targetCorrectIndex} based on ${totalQuestions} questions`
//   );

//   // Generate options based on question
//   let correctAnswer = "";
//   let wrongOptions = [];

//   if (q.includes("capital")) {
//     if (q.includes("pakistan")) {
//       correctAnswer = "Islamabad";
//       wrongOptions = ["Karachi", "Lahore", "Peshawar"];
//     } else if (q.includes("india")) {
//       correctAnswer = "New Delhi";
//       wrongOptions = ["Mumbai", "Kolkata", "Chennai"];
//     } else if (q.includes("france")) {
//       correctAnswer = "Paris";
//       wrongOptions = ["Lyon", "Marseille", "Nice"];
//     } else if (q.includes("germany")) {
//       correctAnswer = "Berlin";
//       wrongOptions = ["Munich", "Hamburg", "Frankfurt"];
//     } else if (q.includes("japan")) {
//       correctAnswer = "Tokyo";
//       wrongOptions = ["Osaka", "Kyoto", "Yokohama"];
//     } else {
//       correctAnswer = "Capital City";
//       wrongOptions = ["City A", "City B", "City C"];
//     }
//   } else if (q.includes("largest planet")) {
//     correctAnswer = "Jupiter";
//     wrongOptions = ["Saturn", "Earth", "Mars"];
//   } else if (q.includes("smallest planet")) {
//     correctAnswer = "Mercury";
//     wrongOptions = ["Venus", "Mars", "Earth"];
//   } else if (q.includes("telephone") || q.includes("phone")) {
//     correctAnswer = "Alexander Graham Bell";
//     wrongOptions = ["Thomas Edison", "Nikola Tesla", "Benjamin Franklin"];
//   } else if (q.includes("moon") && q.includes("first")) {
//     correctAnswer = "Neil Armstrong";
//     wrongOptions = ["Buzz Aldrin", "Yuri Gagarin", "John Glenn"];
//   } else if (q.includes("shakespeare") || q.includes("romeo")) {
//     correctAnswer = "William Shakespeare";
//     wrongOptions = ["Christopher Marlowe", "John Milton", "Edmund Spenser"];
//   } else if (q.includes("2+2") || q.includes("2 + 2")) {
//     correctAnswer = "4";
//     wrongOptions = ["3", "5", "6"];
//   } else if (q.includes("5*5") || q.includes("5 * 5")) {
//     correctAnswer = "25";
//     wrongOptions = ["20", "30", "15"];
//   } else {
//     correctAnswer = "Correct Answer";
//     wrongOptions = ["Wrong Option 1", "Wrong Option 2", "Wrong Option 3"];
//   }

//   // ARRANGE OPTIONS: Place correct answer at target position
//   const finalOptions = ["", "", "", ""];
//   finalOptions[targetCorrectIndex] = correctAnswer;

//   // Fill remaining positions
//   let wrongIndex = 0;
//   for (let i = 0; i < 4; i++) {
//     if (i !== targetCorrectIndex) {
//       finalOptions[i] = wrongOptions[wrongIndex];
//       wrongIndex++;
//     }
//   }

//   console.log(
//     `🔄 FALLBACK RESULT: "${correctAnswer}" at index ${targetCorrectIndex}`
//   );
//   console.log(`🔄 FALLBACK OPTIONS:`, finalOptions);

//   return {
//     options: finalOptions,
//     correctAnswer: targetCorrectIndex,
//   };
// };

// const addQuestion = async (req, res) => {
//   try {
//     const { userId, question } = req.body;

//     if (!userId || !question) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID and question are required",
//       });
//     }

//     console.log("\n=== PROCESSING NEW QUESTION ===");
//     console.log("Question:", question);

//     const aiResponse = await generateOptionsWithGemini(question);

//     console.log("Final AI Response:", aiResponse);
//     console.log("=== END PROCESSING ===\n");

//     // Create new question
//     const newQuestion = new Quiz({
//       userId: userId,
//       question: question,
//       options: aiResponse.options,
//       correctAnswer: aiResponse.correctAnswer,
//       category: null,
//       subCategory: null,
//     });

//     const savedQuestion = await newQuestion.save();

//     res.status(201).json({
//       success: true,
//       message: "Question added successfully with AI-generated options",
//       data: {
//         questionId: savedQuestion._id,
//         question: savedQuestion.question,
//         options: savedQuestion.options,
//         correctAnswer: savedQuestion.correctAnswer,
//         correctAnswerText: savedQuestion.options[savedQuestion.correctAnswer],
//       },
//     });
//   } catch (error) {
//     console.error("Error adding question:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// const addCategory = async (req, res) => {
//   try {
//     const { questionId } = req.params;
//     const { category, subCategory } = req.body;

//     if (!category || !subCategory) {
//       return res.status(400).json({
//         success: false,
//         message: "Category and sub-category are required",
//       });
//     }

//     const updatedQuestion = await Quiz.findByIdAndUpdate(
//       questionId,
//       {
//         category: category,
//         subCategory: subCategory,
//       },
//       { new: true }
//     );

//     if (!updatedQuestion) {
//       return res.status(404).json({
//         success: false,
//         message: "Question not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Category and sub-category added successfully",
//       data: {
//         questionId: updatedQuestion._id,
//         question: updatedQuestion.question,
//         category: updatedQuestion.category,
//         subCategory: updatedQuestion.subCategory,
//         options: updatedQuestion.options,
//         correctAnswer: updatedQuestion.correctAnswer,
//         correctAnswerText:
//           updatedQuestion.options[updatedQuestion.correctAnswer],
//       },
//     });
//   } catch (error) {
//     console.error("Error updating category:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// export { addQuestion, addCategory };

import { Quiz } from "../models/quizModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Shuffle helper
const shuffleOptions = (options) => {
  const correctOption = options[0]; // Assume first is correct
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  const correctIndex = shuffled.findIndex(opt => opt === correctOption);
  return {
    options: shuffled,
    correctAnswer: correctIndex,
    correctOption: correctOption
  };
};

// Gemini-based generator
const generateOptionsWithGemini = async (question) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a strict multiple-choice question generator.
Create 4 options for the following question:
- The FIRST option must be the correct answer.
- Others are plausible wrong answers.
- Return the response in this format ONLY (no extra text):

correctAnswer|wrongOption1|wrongOption2|wrongOption3|0

Example:
Asia|Africa|Europe|Australia|0

Question: ${question}
Your reply:
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim();

  console.log("📩 Gemini raw response:", text);

  const cleaned = text
    .split("\n")
    .find(line => line.includes('|') && line.split('|').length === 5);

  if (!cleaned) {
    throw new Error("Gemini response did not match expected format.");
  }

  const parts = cleaned.split('|').map(p => p.trim());
  if (parts.length !== 5 || !/^[0-3]$/.test(parts[4])) {
    throw new Error("Gemini response format is invalid.");
  }

  const options = parts.slice(0, 4);
  return shuffleOptions(options);
};

// Add question
const addQuestion = async (req, res) => {
  
  try {
    console.log("✅ Received Request:", JSON.stringify(req.body, null, 2));
    const { userId, question } = req.body;

    console.log("📥 Received request with:");
    console.log("   ➤ userId:", userId);
    console.log("   ➤ question:", question);

    if (!userId || !question) {
      return res.status(400).json({
        success: false,
        message: "User ID and question are required",
      });
    }

    console.log("\n🚀 Generating options with Gemini...");
    const ai = await generateOptionsWithGemini(question);
    console.log("🤖 Gemini response:", ai);

    // Defensive check
    if (!ai || !Array.isArray(ai.options) || ai.correctAnswer === undefined) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from Gemini",
        error: ai,
      });
    }

    const newQuestion = new Quiz({
      userId,
      question,
      options: ai.options,
      correctAnswer: ai.correctAnswer,
      correctOption: ai.correctOption,
      category: null,
      subCategory: null,
    });

    const saved = await newQuestion.save();

    console.log("✅ Question saved to DB:", saved._id);

    res.status(201).json({
      success: true,
      message: "Question added successfully with AI-generated options",
      data: {
        questionId: saved._id,
        question: saved.question,
        options: saved.options,
        correctAnswerIndex: saved.correctAnswer,
        correctAnswer: saved.correctOption,
      },
    });

  } catch (error) {
    console.error("❌ Error in addQuestion:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate options. Gemini may have returned invalid format.",
      error: error.message,
    });
  }
};


// Add category
const addCategory = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { category, subCategory } = req.body;

    if (!category || !subCategory) {
      return res.status(400).json({
        success: false,
        message: "Category and sub-category are required",
      });
    }

    const updatedQuestion = await Quiz.findByIdAndUpdate(
      questionId,
      { category, subCategory },
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
        correctAnswerIndex: updatedQuestion.correctAnswer,
        correctAnswer: updatedQuestion.correctOption,
      },
    });

  } catch (error) {
    console.error("❌ Error updating category:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export { addQuestion, addCategory };
