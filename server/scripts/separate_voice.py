import sys
import warnings
from demucs.separate import MSeparator
import torch

warnings.filterwarnings('ignore')

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")

        # Initialize Demucs separator
        separator = MSeparator()

        # Load and separate audio
        print("Separating audio...")
        sources = separator.separate_audio_file(audio_path)

        # Extract vocals and instrumental
        vocals = sources['vocals']
        instrumental = sources['instrumental']

        # Save separated audio files
        print(f"Saving vocals to: {vocals_path}")
        torch.save(vocals, vocals_path)

        print(f"Saving instrumental to: {instrumental_path}")
        torch.save(instrumental, instrumental_path)

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