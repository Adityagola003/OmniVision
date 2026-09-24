from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/signup', views.signup),
    path('auth/login', views.login),
    path('auth/logout', views.logout),
    path('process-images', views.process_image),
    path('gallery', views.get_gallery),
    path('gallery/<int:pk>/', views.delete_photo),
    path('gallery/<int:pk>/share', views.share_photo),
    path('share/<uuid:token>', views.public_share),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)