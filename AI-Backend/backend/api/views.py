from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Photo
from .ml_utils import enhance_image, classify_image, caption_image
from django.conf import settings
import os

@api_view(['POST'])
def process_image(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    
    # Save Initial Photo
    photo = Photo.objects.create(image=file, title=file.name)
    full_path = os.path.join(settings.MEDIA_ROOT, photo.image.name)

    try:
        # A. Classification
        category = classify_image(full_path)
        photo.category = category.replace('_', ' ').title()

        # B. Captioning
        caption = caption_image(full_path)
        photo.caption = caption

        # C. Enhancement
        processed_rel_path = enhance_image(full_path) 
        if processed_rel_path:
            photo.processed_image = processed_rel_path
            print(f"Enhancement successful for {file.name}")
        else:
            print(f"Enhancement failed for {file.name}")
            photo.processed_image = None

        photo.is_processed = True
        photo.save()

        return Response({
            'message': 'Image processed successfully',
            'data': {
                'id': photo.id,
                'title': photo.title,
                'category': photo.category,
                'caption': photo.caption,
                'image_url': request.build_absolute_uri(photo.image.url),
                'processed_url': request.build_absolute_uri(photo.processed_image.url) if photo.processed_image else None
            }
        })

    except Exception as e:
        print(e)
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_gallery(request):
    photos = Photo.objects.all().order_by('-uploaded_at')
    data = []
    for p in photos:
        data.append({
            'id': p.id,
            'title': p.title,
            'caption': p.caption,
            'category': p.category,
            'url': request.build_absolute_uri(p.processed_image.url if p.processed_image else p.image.url),
            'original_url': request.build_absolute_uri(p.image.url),
            'date': p.uploaded_at.strftime("%b %d, %Y")
        })
    return Response(data)