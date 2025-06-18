import os
import pathlib
import uuid
import json
from datetime import datetime
from typing import List, Dict
import numpy as np

# Simplified imports to avoid compatibility issues
import tensorflow as tf
# Add this new import for separate Keras API
from tensorflow import keras

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="Bone Disease Detection API", 
              description="API for predicting bone diseases from X-ray images using ResNet50 model",
              version="1.0.0")

# Add CORS middleware to allow cross-origin requests from your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Configuration Constants
MODEL_SAVE_PATH = pathlib.Path('./models')  # Directory where the trained model is saved
MODEL_FILENAME = 'osteoporosis_resnet50.keras'  # The saved model file name
DATA_FOLDER = pathlib.Path('./public/bone_data')  # Directory to save uploaded images and reports
IMAGES_FOLDER = DATA_FOLDER / 'images'  # Subdirectory for images
REPORTS_FOLDER = DATA_FOLDER / 'reports'  # Subdirectory for reports

# Image parameters MUST match the training setup
IMG_HEIGHT = 224
IMG_WIDTH = 224
IMG_SIZE = (IMG_HEIGHT, IMG_WIDTH)

# Class names MUST match the training setup
CLASS_NAMES = ['Normal', 'Osteopenia', 'Osteoporosis']

# Create necessary directories if they don't exist
for folder in [DATA_FOLDER, IMAGES_FOLDER, REPORTS_FOLDER]:
    if not folder.exists():
        folder.mkdir(parents=True)

# Load the model at startup
model = None

@app.on_event("startup")
async def startup_event():
    global model
    model_full_path = MODEL_SAVE_PATH / MODEL_FILENAME
    if model_full_path.exists():
        try:
            # Use keras.models.load_model with compile=False for better compatibility
            model = keras.models.load_model(str(model_full_path), compile=False)
            print(f"Model loaded successfully from {model_full_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Model file {model_full_path} does not exist. API will not be able to make predictions.")

# Pydantic models
class PredictionResponse(BaseModel):
    image_id: str
    predicted_class: str
    confidence: float
    class_probabilities: dict
    report_id: str
    timestamp: str

class ReportData(BaseModel):
    image_id: str
    predicted_class: str
    confidence: float
    class_probabilities: Dict[str, float]
    timestamp: str
    user_id: str = None  # Optional, can be added later for user-specific reports

@app.get("/")
async def root():
    return {"message": "Welcome to the Bone Disease Detection API"}

@app.post("/upload/", response_model=dict)
async def upload_image(file: UploadFile = File(...)):
    # Validate file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate a unique ID for the image
    image_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    image_filename = f"{image_id}{file_extension}"
    image_path = IMAGES_FOLDER / image_filename
    
    # Save the file
    try:
        contents = await file.read()
        with open(image_path, "wb") as f:
            f.write(contents)
        return {"image_id": image_id, "filename": image_filename, "message": "Image uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/predict/{image_id}", response_model=PredictionResponse)
async def predict_image(image_id: str):
    global model
    
    # Check if model is loaded
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please try again later.")
    
    # Find the image file with the given ID
    image_files = list(IMAGES_FOLDER.glob(f"{image_id}*"))
    if not image_files:
        raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
    
    image_path = image_files[0]  # Take the first matching file
    
    try:
        # Load and preprocess the image using TensorFlow directly
        img_raw = tf.io.read_file(str(image_path))
        img = tf.image.decode_image(img_raw, channels=3)
        img = tf.image.resize(img, [IMG_HEIGHT, IMG_WIDTH])
        img = tf.cast(img, tf.float32) / 255.0
        img = tf.expand_dims(img, axis=0)
        
        # Make prediction - modified to handle TensorFlow 2.19.0
        predictions = model.predict(img)
        
        # Handle different prediction output formats
        if isinstance(predictions, list):
            pred_array = predictions[0]
        else:
            pred_array = predictions
            
        # Apply softmax if needed
        if pred_array.shape[-1] == len(CLASS_NAMES):
            scores = tf.nn.softmax(pred_array).numpy()[0]
        else:
            scores = pred_array[0]
        
        # Get prediction results
        predicted_class_index = np.argmax(scores)
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        confidence = float(100 * np.max(scores))
        
        # Create class probabilities dictionary
        class_probs = {class_name: float(scores[i]*100) for i, class_name in enumerate(CLASS_NAMES)}
        
        # Generate timestamp
        timestamp = datetime.now().isoformat()
        
        # Create report ID and save report
        report_id = str(uuid.uuid4())
        report_data = ReportData(
            image_id=image_id,
            predicted_class=predicted_class_name,
            confidence=confidence,
            class_probabilities=class_probs,
            timestamp=timestamp
        )
        
        # Save report as JSON file
        report_path = REPORTS_FOLDER / f"{report_id}.json"
        with open(report_path, "w") as f:
            f.write(report_data.json())
        
        return PredictionResponse(
            image_id=image_id,
            predicted_class=predicted_class_name,
            confidence=confidence,
            class_probabilities=class_probs,
            report_id=report_id,
            timestamp=timestamp
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

# Endpoint to get list of reports
@app.get("/reports/", response_model=List[dict])
async def list_reports():
    reports = []
    for report_file in REPORTS_FOLDER.iterdir():
        if report_file.is_file() and report_file.suffix == ".json":
            try:
                with open(report_file, "r") as f:
                    report_data = json.load(f)
                    report_data["report_id"] = report_file.stem  # Add the report ID (filename without extension)
                    reports.append(report_data)
            except Exception as e:
                print(f"Error reading report {report_file}: {e}")
    
    # Sort reports by timestamp (newest first)
    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return reports

# Endpoint to get a specific report
@app.get("/reports/{report_id}", response_model=dict)
async def get_report(report_id: str):
    report_path = REPORTS_FOLDER / f"{report_id}.json"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    
    try:
        with open(report_path, "r") as f:
            report_data = json.load(f)
            report_data["report_id"] = report_id
            return report_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading report: {str(e)}")

# Endpoint to get image by ID
@app.get("/images/{image_id}")
async def get_image(image_id: str):
    image_files = list(IMAGES_FOLDER.glob(f"{image_id}*"))
    if not image_files:
        raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
    
    image_path = image_files[0]  # Take the first matching file
    return {"image_path": str(image_path)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)