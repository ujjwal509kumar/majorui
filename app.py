import os
import pathlib
import uuid
import json
from datetime import datetime
from typing import List, Dict
import numpy as np
from PIL import Image, ImageStat
import cv2

import torch
import torch.nn as nn
from torchvision import transforms, models

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="Bone Disease Detection API - PyTorch", 
              description="API for predicting bone diseases from X-ray images using EfficientNet-B4 PyTorch model",
              version="2.0.0")

# Add CORS middleware to allow cross-origin requests from your Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Configuration Constants
MODEL_SAVE_PATH = pathlib.Path('./models')  # Directory where the PyTorch model is saved
MODEL_FILENAME = 'phase1_epoch_19.pth'  # The saved PyTorch model file name
DATA_FOLDER = pathlib.Path('./public/bone_data')  # Directory to save uploaded images and reports
IMAGES_FOLDER = DATA_FOLDER / 'images'  # Subdirectory for images
REPORTS_FOLDER = DATA_FOLDER / 'reports'  # Subdirectory for reports

# Image parameters MUST match the PyTorch training setup
IMG_SIZE = 512  # Updated to match PyTorch training
IMG_HEIGHT = IMG_SIZE
IMG_WIDTH = IMG_SIZE

# Class names MUST match the PyTorch training setup
CLASS_NAMES = ['normal', 'osteopenia', 'osteoporosis']  # Updated to match PyTorch training
CLASS_NAMES_DISPLAY = ['Normal', 'Osteopenia', 'Osteoporosis']  # For display purposes

# Device configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🔧 API using device: {device}")

# Create necessary directories if they don't exist
for folder in [DATA_FOLDER, IMAGES_FOLDER, REPORTS_FOLDER]:
    if not folder.exists():
        folder.mkdir(parents=True)

def is_xray_image(image_path: str, debug: bool = False) -> bool:
    """
    Validate if the uploaded image is likely a bone X-ray image based on characteristics
    observed from actual X-ray samples in test_high_quality.
    
    Updated thresholds based on your processed images:
    - Mean brightness: 31-38 (very dark)
    - Contrast: 56-62 (good contrast)
    - Dark pixel ratio: 0.766-0.802 (mostly dark background)
    - Bright pixel ratio: 0.050-0.096 (some bright bone structures)
    - Edge density: 0.0338-0.0616 (moderate edge content)
    """
    try:
        # Open image with PIL
        with Image.open(image_path) as img:
            if debug:
                print(f"Analyzing image: {image_path}")
                print(f"Image size: {img.width} x {img.height}")
            
            # Check minimum image size - X-rays should be reasonably sized
            if img.width < 100 or img.height < 100:
                if debug: print("❌ Failed: Image too small")
                return False
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Convert PIL image to numpy array for OpenCV processing
            img_array = np.array(img)
            
            # Convert RGB to BGR for OpenCV
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            
            # Check 1: X-rays have good contrast (based on your samples: 56-62)
            contrast = gray.std()
            if debug: print(f"Contrast: {contrast:.2f} (need: 40-120)")
            if contrast < 40 or contrast > 120:
                if debug: print("❌ Failed: Contrast out of range")
                return False
            
            # Check 2: X-rays are grayscale - very low color variation
            img_stat = ImageStat.Stat(img)
            color_variance = np.var(img_stat.mean)
            if debug: print(f"Color variance: {color_variance:.2f} (need: <15)")
            if color_variance > 15:  # Slightly more flexible for processed images
                if debug: print("❌ Failed: Too much color variation")
                return False
            
            # Check 3: X-rays have significant dark background (based on your samples: 0.766-0.802)
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            total_pixels = gray.shape[0] * gray.shape[1]
            
            dark_pixels = np.sum(hist[0:61])
            dark_ratio = dark_pixels / total_pixels
            if debug: print(f"Dark pixel ratio: {dark_ratio:.3f} (need: >0.60)")
            
            if dark_ratio < 0.60:  # Based on your processed images
                if debug: print("❌ Failed: Not enough dark background")
                return False
            
            # Check 4: X-rays have some bright bone structures (based on your samples: 0.050-0.096)
            bright_pixels = np.sum(hist[160:256])
            bright_ratio = bright_pixels / total_pixels
            if debug: print(f"Bright pixel ratio: {bright_ratio:.3f} (need: >0.03)")
            
            if bright_ratio < 0.03:  # Based on your processed data
                if debug: print("❌ Failed: Not enough bright structures")
                return False
            
            # Check 5: Edge detection (based on your samples: 0.0338-0.0616)
            edges = cv2.Canny(gray, 30, 120)
            edge_density = np.sum(edges > 0) / total_pixels
            if debug: print(f"Edge density: {edge_density:.4f} (need: 0.01-0.15)")
            
            if edge_density < 0.01 or edge_density > 0.15:
                if debug: print("❌ Failed: Edge density out of range")
                return False
            
            # Check 6: Aspect ratio - should be square or close for processed images
            height, width = gray.shape
            aspect_ratio = max(width, height) / min(width, height)
            if debug: print(f"Aspect ratio: {aspect_ratio:.2f} (need: <3)")
            if aspect_ratio > 3:  # More strict for processed images
                if debug: print("❌ Failed: Aspect ratio too extreme")
                return False
            
            # Check 7: Mean brightness range (based on your samples: 31-38)
            mean_brightness = np.mean(gray)
            if debug: print(f"Mean brightness: {mean_brightness:.2f} (need: 20-80)")
            if mean_brightness < 20 or mean_brightness > 80:  # Adjusted for processed images
                if debug: print("❌ Failed: Brightness out of range")
                return False
            
            # Check 8: Saturation check - processed X-rays should be grayscale
            hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
            saturation = hsv[:,:,1]
            avg_saturation = np.mean(saturation)
            if debug: print(f"Average saturation: {avg_saturation:.2f} (need: <25)")
            
            if avg_saturation > 25:  # Slightly more flexible for processed images
                if debug: print("❌ Failed: Too much color saturation")
                return False
            
            if debug: print("✅ All checks passed - Valid X-ray image")
            return True
            
    except Exception as e:
        print(f"Error validating X-ray image: {e}")
        return False

