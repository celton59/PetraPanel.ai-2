import sys
import os
import warnings
import torch
import torchaudio
from demucs.pretrained import get_model
from demucs.apply import apply_model

warnings.filterwarnings('ignore')

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Load audio
        wav, sr = torchaudio.load(audio_path)

        # Convert to mono if stereo
        if wav.size(0) > 1:
            wav = wav.mean(0, keepdim=True)

        # Load model
        model = get_model('htdemucs')
        model.eval()

        # Get model sample rate
        model_sr = model.samplerate

        # Resample if needed
        if sr != model_sr:
            resampler = torchaudio.transforms.Resample(sr, model_sr)
            wav = resampler(wav)

        # Move to CPU/GPU
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        wav = wav.to(device)
        model.to(device)

        # Separate
        with torch.no_grad():
            print("Processing audio...")
            sources = model.separate(wav.reshape(1, -1))
            sources = sources.cpu()

        # Save vocals
        print(f"Saving vocals to: {vocals_path}")
        torchaudio.save(
            vocals_path,
            sources[None, 0],  # vocals
            model_sr
        )

        # Save instrumental
        print(f"Saving instrumental to: {instrumental_path}")
        torchaudio.save(
            instrumental_path,
            sources[None, 1],  # instrumental
            model_sr
        )

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