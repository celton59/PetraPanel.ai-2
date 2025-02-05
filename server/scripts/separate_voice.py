import sys
import os
import json
from urllib.parse import quote, urlencode
from urllib.request import urlopen, Request

def make_content_disposition(filename, disposition='attachment'):
    try:
        filename.encode('ascii')
        file_expr = f'filename="{filename}"'
    except UnicodeEncodeError:
        quoted = quote(filename)
        file_expr = f"filename*=utf-8''{quoted}"
    return f'{disposition}; {file_expr}'

def separate_voice(audio_path, vocals_path, instrumental_path):
    try:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        URL_API = "https://www.lalal.ai/api/"
        API_KEY = "fb664191829e4f3a"

        # Upload file
        print("Uploading file to LALAL.AI...")
        url_for_upload = URL_API + "upload/"
        _, filename = os.path.split(audio_path)
        headers = {
            "Content-Disposition": make_content_disposition(filename),
            "Authorization": f"license {API_KEY}",
        }

        with open(audio_path, 'rb') as f:
            request = Request(url_for_upload, f, headers)
            with urlopen(request) as response:
                upload_result = json.load(response)
                if upload_result["status"] == "success":
                    file_id = upload_result["id"]
                else:
                    raise RuntimeError(upload_result["error"])

        # Split file
        print("Processing audio...")
        url_for_split = URL_API + "split/"
        query_args = {
            'id': file_id,
            'stem': 'vocals',
            'splitter': 'phoenix'
        }

        encoded_args = urlencode(query_args).encode('utf-8')
        request = Request(url_for_split, encoded_args, headers=headers)
        with urlopen(request) as response:
            split_result = json.load(response)
            if split_result["status"] == "error":
                raise RuntimeError(split_result["error"])

        # Check progress and download
        print("Checking progress...")
        url_for_check = URL_API + "check/?"
        while True:
            with urlopen(url_for_check + urlencode({'id': file_id})) as response:
                check_result = json.load(response)

                if check_result["status"] == "error":
                    raise RuntimeError(check_result["error"])

                task_state = check_result["task"]["state"]

                if task_state == "success":
                    print("Progress: 100%")
                    split_data = check_result["split"]

                    # Download vocals
                    print(f"Saving vocals to: {vocals_path}")
                    with urlopen(split_data['stem_track']) as response:
                        with open(vocals_path, 'wb') as f:
                            while (chunk := response.read(8196)):
                                f.write(chunk)

                    # Download instrumental
                    print(f"Saving instrumental to: {instrumental_path}")
                    with urlopen(split_data['back_track']) as response:
                        with open(instrumental_path, 'wb') as f:
                            while (chunk := response.read(8196)):
                                f.write(chunk)

                    break
                elif task_state == "error":
                    raise RuntimeError(check_result["task"]["error"])
                elif task_state == "progress":
                    progress = int(check_result["task"]["progress"])
                    print(f"Progress: {progress}%")

                import time
                time.sleep(15)

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