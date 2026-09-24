import uuid

from django.contrib.auth.models import User
from django.db import models

class Photo(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photos', null=True, blank=True)
    image = models.ImageField(upload_to='uploads/')
    processed_image = models.ImageField(upload_to='processed/', null=True, blank=True)
    title = models.CharField(max_length=100, blank=True)
    caption = models.TextField(blank=True)
    category = models.CharField(max_length=50, default="Uncategorized")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, null=True, blank=True)
    is_shared = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title or 'Photo'} ({self.category})"