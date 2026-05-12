from django.db import models

class Photo(models.Model):
    image = models.ImageField(upload_to='uploads/')
    processed_image = models.ImageField(upload_to='processed/', null=True, blank=True)
    title = models.CharField(max_length=100, blank=True)
    caption = models.TextField(blank=True)
    category = models.CharField(max_length=50, default="Uncategorized")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title or 'Photo'} ({self.category})"