# PyTorch Model Architecture (same as training)
class OptimizedOsteoporosisModel(nn.Module):
    def __init__(self, num_classes=3):
        super(OptimizedOsteoporosisModel, self).__init__()
        
        # Use EfficientNet-B4 as backbone
        self.backbone = models.efficientnet_b4(pretrained=False)  # No pretrained for loading
        
        # Get the number of features from the backbone
        num_features = self.backbone.classifier[1].in_features
        
        # Replace classifier with custom head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            
            nn.Linear(128, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)

# PyTorch image preprocessing
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load the PyTorch model at startup
model = None

@app.on_event("startup")
async def startup_event():
    global model
    model_full_path = MODEL_SAVE_PATH / MODEL_FILENAME
    
    if model_full_path.exists():
        try:
            # Create model instance
            model = OptimizedOsteoporosisModel(num_classes=len(CLASS_NAMES))
            
            # Load checkpoint
            checkpoint = torch.load(model_full_path, map_location=device)
            model.load_state_dict(checkpoint['model_state_dict'])
            model.to(device)
            model.eval()
            
            print(f"✅ PyTorch model loaded successfully from {model_full_path}")
            print(f"🔧 Model on device: {next(model.parameters()).device}")
            
        except Exception as e:
            print(f"❌ Error loading PyTorch model: {e}")
            model = None
    else:
        print(f"❌ Model file {model_full_path} does not exist. API will not be able to make predictions.")

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
    user_id: str = None

@app.get("/")
async def root():
    return {"message": "Welcome to the Bone Disease Detection API - PyTorch Version"}

