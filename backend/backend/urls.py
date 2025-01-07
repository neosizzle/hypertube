"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from rest_framework.urlpatterns import format_suffix_patterns

from app_users import views as app_users_views
from video import views as video_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Users and auth
	path('api/users', app_users_views.AppUserList.as_view()),
    path('api/users/picture', app_users_views.AppUserPicture.as_view()),
    path('api/users/me', app_users_views.AppUserDetail.as_view()),
    path('api/auth/login', app_users_views.AuthLogin.as_view()),
    path('api/auth/otp',  app_users_views.OTPRequest.as_view()),
    path('api/auth/reset',  app_users_views.PwReset.as_view()),
    path('api/oauth',  app_users_views.OAuthProvider.as_view()),

    # videos
    path('api/videos', video_views.VideoList.as_view()),
    path('api/comments', video_views.CommentList.as_view()),

]

from django.conf import settings
from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)