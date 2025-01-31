
import sys
import os
import numpy as np
import librosa
import soundfile as sf

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Load the audio file with a higher sample rate
        y, sr = librosa.load(audio_path, sr=44100)

        # Compute the spectrogram
        D = librosa.stft(y, n_fft=2048, hop_length=512)
        D_mag, D_phase = librosa.magphase(D)

        # Compute percussive and harmonic components
        H, P = librosa.decompose.hpss(D_mag, margin=3.0)

        # Create soft mask for vocals
        mask_harm = H / np.maximum(H + P, 1e-10)
        mask_perc = P / np.maximum(H + P, 1e-10)

        # Apply masks and combine with phase
        vocals = D_phase * mask_harm * D_mag
        instrumental = D_phase * mask_perc * D_mag

        # Inverse STFT
        y_vocals = librosa.istft(vocals)
        y_instrumental = librosa.istft(instrumental)

        # Normalize audio
        y_vocals = librosa.util.normalize(y_vocals)
        y_instrumental = librosa.util.normalize(y_instrumental)

        # Save files with higher quality
        sf.write(vocals_path, y_vocals, sr, format='mp3', subtype='MP3_320')
        sf.write(instrumental_path, y_instrumental, sr, format='mp3', subtype='MP3_320')

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
