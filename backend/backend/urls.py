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
from django.urls import path

from api.oauth import oauthDiscord, oauth42, oauthGitHub, \
    exchangeCodeDiscord, exchangeCode42, exchangeCodeGitHub

urlpatterns = [
    path('admin/', admin.site.urls),
    path('oauth/discord', oauthDiscord),
    path('oauth/discord/token', exchangeCodeDiscord),
    path('oauth/42', oauth42),
    path('oauth/42/token', exchangeCode42),
    path('oauth/github', oauthGitHub),
    path('oauth/github/token', exchangeCodeGitHub),
]
