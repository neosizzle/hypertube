import os
import requests
import logging
from django.shortcuts import redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from urllib.parse import urlencode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DISCORD_AUTH_URL = 'https://discord.com/oauth2/authorize'
DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token'
INTRA_42_AUTH_URL = 'https://api.intra.42.fr/oauth/authorize'
INTRA_42_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

REDIRECT_URI = 'http://localhost:3000/success'

@api_view(['GET'])
def oauth42(request):
    
    scope = "public"
    state = "42" # ! change this to include one passed by caller
    
    query_params = {
        'response_type' : 'code',
        'client_id': os.getenv('42_CLIENT_ID'),
        'redirect_uri': REDIRECT_URI,
        'scope': scope,
        'state': state
    }
    
    url = f"{INTRA_42_AUTH_URL}?{urlencode(query_params)}"
    
    return redirect(url)

@api_view(['GET'])
def oauthGitHub(request):
    
    state = "github"
    scope = "user:email read:user"
    
    query_params = {
        'client_id': os.getenv('GITHUB_CLIENT_ID'),
        'redirect_uri': REDIRECT_URI,
        'state': state,
        'scope': scope
    }
    
    url = f"{GITHUB_AUTH_URL}?{urlencode(query_params)}"
    
    return redirect(url)

@api_view(['GET'])
def oauthDiscord(request):
    
    scope = "identify email"
    state = "discord" # ! change this to include one passed by caller
    
    query_params = {
        'response_type' : 'code',
        'client_id': os.getenv('DISCORD_CLIENT_ID'),
        'redirect_uri': REDIRECT_URI,
        'scope': scope,
        'state': state
    }
    
    url = f"{DISCORD_AUTH_URL}?{urlencode(query_params)}"
    
    return redirect(url)

@api_view(['POST'])
def exchangeCodeDiscord(request):
    
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        'client_id': os.getenv('DISCORD_CLIENT_ID'),
        'client_secret': os.getenv('DISCORD_CLIENT_SECRET'),
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
    }

    response = requests.post(DISCORD_TOKEN_URL, headers=headers, data=data)
    response.raise_for_status()
    
    logging.info(f"{response.json()}")
    
    return Response(status=status.HTTP_200_OK)

@api_view(['POST'])
def exchangeCode42(request):

    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')

    data = {
        'client_id': os.getenv('42_CLIENT_ID'),
        'client_secret': os.getenv('42_CLIENT_SECRET'),
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    response = requests.post(INTRA_42_TOKEN_URL, data=data, headers=headers)
    response.raise_for_status()
    
    logging.info(f"{response.json()}")
    
    return Response(status=status.HTTP_200_OK)

@api_view(['POST'])
def exchangeCodeGitHub(request):

    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')

    data = {
        'client_id': os.getenv('GITHUB_CLIENT_ID'),
        'client_secret': os.getenv('GITHUB_CLIENT_SECRET'),
        'code': code,
        'redirect_uri': redirect_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    }
    
    response = requests.post(GITHUB_TOKEN_URL, data=data, headers=headers)
    response.raise_for_status()
    
    logging.info(f"{response.json()}")
    
    return Response(status=status.HTTP_200_OK)
