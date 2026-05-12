from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('process-images', views.process_image),
    path('gallery', views.get_gallery),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)