const express = require("express");
const cors = require("cors");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("edge-tts-node");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || !voice) {
      return res.status(400).json({ error: "text and voice required" });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const chunks = [];
    const readable = await tts.toStream(text);

    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => {
      const audioBuffer = Buffer.concat(chunks);
      const base64Audio = audioBuffer.toString("base64");
      res.json({
        audio: base64Audio,
        mimeType: "audio/mpeg",
      });
    });
    readable.on("error", (err) => {
      console.error("TTS stream error:", err);
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Edge TTS server running on port ${PORT}`));
