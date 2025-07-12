// server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createWorker } from "tesseract.js";
import { uploadImageToImgbb } from "./utils.js";

// Setup
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.static(path.join(__dirname, "..")));
app.use(express.static(__dirname));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Upload base64 image and return hosted URL
app.post("/api/upload", async (req, res) => {
  const image = req.body.image;
  if (!image) return res.status(400).json({ error: "No image provided" });

  try {
    const url = await uploadImageToImgbb(image);
    res.json({ url: url.data.url });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// OCR + Match route
app.get("/api/vision", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ error: "No image URL provided" });

  try {
    // Download image
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // OCR using tesseract.js
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();

    const ocrText = data.text;
    console.debug("OCR Text:", ocrText);

    // Load medicines.json
    const medicinesPath = path.join(__dirname, "..", "medicines.json");
    if (!fs.existsSync(medicinesPath)) {
      return res.status(500).json({ error: "medicines.json not found" });
    }

    const medicines = JSON.parse(fs.readFileSync(medicinesPath, "utf-8"));

    // Create a map of lowercase name => full object
    const targetMap = new Map(
      medicines.map((item) => [item.name.toLowerCase(), item])
    );

    // Extract words from OCR
    const wordsInImage = new Set(ocrText.toLowerCase().match(/\b[a-z]+\b/g) || []);

    // Match with medicine names
    const matchedMedicines = [...wordsInImage]
      .filter(word => targetMap.has(word))
      .map(word => targetMap.get(word));

    res.json({
      matchFound: matchedMedicines.length > 0,
      matchedMedicines,
      ocrText
    });

  } catch (err) {
    console.error("OCR Error:", err);
    res.status(500).json({ error: "OCR processing failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
