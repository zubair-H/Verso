import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
console.log("Loaded key:", process.env.GEMINI_API_KEY);


const app = express();
const upload = multer();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64")
        }
      },
      {
        text: `
        Analyze this image and describe general visual attributes.
        Do NOT identify the person.
        Respond ONLY in structured JSON.
        `
      }
    ]);

    let responseText = result.response.text();

    // Remove markdown formatting if present
    responseText = responseText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
    parsed = JSON.parse(responseText);
    } catch (e) {
    return res.status(500).json({ error: "Failed to parse AI response", raw: responseText });
    }

    res.json(parsed);


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
