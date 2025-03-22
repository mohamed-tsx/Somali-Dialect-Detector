from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import librosa
import numpy as np
import joblib
import os
import re
from django.conf import settings

# Load the trained model with error handling
model_path = os.path.join(settings.BASE_DIR, 'somali_dialect_model.pkl')
try:
    model = joblib.load(model_path)
except FileNotFoundError:
    raise Exception(f"Model file 'somali_dialect_model.pkl' not found at {model_path}")
except Exception as e:
    raise Exception(f"Error loading model: {str(e)}")

def extract_mfcc(audio_path, sr=16000, n_mfcc=13):
    """Extract MFCC features from an audio file."""
    try:
        audio, _ = librosa.load(audio_path, sr=sr)
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
        return np.mean(mfcc, axis=1)
    except Exception as e:
        raise Exception(f"Error extracting MFCC features: {str(e)}")
    

class PredictDialect(APIView):
    """API endpoint to predict Somali dialect from audio."""

    def post(self, request):
        audio_file = request.FILES.get('audio')

        if not audio_file:
            return Response({"error": "No audio file uploaded!"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file extension (optional)
        if not audio_file.name.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
            return Response({"error": "Unsupported audio format. Please upload a WAV, MP3, M4A, or OGG file."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Sanitize and save the file
        safe_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '-', audio_file.name)
        audio_save_dir = os.path.join(settings.BASE_DIR, 'temp_audio')
        os.makedirs(audio_save_dir, exist_ok=True)
        audio_path = os.path.join(audio_save_dir, safe_filename)

        with open(audio_path, 'wb') as f:
            for chunk in audio_file.chunks():
                f.write(chunk)

        print(f"File saved to: {audio_path}")

        try:
            # Extract features and predict
            mfcc_features = extract_mfcc(audio_path).reshape(1, -1)
            prediction = model.predict(mfcc_features)[0]

            # Confidence score (if model supports predict_proba)
            confidence = None
            if hasattr(model, "predict_proba"):
                confidence = round(float(np.max(model.predict_proba(mfcc_features))), 3)

            print(f"Prediction: {prediction}")

            # Build result text
            result_text = "This dialect is Standard Somali Dialect" if prediction == "standard_somali" else "This dialect is Maay Dialect"

            response_data = {
                "dialect": result_text,
                "prediction_label": prediction,
            }

            if confidence:
                response_data["confidence"] = confidence

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            # Clean up
            if os.path.exists(audio_path):
                os.remove(audio_path)
