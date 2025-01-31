
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

        # Load the audio file
        y, sr = librosa.load(audio_path)

        # Perform the separation using librosa
        S_full, phase = librosa.magphase(librosa.stft(y))
        S_filter = librosa.decompose.nn_filter(S_full,
                                             aggregate=np.median,
                                             metric='cosine',
                                             width=int(librosa.time_to_frames(2, sr=sr)))
        S_filter = np.minimum(S_full, S_filter)
        margin_i, margin_v = 2, 10
        power = 2

        mask_i = librosa.util.softmask(S_filter,
                                     margin_i * (S_full - S_filter),
                                     power=power)
        mask_v = librosa.util.softmask(S_full - S_filter,
                                     margin_v * S_filter,
                                     power=power)

        S_foreground = mask_v * S_full
        S_background = mask_i * S_full

        # Convert back to audio signals
        vocals = librosa.istft(S_foreground * phase)
        instrumental = librosa.istft(S_background * phase)

        # Save the separated audio files
        sf.write(vocals_path, vocals, sr)
        sf.write(instrumental_path, instrumental, sr)

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
