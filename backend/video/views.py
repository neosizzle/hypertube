import os
import requests
import time
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from rest_framework import status
from urllib.parse import urlencode
from secrets import token_urlsafe
from django.shortcuts import redirect
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from PIL import Image
from dotenv import load_dotenv
import yagmail

from logging import info, error

load_dotenv()

from .models import Video, Comment
from .serializers import VideoSerializer, CommentSerializer

class VideoList(APIView):
	# NOTE should search external sources be done by frontend and this endpoint only list downloaded videos?
	# TODO: add search- filters and pagination
	def get(self, request, format=None):
		# NOTE: Dont need ot handle sorting right...?
		name = request.query_params.get('name', "")
		min_rating = request.query_params.get('min_rating', '0')

		try:
			min_rating = int(min_rating)
		except ValueError:
			return Response({"detail": "min_rating must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

		# filter data
		videos = Video.objects.filter(name__startswith=name, rating__gte=min_rating).order_by('name')
		
		# paginate data
		paginator = LimitOffsetPagination()
		paginator.default_limit = 10
		paginator.max_limit = 50
		result_page = paginator.paginate_queryset(videos, request)
		serializer = VideoSerializer(result_page, many=True)
		return Response({
            "total_count": videos.count(),
            "results": serializer.data
        })

	def post(self, request, format=None):
		serializer = VideoSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VideoDetail(APIView):
	def get(self, request, pk, format=None):
		try:
			video = Video.objects.get(pk=pk)
			serializer = VideoSerializer(video)
			return Response(serializer.data)
		except Video.DoesNotExist:
			return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
		except Exception as e:
			error(e)
			return Response({"detail": e}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VideoWatchedDetail(APIView):
	def post(self, request, pk, format=None):
		try:
			video = Video.objects.get(pk=pk)
			user = request.app_user
			video.watched_by.add(user)
			serializer = VideoSerializer(video)
			return Response(serializer.data)
		except Video.DoesNotExist:
			return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
		except Exception as e:
			error(e)
			return Response({"detail": e}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CommentList(APIView):
	# NOTE: Required query parameters: video_id
	def get(self, request, format=None):
		video_id = request.query_params.get('video_id')
		
		if not video_id:
			return Response({"detail": "video_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

		try:
			video = Video.objects.get(id=video_id)
			comments = Comment.objects.filter(video=video)
			serializer = CommentSerializer(comments, many=True)
			return Response(serializer.data)
		except Video.DoesNotExist:
			return Response({"detail": "Video not found."}, status=status.HTTP_404_NOT_FOUND)
	

	def post(self, request, format=None):
		body = request.data

		body['user'] = request.app_user.id
		serializer = CommentSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SearchExternalSource(APIView):
    
    OMBD_API_ENDPOINT = f'http://www.omdbapi.com/'
    DEFAULT_CHUNK_SIZE = 6
    
    def get(self, request, format=None):
        
        query = request.query_params.get('query')
        chunk_size = request.query_params.get('chunk_size')
        
        if not chunk_size:
            chunk_size = self.DEFAULT_CHUNK_SIZE
        
        if not query:
            return Response({"detail": "query must not be empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        params = {
            'apikey': os.getenv('OMDB_KEY'),
            's': query
        }
        
        url = f'{self.OMBD_API_ENDPOINT}?{urlencode(params)}'
        response = requests.get(url)
        
        if response.status_code != 200:
            return Response({"detail": "external endpoint died"}, status=status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        
        if ('Error' in data.keys()):
            return Response({"detail": data['Error']}, status=status.HTTP_404_NOT_FOUND)
        
        data = response.json()['Search']
        
        res = []
        
        for i in range(0, len(data), chunk_size):
            res.append(data[i: i + chunk_size])
        
        return Response(res, status=status.HTTP_200_OK)

class ShowInfo(APIView):
    
    OMBD_API_ENDPOINT = f'http://www.omdbapi.com/'
    
    def get(self, request, format=None):
        
        imdb_id = request.query_params.get('imdb_id')
        
        if not imdb_id:
            return Response({"detail": "imdb_id must not be empty"}, status=status.HTTP_400_BAD_REQUEST)

        params = {
            'apikey': os.getenv('OMDB_KEY'),
            'i': imdb_id,
            'plot': 'full'
        }
        
        url = f'{self.OMBD_API_ENDPOINT}?{urlencode(params)}'
        response = requests.get(url)
        
        if response.status_code != 200:
            return Response({"detail": "external endpoint died"}, status=status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        
        del data['Response']
        
        return Response(data, status=status.HTTP_200_OK)
