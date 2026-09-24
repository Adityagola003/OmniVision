import os
import sys
import types
import cv2
import requests
import numpy as np
from PIL import Image, ImageFilter
from django.conf import settings

try:
    import torch
    from torchvision import models, transforms

    # BasicSR 1.4.2 imports this module name, which was removed in TorchVision 0.17.
    try:
        import torchvision.transforms.functional_tensor
    except ModuleNotFoundError:
        from torchvision.transforms.functional import rgb_to_grayscale

        functional_tensor = types.ModuleType("torchvision.transforms.functional_tensor")
        functional_tensor.rgb_to_grayscale = rgb_to_grayscale
        sys.modules["torchvision.transforms.functional_tensor"] = functional_tensor
except ImportError:
    torch = None
    models = None
    transforms = None

try:
    from transformers import pipeline
except ImportError:
    pipeline = None

try:
    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer
except ImportError:
    RRDBNet = None
    RealESRGANer = None

try:
    from gfpgan import GFPGANer
except ImportError:
    GFPGANer = None

# --- Configuration ---
LABELS_URL = "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"
LABELS_PATH = os.path.join(settings.BASE_DIR, "imagenet_classes.txt")
imagenet_labels = []

upsampler = None
face_enhancer = None
classification_model = None
classification_preprocess = None
caption_classifier = None
caption_generator = None

DEVICE = "cuda" if torch is not None and torch.cuda.is_available() else "cpu"
print(f"--- AI PIPELINE DETECTED: {DEVICE.upper()} ---")

def download_files():
    global imagenet_labels
    if not imagenet_labels and os.path.exists(LABELS_PATH):
        with open(LABELS_PATH, "r") as f:
            imagenet_labels = [line.strip() for line in f.readlines()]


