import os
import requests
import logging
from django.shortcuts import redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@api_view(['GET'])
def authDiscord(request):
    return redirect(os.getenv('DISCORD_OAUTH_URL'))

@api_view(['POST'])
def exchangeCodeDiscord(request):
    
    TOKEN_URL = 'https://discord.com/api/oauth2/token'
    CLIENT_ID = os.getenv('DISCORD_CLIENT_ID')
    CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET')
    
    code = request.data.get('code')
    caller_uri = request.data.get('caller_uri')

    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': caller_uri
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    response = requests.post(TOKEN_URL, data=data, headers=headers)
    response.raise_for_status()
    
    logging.info(f"{response.json()}")
    
    return Response(status=status.HTTP_200_OK)