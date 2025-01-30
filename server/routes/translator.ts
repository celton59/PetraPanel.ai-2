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
async function extractAudio(videoPath: string): Promise<string> {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  const audioPath = videoPath.replace('.mp4', '_audio.mp3');
  const videoData = await readFile(videoPath);

  ffmpeg.writeFile('input.mp4', videoData);
  await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output.mp3']);

  const data = await ffmpeg.readFile('output.mp3');
  await writeFile(audioPath, data);

  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp3');

  return audioPath;
}

// Función para separar voz usando Lalal.ai
async function separateVoice(audioPath: string): Promise<{vocals: string, instrumental: string}> {
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

  const vocalsPath = audioPath.replace('_audio.mp3', '_vocals.mp3');
  const instrumentalPath = audioPath.replace('_audio.mp3', '_instrumental.mp3');

  await writeFile(vocalsPath, response.data.vocals);
  await writeFile(instrumentalPath, response.data.instrumental);

  return { vocals: vocalsPath, instrumental: instrumentalPath };
}

// Función para clonar voz usando ElevenLabs
async function cloneVoice(voicePath: string): Promise<string> {
  const voiceData = await readFile(voicePath);
  const formData = new FormData();
  formData.append('name', 'Cloned Voice');
  formData.append('files', new Blob([voiceData]), 'voice.mp3');

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

  return response.data.voice_id;
}

// Función para transcribir usando AssemblyAI
async function transcribeAudio(audioPath: string): Promise<string> {
  const audioFile = await readFile(audioPath);
  const formData = new FormData();
  formData.append('audio', new Blob([audioFile]), 'audio.mp3');

  const response = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    formData,
    {
      headers: {
        "Authorization": process.env.ASSEMBLYAI_API_KEY,
      },
    }
  );

  return response.data.text;
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
    status: 'uploaded'
  });
});

// Ruta para extraer audio
router.post("/:videoId/extract-audio", async (req, res) => {
  const { videoId } = req.params;
  const videoPath = path.join("uploads", `${videoId}.mp4`);

  try {
    const audioPath = await extractAudio(videoPath);
    res.json({ 
      status: 'audio_extracted',
      audioPath: path.basename(audioPath)
    });
  } catch (error) {
    console.error("Error extracting audio:", error);
    res.status(500).json({ error: "Error al extraer el audio" });
  }
});

// Ruta para separar voz
router.post("/:videoId/separate-voice", async (req, res) => {
  const { videoId } = req.params;
  const audioPath = path.join("uploads", `${videoId}_audio.mp3`);

  try {
    const { vocals, instrumental } = await separateVoice(audioPath);
    res.json({ 
      status: 'voice_separated',
      vocals: path.basename(vocals),
      instrumental: path.basename(instrumental)
    });
  } catch (error) {
    console.error("Error separating voice:", error);
    res.status(500).json({ error: "Error al separar la voz" });
  }
});

// Ruta para clonar voz
router.post("/:videoId/clone-voice", async (req, res) => {
  const { videoId } = req.params;
  const vocalsPath = path.join("uploads", `${videoId}_vocals.mp3`);

  try {
    const voiceId = await cloneVoice(vocalsPath);
    res.json({ 
      status: 'voice_cloned',
      voiceId 
    });
  } catch (error) {
    console.error("Error cloning voice:", error);
    res.status(500).json({ error: "Error al clonar la voz" });
  }
});

// Ruta para transcribir
router.post("/:videoId/transcribe", async (req, res) => {
  const { videoId } = req.params;
  const vocalsPath = path.join("uploads", `${videoId}_vocals.mp3`);

  try {
    const text = await transcribeAudio(vocalsPath);
    res.json({ 
      status: 'transcribed',
      text 
    });
  } catch (error) {
    console.error("Error transcribing:", error);
    res.status(500).json({ error: "Error al transcribir el audio" });
  }
});

// Ruta para traducir
router.post("/:videoId/translate", async (req, res) => {
    const { videoId } = req.params;
    const { text } = req.body;
    const targetLanguage = "es"; // Spanish

    try {
        const translatedText = await translateText(text, targetLanguage);
        res.json({ status: 'translated', translatedText });
    } catch (error) {
        console.error("Error translating:", error);
        res.status(500).json({ error: "Error al traducir el texto" });
    }
});


export default router;