def init_real_esrgan():
    """Initialize Real-ESRGAN upsampler with local download fallback"""
    global upsampler
    
    if upsampler is not None:
        return upsampler

    if RRDBNet is None or RealESRGANer is None:
        print("Real-ESRGAN dependencies are unavailable; using standard upscaling.")
        return None
    
    print("Initializing Real-ESRGAN upsampler...")
    
    models_dir = os.path.join(settings.BASE_DIR, "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "RealESRGAN_x4plus.pth")
    
    if not os.path.exists(model_path):
        print(f"Downloading RealESRGAN_x4plus.pth to {model_path} (this might take a minute)...")
        url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("✓ Real-ESRGAN download complete!")
        except Exception as e:
            print(f"✗ Real-ESRGAN download failed: {e}")
            print("Proceeding with GFPGAN only (face will be enhanced, background won't).")
            return None
            
    try:
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        upsampler = RealESRGANer(
            scale=4,
            model_path=model_path,
            model=model,
            tile=200,  # Lower tile size prevents GPU memory crashes
            tile_pad=10,
            pre_pad=0,
            half=DEVICE == "cuda"
        )
        print("✓ Real-ESRGAN upsampler ready!")
        return upsampler
    except Exception as e:
        print(f"✗ Real-ESRGAN initialization failed: {e}")
        return None


def init_gfpgan():
    """Initialize GFPGAN for face enhancement only"""
    global face_enhancer
    
    if face_enhancer is not None:
        return face_enhancer

    if GFPGANer is None:
        print("GFPGAN dependencies are unavailable; skipping face enhancement.")
        return None
    
    print("Initializing GFPGAN face enhancer...")
    model_urls = [
        'https://huggingface.co/TencentARC/GFPGAN/resolve/main/GFPGANv1.3.pth',
        'https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth',
    ]
    
    for url in model_urls:
        try:
            print(f"  Trying: {url.split('/')[-1]}...")
            face_enhancer = GFPGANer(
                model_path=url,
                upscale=1,  # We upscale manually beforehand now
                arch='clean',
                channel_multiplier=2,
                bg_upsampler=None,
                device=DEVICE
            )
            print("✓ GFPGAN face enhancer ready!")
            return face_enhancer
        except Exception as e:
            print(f"  ✗ {url.split('/')[-1]} failed: {e}")
            continue
    
    print("✗ GFPGAN initialization failed from all sources!")
    return None


def enhance_image(image_path):
    print(f"--- Enhancing: {os.path.basename(image_path)} ---")
    download_files()

    try:
        img = cv2.imread(image_path)
        if img is None:
            print(f"Failed to load image: {image_path}")
            return None

        print(f"Image shape: {img.shape}, dtype: {img.dtype}")

        # Check image dimensions
        height, width = img.shape[:2]
        if width < 32 or height < 32:
            print(f"Image too small for enhancement: {width}x{height}")
            return None
        if width > 4096 or height > 4096:
            print(f"Image too large for enhancement: {width}x{height}")
            return None

        # Initialize models
        global upsampler, face_enhancer
        upsampler = init_real_esrgan()
        
        face_enhancer = init_gfpgan()
        
        if face_enhancer is None and upsampler is None:
            print("✗ Both enhancement models failed to initialize")
            return None

        output = img

        # 1. Explicitly upscale the background first
        if upsampler is not None:
            print("Upscaling entire image explicitly with Real-ESRGAN...")
            try:
                # outscale=2 downsamples the 4x AI output to 2x for much denser, sharper pixels
                output, _ = upsampler.enhance(output, outscale=2)
                print("✓ Real-ESRGAN background upscaling complete!")
            except Exception as e:
                print(f"✗ Real-ESRGAN failed during processing: {e}")
                output = cv2.resize(output, (0, 0), fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
                print("  Used standard bicubic 2x upscale as fallback.")
        else:
            print("Real-ESRGAN not available, using standard 2x upscale.")
            output = cv2.resize(output, (0, 0), fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

        # 2. Process face with GFPGAN
        if face_enhancer is not None:
            print("Enhancing faces with GFPGAN...")
            _, _, output = face_enhancer.enhance(output, has_aligned=False, only_center_face=False, paste_back=True, weight=0.6)
            print("✓ GFPGAN face enhancement complete!")
        
        # Save output
        output_filename = f"enhanced_{os.path.basename(image_path)}"
        output_dir = os.path.join(settings.MEDIA_ROOT, "processed")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)

        # Counteract Real-ESRGAN's "plastic/smooth" look on the background
        print("Applying aggressive sharpening and texture restoration...")
        
        # 1. Stronger Detail Enhancement for micro-textures
        output = cv2.detailEnhance(output, sigma_s=10, sigma_r=0.25)
        
        # 2. Stronger Unsharp Masking for crisper edges
        gaussian_blur = cv2.GaussianBlur(output, (0, 0), 2.0)
        output = cv2.addWeighted(output, 1.5, gaussian_blur, -0.5, 0)
        
        # 3. Add subtle film grain (noise) to break up the smooth AI painting effect
        row, col, ch = output.shape
        gauss_noise = np.random.normal(0, 3, (row, col, ch)).astype(np.float32)
        output = np.clip(output.astype(np.float32) + gauss_noise, 0, 255).astype(np.uint8)
        
        cv2.imwrite(output_path, output)
        print("✓ Saved enhanced and sharpened image!")

        print(f"✓ Successfully enhanced: {output_filename}")
        return f"processed/{output_filename}"

    except Exception as e:
        print(f"✗ ENHANCEMENT CRASHED: {e}")
        import traceback
        traceback.print_exc()
        return None

def classify_image(image_path):
    print(f"--- Classifying ({DEVICE}) ---")
    download_files() 

    global classification_model, classification_preprocess

    if models is None or transforms is None or torch is None:
        print("Torchvision dependencies are unavailable; skipping classification.")
        return "Unknown"
    
    try:
        if classification_model is None:
            print("Loading image classification model...")
            classification_model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            classification_model.to(DEVICE)
            classification_model.eval()
            classification_preprocess = transforms.Compose([
                transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ])
        
        img = Image.open(image_path).convert('RGB')
        input_tensor = classification_preprocess(img).unsqueeze(0).to(DEVICE)
        
        with torch.inference_mode():
            output = classification_model(input_tensor)
        
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
    global caption_classifier, caption_generator

    if pipeline is None:
        print("Transformers dependencies are unavailable; using fallback caption.")
        return "A photo"

    try:
        # BLIP describes the scene instead of turning one classification label into a caption.
        gpu_id = 0 if DEVICE == "cuda" else -1
        if caption_generator is None:
            print("Loading caption model...")
            caption_generator = pipeline(
                "image-to-text",
                model="Salesforce/blip-image-captioning-base",
                device=gpu_id,
            )
        results = caption_generator(
            image_path,
            max_new_tokens=32,
            num_beams=4,
            do_sample=False,
        )
        caption = results[0].get("generated_text", "").strip() if results else ""
        return caption[:500] if caption else "A photo"
    except Exception as e:
        print(f"CAPTIONING FAILED: {e}")
        if caption_classifier is None:
            caption_classifier = pipeline(
                "image-classification",
                model="google/vit-base-patch16-224",
                device=gpu_id,
                top_k=1,
            )
        results = caption_classifier(image_path)
        label = results[0]['label'].replace('_', ' ').title() if results else "photo"
        return f"A photo of {label.lower()}"