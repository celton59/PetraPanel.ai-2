import sys
import os
import numpy as np
from spleeter.separator import Separator

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Configure Spleeter to use CPU
        os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

        # Initialize separator
        separator = Separator('spleeter:2stems', multiprocess=False)

        # Separate audio
        print("Separating audio...")
        prediction = separator.separate_to_file(
            audio_path,
            os.path.dirname(vocals_path),
            filename_format="{instrument}.{codec}",
            codec='mp3'
        )

        # Rename files to match expected paths
        os.rename(
            os.path.join(os.path.dirname(vocals_path), "vocals.mp3"),
            vocals_path
        )
        os.rename(
            os.path.join(os.path.dirname(vocals_path), "accompaniment.mp3"),
            instrumental_path
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