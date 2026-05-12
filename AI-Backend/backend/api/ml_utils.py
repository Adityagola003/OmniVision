import os
import torch
import cv2
import requests
import numpy as np
from PIL import Image
from torchvision import models, transforms #HuggingFace
from transformers import pipeline
from django.conf import settings

# --- Configuration ---
MODEL_NAME = "FSRCNN_x3.pb"
MODEL_URL = "https://github.com/Saafke/FSRCNN_Tensorflow/raw/master/models/FSRCNN_x3.pb"
MODEL_PATH = os.path.join(settings.BASE_DIR, MODEL_NAME)


LABELS_URL = "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"
LABELS_PATH = os.path.join(settings.BASE_DIR, "imagenet_classes.txt")
imagenet_labels = []


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"--- AI PIPELINE DETECTED: {DEVICE.upper()} ---")

def download_files():
   
    # 1. Download Model
    if not os.path.exists(MODEL_PATH):
        print(f"Downloading {MODEL_NAME}...")
        response = requests.get(MODEL_URL)
        with open(MODEL_PATH, "wb") as f:
            f.write(response.content)
            
    # 2. Download Labels
    if not os.path.exists(LABELS_PATH):
        print("Downloading ImageNet Labels...")
        response = requests.get(LABELS_URL)
        with open(LABELS_PATH, "w") as f:
            f.write(response.text)

    
    global imagenet_labels
    if not imagenet_labels and os.path.exists(LABELS_PATH):
        with open(LABELS_PATH, "r") as f:
            imagenet_labels = [line.strip() for line in f.readlines()]

def enhance_image(image_path):
    print(f"--- Enhancing: {os.path.basename(image_path)} ---")
    download_files()

    try:
        img = cv2.imread(image_path)
        if img is None:
            print(f"Failed to load image: {image_path}")
            return None

        print(f"Image shape: {img.shape}, dtype: {img.dtype}")

        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        elif img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        # Check if image is too small or too large
        height, width = img.shape[:2]
        if width < 32 or height < 32:
            print(f"Image too small for enhancement: {width}x{height}")
            return None
        if width > 4096 or height > 4096:
            print(f"Image too large for enhancement: {width}x{height}")
            return None

        # Alternative enhancement using basic image processing
        print("Using alternative enhancement method...")

        # Apply bilateral filter for noise reduction while keeping edges sharp
        filtered = cv2.bilateralFilter(img, 9, 75, 75)

        # Apply slight sharpening
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        sharpened = cv2.filter2D(filtered, -1, kernel)

        # Apply contrast enhancement
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced_lab = cv2.merge([l, a, b])
        result = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        print(f"Alternative enhancement completed. Result shape: {result.shape}")

        output_filename = f"enhanced_{os.path.basename(image_path)}"
        output_dir = os.path.join(settings.MEDIA_ROOT, "processed")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)

        success = cv2.imwrite(output_path, result)
        if success:
            print(f"Successfully saved enhanced image: {output_path}")
            return f"processed/{output_filename}"
        else:
            print(f"Failed to save enhanced image: {output_path}")
            return None

    except Exception as e:
        print(f"ENHANCEMENT CRASHED: {e}")
        import traceback
        traceback.print_exc()
        return None

def classify_image(image_path):
    print(f"--- Classifying ({DEVICE}) ---")
    download_files() 
    
    try:
        model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        model.to(DEVICE)
        model.eval()
        
        preprocess = transforms.Compose([
            transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        img = Image.open(image_path).convert('RGB')
        input_tensor = preprocess(img).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            output = model(input_tensor)
        
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        _, top_id = torch.topk(probabilities, 1)
        
        
        index = top_id.item()
        if imagenet_labels and index < len(imagenet_labels):
            category = imagenet_labels[index]
            
            return category.split(',')[0].title()
        
        return f"Object-{index}" # Fallback
        
    except Exception as e:
        print(f"CLASSIFICATION FAILED: {e}")
        return "Unknown"

def caption_image(image_path):
    print(f"--- Captioning ({DEVICE}) ---")
    try:
        gpu_id = 0 if DEVICE == "cuda" else -1
        captioner = pipeline("image-to-text", model="nlpconnect/vit-gpt2-image-captioning", device=gpu_id)
        result = captioner(image_path)
        return result[0]['generated_text']
    except Exception as e:
        print(f"CAPTIONING FAILED: {e}")
        return "A photo."