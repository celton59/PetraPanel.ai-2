import sys
import warnings
import torch
import torchaudio
from demucs.apply import apply_model
from demucs.pretrained import get_model
import os

warnings.filterwarnings('ignore')

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")

        # Cargar el modelo pre-entrenado
        model = get_model('htdemucs')
        model.eval()

        if torch.cuda.is_available():
            model.cuda()

        # Cargar y normalizar el audio
        wav, sr = torchaudio.load(audio_path)
        wav = wav.mean(0, keepdim=True)  # convertir a mono si es necesario

        # Asegurarse de que la frecuencia de muestreo sea la correcta
        if sr != model.samplerate:
            wav = torchaudio.transforms.Resample(sr, model.samplerate)(wav)

        # Separar el audio
        print("Separating audio...")
        with torch.no_grad():
            wav = wav.cuda() if torch.cuda.is_available() else wav
            estimates = model.separate(wav)
            estimates = estimates.cpu()

        # Guardar los archivos separados
        print(f"Saving vocals to: {vocals_path}")
        vocals = estimates[0]  # vocals es el primer canal
        torchaudio.save(vocals_path, vocals, model.samplerate)

        print(f"Saving instrumental to: {instrumental_path}")
        instrumental = estimates[1]  # instrumental es el segundo canal
        torchaudio.save(instrumental_path, instrumental, model.samplerate)

        print("Separation completed successfully")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python separate_voice.py <input_audio> <vocals_output> <instrumental_output>")
        sys.exit(1)

    input_audio = sys.argv[1]
    vocals_output = sys.argv[2]
    instrumental_output = sys.argv[3]

    try:
        separate_voice(input_audio, vocals_output, instrumental_output)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)