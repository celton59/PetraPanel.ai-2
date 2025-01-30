import { Router } from "express";
import multer from "multer";
import path from "path";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import axios from "axios";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const router = Router();

// Configurar multer para la subida de archivos
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Función para extraer audio usando FFmpeg
async function extractAudio(videoPath: string, audioPath: string) {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  const videoData = await readFile(videoPath);
  ffmpeg.writeFile('input.mp4', videoData);

  await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output.mp3']);
  const data = await ffmpeg.readFile('output.mp3');
  await writeFile(audioPath, data);

  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp3');
}

// Función para separar voz usando Lalal.ai
async function separateVoice(audioPath: string) {
  const formData = new FormData();
  const audioFile = await readFile(audioPath);
  const blob = new Blob([audioFile], { type: 'audio/mpeg' });
  formData.append('audio', blob, 'audio.mp3');

  const response = await axios.post("https://api.lalal.ai/process", formData, {
    headers: {
      "Authorization": `Bearer ${process.env.LALAAI_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

// Función para clonar voz usando ElevenLabs
async function cloneVoice(voicePath: string) {
  const voiceData = await readFile(voicePath);
  const blob = new Blob([voiceData], { type: 'audio/mpeg' });
  const formData = new FormData();
  formData.append('name', 'Cloned Voice');
  formData.append('files', blob, 'voice.mp3');

  const response = await axios.post(
    "https://api.elevenlabs.io/v1/voices/add",
    formData,
    {
      headers: {
        "Authorization": `Bearer ${process.env.ELEVENLABS_API_KEY}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

// Función para transcribir usando AssemblyAI
async function transcribeAudio(audioUrl: string) {
  const response = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    {
      audio_url: audioUrl,
    },
    {
      headers: {
        "Authorization": process.env.ASSEMBLYAI_API_KEY,
      },
    }
  );

  return response.data;
}

// Función para traducir usando OpenAI
async function translateText(text: string, targetLanguage: string) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Translate the following text to ${targetLanguage}. Maintain the same tone and style.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    },
    {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}

// Ruta para subir video
router.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  res.json({
    videoId: path.basename(req.file.path, path.extname(req.file.path)),
  });
});

// Ruta para iniciar la traducción
router.get("/:videoId/translate", async (req, res) => {
  const { videoId } = req.params;
  const videoPath = path.join("uploads", `${videoId}.mp4`);

  // Configurar SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendProgress = (step: string, progress: number) => {
    res.write(`data: ${JSON.stringify({ step, progress })}\n\n`);
  };

  try {
    // Extraer audio
    const audioPath = path.join("uploads", `${videoId}_audio.mp3`);
    sendProgress("extracting_audio", 0);
    await extractAudio(videoPath, audioPath);
    sendProgress("extracting_audio", 100);

    // Separar voz
    sendProgress("separating_voice", 0);
    const { vocals, accompaniment } = await separateVoice(audioPath);
    sendProgress("separating_voice", 100);

    // Clonar voz
    sendProgress("cloning_voice", 0);
    const { voice_id } = await cloneVoice(vocals);
    sendProgress("cloning_voice", 100);

    // Transcribir
    sendProgress("transcribing", 0);
    const { text } = await transcribeAudio(vocals);
    sendProgress("transcribing", 100);

    // Traducir
    sendProgress("translating", 0);
    const translatedText = await translateText(text, "Spanish"); // Por ahora hardcoded a español
    sendProgress("translating", 100);

    // Unir todo
    sendProgress("merging", 0);
    // TODO: Implementar la unión del video con el audio traducido
    sendProgress("merging", 100);

    // Completado
    res.write(`data: ${JSON.stringify({ step: "completed", progress: 100 })}\n\n`);
    res.end();

    // Limpiar archivos temporales
    await Promise.all([
      unlink(videoPath),
      unlink(audioPath),
      unlink(vocals),
      unlink(accompaniment),
    ]);
  } catch (error) {
    console.error("Error durante la traducción:", error);
    res.write(`data: ${JSON.stringify({ error: "Error durante la traducción" })}\n\n`);
    res.end();
  }
});

export default router;