import { Router } from "express";
import multer from "multer";
import path from "path";
import axios from "axios";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import { spawn } from "child_process";
import crypto from "crypto";

const execAsync = promisify(exec);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const router = Router();

// Configurar multer para la subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Función para extraer audio usando FFmpeg del sistema
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^/.]+$/, '') + '_audio.mp3';

  console.log('Extracting audio from:', videoPath);
  console.log('Output audio path:', audioPath);

  try {
    // Verificar que FFmpeg está instalado
    await execAsync('ffmpeg -version').catch(() => {
      throw new Error('FFmpeg no está instalado en el sistema');
    });

    // Verificar que el archivo de video existe
    if (!fs.existsSync(videoPath)) {
      throw new Error(`El archivo de video no existe: ${videoPath}`);
    }

    const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}"`;
    console.log('Executing command:', command);

    const { stdout, stderr } = await execAsync(command);
    console.log('FFmpeg stdout:', stdout);

    if (stderr) {
      console.log('FFmpeg stderr:', stderr);
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error('El archivo de audio no fue creado');
    }

    return audioPath;
  } catch (error) {
    console.error('FFmpeg error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al extraer audio: ${errorMessage}`);
  }
}

// Función para separar voz usando procesamiento de audio local
async function separateVoice(audioPath: string): Promise<{vocals: string, instrumental: string}> {
  const vocalsPath = audioPath.replace('_audio.mp3', '_vocals.mp3');
  const instrumentalPath = audioPath.replace('_audio.mp3', '_instrumental.mp3');

  try {
    // Ejecutar script Python para separación de voz
    const scriptPath = path.join(process.cwd(), 'server', 'scripts', 'separate_voice.py');

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        scriptPath,
        audioPath,
        vocalsPath,
        instrumentalPath
      ]);

      let errorOutput = '';
      let stdOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        stdOutput += data.toString();
        console.log('Python stdout:', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code);
        if (code !== 0) {
          return reject(new Error(`Voice separation failed with code ${code}: ${errorOutput}`));
        }

        // Verify files exist
        if (!fs.existsSync(vocalsPath) || !fs.existsSync(instrumentalPath)) {
          return reject(new Error(`Error: Los archivos de salida no fueron generados: ${stdOutput}`));
        }

        resolve({
          vocals: vocalsPath,
          instrumental: instrumentalPath
        });
      });
    });
  } catch (error) {
    console.error('Error separating voice:', error);
    throw error;
  }
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
interface WordTiming {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

interface TranscriptionResult {
  text: string;
  words?: WordTiming[];
}

async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  try {
    console.log("Starting transcription with AssemblyAI...");

    // First, upload the file to AssemblyAI
    const audioFile = await readFile(audioPath);
    const uploadUrl = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      audioFile,
      {
        headers: {
          "authorization": process.env.ASSEMBLYAI_API_KEY,
          "content-type": "application/octet-stream",
          "transfer-encoding": "chunked"
        }
      }
    );

    if (!uploadUrl.data.upload_url) {
      throw new Error("Failed to get upload URL from AssemblyAI");
    }

    // Create the transcript using the uploaded file URL
    const transcript = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: uploadUrl.data.upload_url,
        language_detection: true,
        punctuate: true,
        format_text: true,
        word_boost: [""],
        auto_highlights: true,
        content_safety: true,
        auto_chapters: true,
        entity_detection: true,
        word_timestamps: true
      },
      {
        headers: {
          "authorization": process.env.ASSEMBLYAI_API_KEY,
          "content-type": "application/json"
        }
      }
    );

    if (!transcript.data.id) {
      throw new Error("Failed to create transcript");
    }

    // Poll for transcript completion
    let transcriptResult;
    while (true) {
      transcriptResult = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcript.data.id}`,
        {
          headers: {
            "Authorization": process.env.ASSEMBLYAI_API_KEY
          }
        }
      );

      if (transcriptResult.data.status === "completed") {
        break;
      } else if (transcriptResult.data.status === "error") {
        throw new Error(`Transcription failed: ${transcriptResult.data.error}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return {
      text: transcriptResult.data.text,
      words: transcriptResult.data.words
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw error;
  }
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


// Rutas
// Cache object to store processed files
const processedFiles: {
  [key: string]: {
    videoPath: string;
    audioPath?: string;
    vocalsPath?: string;
    instrumentalPath?: string;
  };
} = {};

router.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  const fileBuffer = await fs.promises.readFile(req.file.path);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  
  // Buscar si ya existe un archivo con este hash
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = await fs.promises.readdir(uploadsDir);
  const existingFile = files.find(file => file.includes(hash));

  if (existingFile) {
    // Si existe, eliminar el archivo recién subido y usar el existente
    await fs.promises.unlink(req.file.path);
    const videoId = path.basename(existingFile, path.extname(existingFile));
    return res.json({
      videoId,
      status: 'reused',
      videoPath: path.join('uploads', existingFile)
    });
  }

  // Si no existe, renombrar el archivo con el hash
  const newFileName = `${hash}${path.extname(req.file.originalname)}`;
  const newPath = path.join(uploadsDir, newFileName);
  await fs.promises.rename(req.file.path, newPath);
  
  const videoId = hash;

  // Store in cache
  processedFiles[videoId] = {
    videoPath: req.file.path
  };

  res.json({
    videoId,
    status: 'uploaded',
    videoPath: req.file.path
  });
});

