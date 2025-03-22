# dialect_detection/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import librosa
import numpy as np
import joblib
import os

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
        # Get the audio file from the request
        audio_file = request.FILES.get('file')

        if not audio_file:
            return Response({"error": "No file uploaded!"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the file temporarily
        audio_path = f"temp_audio/{audio_file.name}"
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        with open(audio_path, 'wb') as f:
            f.write(audio_file.read())
        
        # Log to check if file is saved
        print(f"File saved to: {audio_path}")
        
        # Extract MFCC features from the uploaded file
        mfcc_features = extract_mfcc(audio_path)
        mfcc_features = mfcc_features.reshape(1, -1)

        # Make a prediction
        prediction = model.predict(mfcc_features)
        print("Prediction:", prediction[0])

        if (prediction[0] == "standard_somali"):
            # Delete the temporary audio file after prediction
            os.remove(audio_path)
            return Response({"dialect": 'This dialect is Standard Somali Dialect'}, status=status.HTTP_200_OK)
        else :
            # Delete the temporary audio file after prediction
            os.remove(audio_path)
            return Response({"dialect": 'This dialect is Maay Dialect'}, status=status.HTTP_200_OK)

