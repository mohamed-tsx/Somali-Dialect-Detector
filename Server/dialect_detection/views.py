# dialect_detection/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import librosa
import numpy as np
import joblib
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load the trained model (with error handling)
try:
    model = joblib.load(os.path.join(BASE_DIR, 'somali_dialect_model.pkl'))
except FileNotFoundError:
    raise Exception("Model file 'somali_dialect_model.pkl' not found in the expected directory.")
except Exception as e:
    raise Exception(f"Error loading model: {str(e)}")

def extract_mfcc(audio_path, sr=16000, n_mfcc=13):
    try:
        audio, _ = librosa.load(audio_path, sr=sr)
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
        return np.mean(mfcc, axis=1)  # Taking the mean across time frames
    except Exception as e:
        raise Exception(f"Error extracting MFCC features: {str(e)}")

class PredictDialect(APIView):
    def post(self, request):
        audio_file = request.FILES.get('audio')  # Make sure the key matches frontend

        if not audio_file:
            return Response({"error": "No audio file uploaded!"}, status=status.HTTP_400_BAD_REQUEST)

        # Sanitize file name to avoid invalid characters
        safe_filename = re.sub(r'[:.]+', '-', audio_file.name)
        audio_path = os.path.join("temp_audio", safe_filename)
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)

        # Save the audio file in chunks
        with open(audio_path, 'wb') as f:
            for chunk in audio_file.chunks():
                f.write(chunk)

        print(f"File saved to: {audio_path}")

        try:
            # Extract MFCC and predict
            mfcc_features = extract_mfcc(audio_path).reshape(1, -1)
            prediction = model.predict(mfcc_features)[0]
            print(f"Prediction: {prediction}")

            result_text = "This dialect is Standard Somali Dialect" if prediction == "standard_somali" else "This dialect is Maay Dialect"

            return Response({"dialect": result_text}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            # Clean up the temporary file
            if os.path.exists(audio_path):
                os.remove(audio_path)