// Ruta para verificar archivos existentes
router.get("/:videoId/check-files", async (req, res) => {
  const { videoId } = req.params;
  const audioPath = path.join(process.cwd(), "uploads", `${videoId}_audio.mp3`);
  const vocalsPath = path.join(process.cwd(), "uploads", `${videoId}_vocals.mp3`);
  const transcriptionPath = path.join(process.cwd(), "uploads", `${videoId}_transcription.json`);

  res.json({
    hasAudio: fs.existsSync(audioPath),
    hasVocals: fs.existsSync(vocalsPath),
    hasTranscription: fs.existsSync(transcriptionPath),
    audioPath: fs.existsSync(audioPath) ? audioPath : null,
    vocalsPath: fs.existsSync(vocalsPath) ? vocalsPath : null
  });
});

// Ruta para extraer audio
router.post("/:videoId/extract-audio", async (req, res) => {
  const { videoId } = req.params;

  // Check cache first
  if (processedFiles[videoId]?.audioPath) {
    return res.json({
      status: 'audio_extracted',
      audioPath: path.basename(processedFiles[videoId].audioPath!),
      fullPath: processedFiles[videoId].audioPath
    });
  }

  const videoPath = processedFiles[videoId]?.videoPath || path.join(process.cwd(), "uploads", `${videoId}.mp4`);
  console.log('Video path:', videoPath);

  // Verificar que el archivo existe
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ 
      error: "Video no encontrado",
      details: `No se encontró el archivo en: ${videoPath}`
    });
  }

  try {
    console.log('Starting audio extraction for video:', videoId);
    const audioPath = await extractAudio(videoPath);
    console.log('Audio extraction completed:', audioPath);

    // Store in cache
    processedFiles[videoId] = {
      ...processedFiles[videoId],
      audioPath
    };

    res.json({ 
      status: 'audio_extracted',
      audioPath: path.basename(audioPath),
      fullPath: audioPath
    });
  } catch (error) {
    console.error("Error extracting audio:", error);
    res.status(500).json({ 
      error: "Error al extraer el audio",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Ruta para separar voz
router.post("/:videoId/separate-voice", async (req, res) => {
  const { videoId } = req.params;

  // Check cache first
  if (processedFiles[videoId]?.vocalsPath && processedFiles[videoId]?.instrumentalPath) {
    return res.json({
      status: 'voice_separated',
      vocals: path.basename(processedFiles[videoId].vocalsPath!),
      instrumental: path.basename(processedFiles[videoId].instrumentalPath!)
    });
  }

  const audioPath = processedFiles[videoId]?.audioPath || path.join(process.cwd(), "uploads", `${videoId}_audio.mp3`);
  const vocalsPath = path.join(process.cwd(), "uploads", `${videoId}_vocals.mp3`);
  const instrumentalPath = path.join(process.cwd(), "uploads", `${videoId}_instrumental.mp3`);

  try {
    console.log("Starting voice separation for:", audioPath);

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    const scriptPath = path.join(process.cwd(), 'server', 'scripts', 'separate_voice.py');
    console.log("Using script:", scriptPath);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        scriptPath,
        audioPath,
        vocalsPath,
        instrumentalPath
      ]);

      let errorOutput = '';
      let stdOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        stdOutput += data.toString();
        console.log('Python stdout:', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python stderr:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code);
        if (code !== 0) {
          return res.status(500).json({ 
            error: "Error al separar la voz",
            details: errorOutput,
            code: code
          });
        }

        // Verify files exist
        if (!fs.existsSync(vocalsPath) || !fs.existsSync(instrumentalPath)) {
          return res.status(500).json({ 
            error: "Error: Los archivos de salida no fueron generados",
            details: stdOutput
          });
        }

        res.json({ 
          status: 'voice_separated',
          vocals: path.basename(vocalsPath),
          instrumental: path.basename(instrumentalPath)
        });
      });
    });

  } catch (error) {
    console.error("Error separating voice:", error);
    res.status(500).json({ 
      error: "Error al separar la voz",
      details: error instanceof Error ? error.message : String(error)
    });
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
  const vocalsPath = path.join(process.cwd(), "uploads", `${videoId}_vocals.mp3`);

  try {
    // Check if we already have a transcription for this file
    const transcriptionPath = path.join(process.cwd(), "uploads", `${videoId}_transcription.json`);

    if (fs.existsSync(transcriptionPath)) {
      console.log("Found existing transcription");
      const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf-8'));
      return res.json({ 
        status: 'transcribed',
        text: transcription
      });
    }

    console.log("Starting transcription for:", vocalsPath);

    if (!fs.existsSync(vocalsPath)) {
      throw new Error(`Vocals file not found: ${vocalsPath}`);
    }

    const text = await transcribeAudio(vocalsPath);
    // Save transcription for future use
    fs.writeFileSync(transcriptionPath, JSON.stringify(text));

    res.json({ 
      status: 'transcribed',
      text 
    });
  } catch (error) {
    console.error("Error transcribing:", error);
    res.status(500).json({ 
      error: "Error al transcribir el audio",
      details: error instanceof Error ? error.message : String(error)
    });
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