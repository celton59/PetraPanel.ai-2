import sys
import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, filtfilt

def butter_bandpass(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def separate_voice(audio_path, vocals_path, instrumental_path):
    # Cargar el archivo de audio
    print(f"Loading audio file: {audio_path}")
    y, sr = librosa.load(audio_path)
    
    # Configurar los filtros para voz (85-255 Hz fundamental)
    lowcut = 85.0
    highcut = 255.0
    
    # Aplicar el filtro paso banda para extraer la voz
    b, a = butter_bandpass(lowcut, highcut, sr)
    vocals = filtfilt(b, a, y)
    
    # El instrumental es la señal original menos la voz
    instrumental = y - vocals
    
    # Normalizar las señales
    vocals = vocals / np.max(np.abs(vocals))
    instrumental = instrumental / np.max(np.abs(instrumental))
    
    # Guardar los archivos
    print(f"Saving vocals to: {vocals_path}")
    sf.write(vocals_path, vocals, sr)
    
    print(f"Saving instrumental to: {instrumental_path}")
    sf.write(instrumental_path, instrumental, sr)
    
    print("Separation completed successfully")

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
