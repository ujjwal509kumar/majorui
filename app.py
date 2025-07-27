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

app = FastAPI(title="Bone Disease Detection API - PyTorch", 
              description="API for predicting bone diseases from X-ray images using EfficientNet-B4 PyTorch model",
              version="2.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)


MODEL_SAVE_PATH = pathlib.Path('./models')  
MODEL_FILENAME = 'pytorch_osteoporosis_model.pth' 
DATA_FOLDER = pathlib.Path('./public/bone_data')  
IMAGES_FOLDER = DATA_FOLDER / 'images' 
REPORTS_FOLDER = DATA_FOLDER / 'reports'  


IMG_SIZE = 512 
IMG_HEIGHT = IMG_SIZE
IMG_WIDTH = IMG_SIZE


CLASS_NAMES = ['normal', 'osteopenia', 'osteoporosis'] 
CLASS_NAMES_DISPLAY = ['Normal', 'Osteopenia', 'Osteoporosis'] 

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🔧 API using device: {device}")


for folder in [DATA_FOLDER, IMAGES_FOLDER, REPORTS_FOLDER]:
    if not folder.exists():
        folder.mkdir(parents=True)

def is_xray_image(image_path: str, debug: bool = False) -> bool:

    try:
        with Image.open(image_path) as img:
            if debug:
                print(f"Analyzing image: {image_path}")
                print(f"Image size: {img.width} x {img.height}")
            
            # Basic size check - reasonable minimum
            if img.width < 100 or img.height < 100:
                if debug: print("❌ Failed: Image too small")
                return False
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img_array = np.array(img)
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            
            # Contrast check based on your data
            contrast = gray.std()
            if debug: print(f"Contrast: {contrast:.2f} (need: 30-120)")
            if contrast < 30 or contrast > 120:
                if debug: print("❌ Failed: Contrast out of range")
                return False
            
            # Color variance check - X-rays should be mostly grayscale
            img_stat = ImageStat.Stat(img)
            color_variance = np.var(img_stat.mean)
            if debug: print(f"Color variance: {color_variance:.2f} (need: <10)")
            if color_variance > 10:
                if debug: print("❌ Failed: Too much color variation")
                return False
            
            # Brightness check based on your data range
            mean_brightness = np.mean(gray)
            if debug: print(f"Mean brightness: {mean_brightness:.2f} (need: 30-90)")
            if mean_brightness < 30 or mean_brightness > 90:
                if debug: print("❌ Failed: Brightness out of range")
                return False
            
            # Histogram analysis
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            total_pixels = gray.shape[0] * gray.shape[1]
            
            # Dark pixel ratio check
            dark_pixels = np.sum(hist[0:80])  # Adjusted threshold
            dark_ratio = dark_pixels / total_pixels
            if debug: print(f"Dark pixel ratio: {dark_ratio:.3f} (need: >0.35)")
            if dark_ratio < 0.35:
                if debug: print("❌ Failed: Not enough dark background")
                return False
            
            # Bright pixel ratio check
            bright_pixels = np.sum(hist[120:256])  # Adjusted threshold
            bright_ratio = bright_pixels / total_pixels
            if debug: print(f"Bright pixel ratio: {bright_ratio:.3f} (need: >0.04)")
            if bright_ratio < 0.04:
                if debug: print("❌ Failed: Not enough bright structures")
                return False
            
            # Edge density check
            edges = cv2.Canny(gray, 30, 120)
            edge_density = np.sum(edges > 0) / total_pixels
            if debug: print(f"Edge density: {edge_density:.4f} (need: >0.001)")
            if edge_density < 0.001:
                if debug: print("❌ Failed: Edge density too low")
                return False
            
            # Aspect ratio check based on your data
            height, width = gray.shape
            aspect_ratio = max(width, height) / min(width, height)
            if debug: print(f"Aspect ratio: {aspect_ratio:.2f} (need: <4)")
            if aspect_ratio > 4:
                if debug: print("❌ Failed: Aspect ratio too extreme")
                return False
            
            # Saturation check - X-rays should have very low saturation
            hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
            saturation = hsv[:,:,1]
            avg_saturation = np.mean(saturation)
            if debug: print(f"Average saturation: {avg_saturation:.2f} (need: <10)")
            if avg_saturation > 10:
                if debug: print("❌ Failed: Too much color saturation")
                return False
            
            if debug: print("✅ All checks passed - Valid X-ray image")
            return True
            
    except Exception as e:
        print(f"Error validating X-ray image: {e}")
        return False

class OptimizedOsteoporosisModel(nn.Module):
    def __init__(self, num_classes=3):
        super(OptimizedOsteoporosisModel, self).__init__()
        
        # EfficientNet-B4 as backbone
        self.backbone = models.efficientnet_b4(pretrained=False) 
        
        num_features = self.backbone.classifier[1].in_features
        
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

transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

model = None

@app.on_event("startup")
async def startup_event():
    global model
    model_full_path = MODEL_SAVE_PATH / MODEL_FILENAME
    
    if model_full_path.exists():
        try:
            model = OptimizedOsteoporosisModel(num_classes=len(CLASS_NAMES))
            
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
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    image_filename = f"{image_id}{file_extension}"
    image_path = IMAGES_FOLDER / image_filename
    
    try:
        contents = await file.read()
        with open(image_path, "wb") as f:
            f.write(contents)
        
        if not is_xray_image(str(image_path)):
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
    
    if model is None:
        raise HTTPException(status_code=503, detail="PyTorch model not loaded. Please try again later.")
    
    image_files = list(IMAGES_FOLDER.glob(f"{image_id}*"))
    if not image_files:
        raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
    
    image_path = image_files[0]
    
    if not is_xray_image(str(image_path)):
        raise HTTPException(
            status_code=400, 
            detail="The image does not appear to be a valid X-ray image for bone disease prediction."
        )
    
    try:
        image = cv2.imread(str(image_path))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            predicted_class_idx = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][predicted_class_idx].item()
        
        predicted_class_name = CLASS_NAMES_DISPLAY[predicted_class_idx]
        confidence_percentage = float(confidence * 100)
        
        probs_numpy = probabilities[0].cpu().numpy()
        class_probs = {CLASS_NAMES_DISPLAY[i]: float(probs_numpy[i] * 100) for i in range(len(CLASS_NAMES_DISPLAY))}
        
        timestamp = datetime.now().isoformat()
        
        report_id = str(uuid.uuid4())
        report_data = ReportData(
            image_id=image_id,
            predicted_class=predicted_class_name,
            confidence=confidence_percentage,
            class_probabilities=class_probs,
            timestamp=timestamp,
            user_id=user_id
        )
        
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
    
    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return reports

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

@app.get("/images/{image_id}")
async def get_image(image_id: str):
    image_files = list(IMAGES_FOLDER.glob(f"{image_id}*"))
    if not image_files:
        raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
    
    image_path = image_files[0]
    return {"image_path": str(image_path)}

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