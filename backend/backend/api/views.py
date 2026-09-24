from rest_framework.decorators import api_view
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Photo
from .ml_utils import enhance_image, classify_image, caption_image
from django.conf import settings
import os

MAX_ORIGINAL_UPLOADS = 5


@api_view(['POST'])
def signup(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    name = request.data.get('name', '').strip()
    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=400)
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=400)
    if User.objects.filter(username=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=409)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    token = Token.objects.create(user=user)
    return Response({'token': token.key, 'user': {'email': user.email, 'name': user.first_name}})


@api_view(['POST'])
def login(request):
    email = request.data.get('email', '').strip().lower()
    user = authenticate(username=email, password=request.data.get('password', ''))
    if user is None:
        return Response({'error': 'Invalid email or password.'}, status=401)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': {'email': user.email, 'name': user.first_name}})


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    request.auth.delete()
    return Response(status=204)


def prune_original_uploads(user):
    photos = Photo.objects.filter(owner=user).exclude(image='').order_by('-uploaded_at', '-id')
    for photo in photos[MAX_ORIGINAL_UPLOADS:]:
        try:
            if photo.image:
                photo.image.delete(save=False)
        except Exception:
            pass


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def process_image(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    
    # Save Initial Photo
    photo = Photo.objects.create(owner=request.user, image=file, title=file.name)
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
        prune_original_uploads(request.user)

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
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_gallery(request):
    photos = Photo.objects.filter(owner=request.user).order_by('-uploaded_at')
    data = []
    for p in photos:
        data.append({
            'id': p.id,
            'title': p.title,
            'caption': p.caption,
            'category': p.category,
            'is_shared': p.is_shared,
            'url': request.build_absolute_uri(p.processed_image.url if p.processed_image else p.image.url),
            'original_url': request.build_absolute_uri(p.image.url),
            'date': p.uploaded_at.strftime("%b %d, %Y")
        })
    return Response(data)


@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_photo(request, pk):
    try:
        photo = Photo.objects.get(pk=pk, owner=request.user)

        # Remove files from storage
        try:
            if photo.image:
                photo.image.delete(save=False)
        except Exception:
            pass

        try:
            if photo.processed_image:
                photo.processed_image.delete(save=False)
        except Exception:
            pass

        photo.delete()
        return Response({'message': 'Photo deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Photo.DoesNotExist:
        return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def share_photo(request, pk):
    try:
        photo = Photo.objects.get(pk=pk, owner=request.user)
    except Photo.DoesNotExist:
        return Response({'error': 'Photo not found'}, status=404)
    if request.method == 'DELETE':
        photo.is_shared = False
        photo.save(update_fields=['is_shared'])
        return Response(status=204)
    photo.is_shared = True
    photo.save(update_fields=['is_shared'])
    return Response({'share_token': str(photo.share_token)})


@api_view(['GET'])
def public_share(request, token):
    try:
        photo = Photo.objects.get(share_token=token, is_shared=True)
    except Photo.DoesNotExist:
        return Response({'error': 'This share link is unavailable.'}, status=404)
    return Response({
        'id': photo.id,
        'title': photo.title,
        'caption': photo.caption,
        'category': photo.category,
        'url': request.build_absolute_uri(photo.processed_image.url if photo.processed_image else photo.image.url),
        'date': photo.uploaded_at.strftime('%b %d, %Y'),
    })