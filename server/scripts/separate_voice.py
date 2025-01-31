import sys
import os
import torch
from demucs.pretrained import get_pretrained
from demucs.audio import AudioFile, save_audio

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Cargar modelo de Demucs (usando mdx_extra_q que es más ligero)
        print("Loading Demucs model...")
        model = get_pretrained('mdx_extra_q')
        model.cpu()  # Usar CPU para evitar problemas de CUDA
        model.eval()

        # Cargar audio
        print("Loading audio...")
        wav = AudioFile(audio_path).read()
        wav = torch.as_tensor(wav, dtype=torch.float32)

        # Asegurar que el audio tenga la forma correcta (canales, muestras)
        wav = wav.mean(0, keepdim=True).expand(2, -1) if wav.dim() == 1 else wav

        # Separar audio
        print("Separating audio...")
        with torch.no_grad():
            sources = model.forward(wav[None])
            sources = sources.squeeze(0)

        # Guardar los archivos separados
        print(f"Saving vocals to: {vocals_path}")
        save_audio(sources[0].cpu().numpy(), vocals_path, model.samplerate)  # vocals es el primer canal

        print(f"Saving instrumental to: {instrumental_path}")
        save_audio(sources[1].cpu().numpy(), instrumental_path, model.samplerate)  # instrumental es el segundo canal

        print("Separation completed successfully")
        return True

    except Exception as e:
        print(f"Error during separation: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python separate_voice.py <input_audio> <vocals_output> <instrumental_output>")
        sys.exit(1)

    try:
        separate_voice(sys.argv[1], sys.argv[2], sys.argv[3])
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)