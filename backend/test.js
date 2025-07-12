// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWorker } from "tesseract.js";
import { uploadImageToImgbb } from "./utils.js";

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Load .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.static(path.join(__dirname, "..")));  // For index.html
app.use(express.static(__dirname));                   // For anything else local

// Serve frontend page
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "about.html"));
});

// Upload image to imgbb
app.post("/api/upload", async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    const response = await uploadImageToImgbb(image);
    if (response && response.data && response.data.url) {
      res.json({ url: response.data.url });
    } else {
      throw new Error("Image upload failed");
    }
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Run OCR and match medicines
app.get("/api/vision/:image", async (req, res) => {
  const imageUrl = decodeURIComponent(req.params.image);
  console.debug("Running OCR for:", imageUrl);

  try {
    const worker = await createWorker("eng");
    const result = await worker.recognize(imageUrl);
    await worker.terminate();

    const ocrText = result.data.text || "";
    const wordsInText = new Set(
      ocrText.toLowerCase().match(/\b[a-z]+\b/g) || []
    );

    const jsonPath = path.join(__dirname, "..", "medicines.json");
    const medicines = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const targetWords = new Set(
      medicines.map((item) => item.name.toLowerCase())
    );

    const matchedWords = [...wordsInText].filter(word =>
      targetWords.has(word)
    );

    res.json({ matchedWords });
  } catch (err) {
    console.error("OCR/Matching error:", err);
    res.status(500).json({ error: "OCR failed: " + err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Server running at http://localhost:${PORT}`);
});
