
import sys
import os
import requests
import time
import json

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # LALAL.AI API endpoints
        UPLOAD_URL = "https://api.lalal.ai/v1/uploads/"
        PROCESS_URL = "https://api.lalal.ai/v1/split/"
        DOWNLOAD_URL = "https://api.lalal.ai/v1/downloads/"
        API_KEY = os.getenv("LALAL_API_KEY")

        if not API_KEY:
            raise ValueError("LALAL_API_KEY environment variable not set")

        headers = {"Authorization": f"Bearer {API_KEY}"}

        # Upload file
        print("Uploading file to LALAL.AI...")
        with open(audio_path, "rb") as audio_file:
            files = {"file": audio_file}
            response = requests.post(UPLOAD_URL, headers=headers, files=files)
            response.raise_for_status()
            upload_id = response.json()["id"]

        # Process file
        print("Processing audio...")
        data = {
            "upload_id": upload_id,
            "target": "vocals",
            "model": "standard"
        }
        response = requests.post(PROCESS_URL, headers=headers, json=data)
        response.raise_for_status()
        task_id = response.json()["task_id"]

        # Wait for processing
        while True:
            response = requests.get(f"{PROCESS_URL}{task_id}/", headers=headers)
            response.raise_for_status()
            status = response.json()["status"]
            
            if status == "done":
                break
            elif status == "error":
                raise Exception("LALAL.AI processing failed")
            
            time.sleep(5)

        # Download results
        print("Downloading separated tracks...")
        for track_type, output_path in [("vocals", vocals_path), ("instrumental", instrumental_path)]:
            response = requests.get(
                f"{DOWNLOAD_URL}{task_id}/{track_type}/",
                headers=headers,
                stream=True
            )
            response.raise_for_status()
            
            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

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