@app.post("/upload/", response_model=dict)
async def upload_image(file: UploadFile = File(...), user_id: str = Query(None)):
    # Validate file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate a unique ID for the image
    image_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    image_filename = f"{image_id}{file_extension}"
    image_path = IMAGES_FOLDER / image_filename
    
    # Save the file temporarily for validation
    try:
        contents = await file.read()
        with open(image_path, "wb") as f:
            f.write(contents)
        
        # Validate if the uploaded image is an X-ray
        if not is_xray_image(str(image_path)):
            # Remove the uploaded file if it's not an X-ray
            os.remove(image_path)
            raise HTTPException(
                status_code=400, 
                detail="The uploaded image does not appear to be an X-ray image. Please upload a valid bone X-ray image."
            )
        
        return {
            "image_id": image_id, 
            "filename": image_filename, 
            "message": "X-ray image uploaded successfully",
            "user_id": user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        if image_path.exists():
            os.remove(image_path)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/predict/{image_id}", response_model=PredictionResponse)
async def predict_image(image_id: str, user_id: str = Query(None)):
    global model
    
    # Check if model is loaded
    if model is None:
        raise HTTPException(status_code=503, detail="PyTorch model not loaded. Please try again later.")
    
    # Find the image file with the given ID
    image_files = list(IMAGES_FOLDER.glob(f"{image_id}*"))
    if not image_files:
        raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
    
    image_path = image_files[0]
    
    # Double-check that the image is still a valid X-ray before prediction
    if not is_xray_image(str(image_path)):
        raise HTTPException(
            status_code=400, 
            detail="The image does not appear to be a valid X-ray image for bone disease prediction."
        )
    
    try:
        # Load and preprocess the image using PyTorch
        image = cv2.imread(str(image_path))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Apply transforms
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            predicted_class_idx = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][predicted_class_idx].item()
        
        # Get results
        predicted_class_name = CLASS_NAMES_DISPLAY[predicted_class_idx]
        confidence_percentage = float(confidence * 100)
        
        # Create class probabilities dictionary
        probs_numpy = probabilities[0].cpu().numpy()
        class_probs = {CLASS_NAMES_DISPLAY[i]: float(probs_numpy[i] * 100) for i in range(len(CLASS_NAMES_DISPLAY))}
        
        # Generate timestamp
        timestamp = datetime.now().isoformat()
        
        # Create report ID and save report
        report_id = str(uuid.uuid4())
        report_data = ReportData(
            image_id=image_id,
            predicted_class=predicted_class_name,
            confidence=confidence_percentage,
            class_probabilities=class_probs,
            timestamp=timestamp,
            user_id=user_id
        )
        
        # Save report as JSON file
        report_path = REPORTS_FOLDER / f"{report_id}.json"
        with open(report_path, "w") as f:
            f.write(report_data.json())
        
        return PredictionResponse(
            image_id=image_id,
            predicted_class=predicted_class_name,
            confidence=confidence_percentage,
            class_probabilities=class_probs,
            report_id=report_id,
            timestamp=timestamp
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during PyTorch prediction: {str(e)}")

# Endpoint to get list of reports
@app.get("/reports/", response_model=List[dict])
async def list_reports():
    reports = []
    for report_file in REPORTS_FOLDER.iterdir():
        if report_file.is_file() and report_file.suffix == ".json":
            try:
                with open(report_file, "r") as f:
                    report_data = json.load(f)
                    report_data["report_id"] = report_file.stem
                    reports.append(report_data)
            except Exception as e:
                print(f"Error reading report {report_file}: {e}")
    
    # Sort reports by timestamp (newest first)
    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return reports

# Endpoint to get user-specific reports
@app.get("/reports/user/{user_id}", response_model=List[dict])
async def list_user_reports(user_id: str):
    reports = []
    for report_file in REPORTS_FOLDER.iterdir():
        if report_file.is_file() and report_file.suffix == ".json":
            try:
                with open(report_file, "r") as f:
                    report_data = json.load(f)
                    if report_data.get("user_id") == user_id:
                        report_data["report_id"] = report_file.stem
                        reports.append(report_data)
            except Exception as e:
                print(f"Error reading report {report_file}: {e}")
    
    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return reports

# Endpoint to get user analytics
@app.get("/analytics/user/{user_id}", response_model=dict)
async def get_user_analytics(user_id: str):
    reports = []
    for report_file in REPORTS_FOLDER.iterdir():
        if report_file.is_file() and report_file.suffix == ".json":
            try:
                with open(report_file, "r") as f:
                    report_data = json.load(f)
                    if report_data.get("user_id") == user_id:
                        reports.append(report_data)
            except Exception as e:
                print(f"Error reading report {report_file}: {e}")
    
    if not reports:
        return {
            "total_scans": 0,
            "class_distribution": {},
            "confidence_stats": {},
            "timeline_data": [],
            "health_trend": "No data available"
        }
    
    reports.sort(key=lambda x: x.get("timestamp", ""))
    
    # Calculate analytics
    total_scans = len(reports)
    class_counts = {}
    confidences = []
    timeline_data = []
    
    for report in reports:
        predicted_class = report.get("predicted_class", "Unknown")
        confidence = report.get("confidence", 0)
        timestamp = report.get("timestamp", "")
        
        class_counts[predicted_class] = class_counts.get(predicted_class, 0) + 1
        confidences.append(confidence)
        
        timeline_data.append({
            "date": timestamp,
            "class": predicted_class,
            "confidence": confidence,
            "report_id": report.get("report_id", "")
        })
    
    confidence_stats = {
        "average": sum(confidences) / len(confidences) if confidences else 0,
        "min": min(confidences) if confidences else 0,
        "max": max(confidences) if confidences else 0
    }
    
    # Determine health trend
    health_trend = "Stable"
    if len(reports) >= 2:
        recent_classes = [r.get("predicted_class") for r in reports[-3:]]
        if "Osteoporosis" in recent_classes:
            health_trend = "Needs Attention"
        elif "Osteopenia" in recent_classes and "Normal" not in recent_classes[-2:]:
            health_trend = "Monitor Closely"
        elif recent_classes[-1] == "Normal":
            health_trend = "Good"
    
    return {
        "total_scans": total_scans,
        "class_distribution": class_counts,
        "confidence_stats": confidence_stats,
        "timeline_data": timeline_data,
        "health_trend": health_trend
    }

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

# Endpoint to validate if an uploaded image is an X-ray
@app.post("/validate-xray/", response_model=dict)
async def validate_xray_image(file: UploadFile = File(...)):
    """
    Validate if an uploaded image is a bone X-ray without saving it permanently.
    Updated for processed X-ray images.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    temp_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"temp_{temp_id}{file_extension}"
    temp_path = IMAGES_FOLDER / temp_filename
    
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        is_valid_xray = is_xray_image(str(temp_path), debug=True)
        
        os.remove(temp_path)
        
        return {
            "is_xray": is_valid_xray,
            "message": "Valid bone X-ray image" if is_valid_xray else "Not a valid bone X-ray image",
            "filename": file.filename
        }
        
    except Exception as e:
        if temp_path.exists():
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Error validating image: {str(e)}")

# Endpoint to get image by ID
@app.get("/images/{image_id}")
async def get_image(image_id: str):
    image_files = list(IMAGES_FOLDER.glob(f"{image_id}*"))
    if not image_files:
        raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
    
    image_path = image_files[0]
    return {"image_path": str(image_path)}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device),
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)