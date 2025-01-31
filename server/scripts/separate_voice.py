import sys
import os
from subprocess import run, PIPE

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        print(f"Loading audio file: {audio_path}")
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Extract vocals (focus on mid frequencies where voice usually is)
        vocals_cmd = [
            'ffmpeg', '-i', audio_path,
            '-af', 'areverse,afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=4096:overlap=0.75',
            '-ar', '44100', vocals_path, '-y'
        ]

        # Extract instrumental (remove mid frequencies)
        instrumental_cmd = [
            'ffmpeg', '-i', audio_path,
            '-af', 'areverse,highpass=200,lowpass=3000',
            '-ar', '44100', instrumental_path, '-y'
        ]

        print("Extracting vocals...")
        result = run(vocals_cmd, stdout=PIPE, stderr=PIPE)
        if result.returncode != 0:
            raise Exception(f"Error extracting vocals: {result.stderr.decode()}")

        print("Extracting instrumental...")
        result = run(instrumental_cmd, stdout=PIPE, stderr=PIPE)
        if result.returncode != 0:
            raise Exception(f"Error extracting instrumental: {result.stderr.decode()}")

        if not os.path.exists(vocals_path) or not os.path.exists(instrumental_path):
            raise Exception("Failed to generate output files")

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