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
from datetime import datetime

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
    
    TMDB_IMAGE_PATH = 'https://image.tmdb.org/t/p/original'
    TMDB_API_ENDPOINT_TV = 'https://api.themoviedb.org/3/search/tv'
    TMDB_API_ENDPOINT_MOVIE = 'https://api.themoviedb.org/3/search/movie'
    DEFAULT_CHUNK_SIZE = 6
    DEFAULT_POSTER_PATH = 'http://localhost:8000/media/thumbnail/default.png'
    
    def get(self, request, format=None):
        
        query = request.query_params.get('query')
        chunk_size = request.query_params.get('chunk_size')
        
        if not chunk_size:
            chunk_size = self.DEFAULT_CHUNK_SIZE
        
        if not query:
            return Response({"detail": "query must not be empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        params = {
            'query': query,
            'api_key': os.getenv('TMDB_KEY')
        }
        
        tv_response = requests.get(f'{self.TMDB_API_ENDPOINT_TV}?{urlencode(params)}')
        movie_response = requests.get(f'{self.TMDB_API_ENDPOINT_MOVIE}?{urlencode(params)}')
        
        tv_results = tv_response.json()['results']
        movie_results = movie_response.json()['results']
        
        results = []
        
        for r in tv_results:
            
            results.append({
                'title': r['name'],
                'date': r.get('first_air_date', ''),
                'type': 'tv',
                'poster_path': self.TMDB_IMAGE_PATH + r['poster_path']  if r.get('poster_path') else self.DEFAULT_POSTER_PATH,
                'id': r['id']
            })
        
        for r in movie_results:
            
            results.append({
                'title': r['title'],
                'date': r.get('release_date', ''),
                'type': 'movie',
                'poster_path': self.TMDB_IMAGE_PATH + r['poster_path']  if r.get('poster_path') else self.DEFAULT_POSTER_PATH,
                'id': r['id']
            })

        results = sorted(results, key=lambda x : x.get('title', ''))
        
        results = filter(lambda x:  x.get('date') != '' and datetime.strptime(x.get('date'),'%Y-%m-%d') <= datetime.now(), results)
        
        return Response(results, status=status.HTTP_200_OK)

class TrendingShows(APIView):
    
    TMDB_IMAGE_PATH = 'https://image.tmdb.org/t/p/original'
    TMDB_API_ENDPOINT = 'https://api.themoviedb.org/3'
    DEFAULT_POSTER_PATH = 'http://localhost:8000/media/thumbnail/default.png'

    def get(self, request, format=None):

        type = request.query_params.get('type')

        params = {
            'api_key': os.getenv('TMDB_KEY')
        }
        
        url = f'{self.TMDB_API_ENDPOINT}/{type}/popular?{urlencode(params)}'

        movie_response = requests.get(url)
        
        results = movie_response.json()['results']
        
        results = [{
            'title': r['title'] if type == 'movie' else r['name'],
            'date': r.get('release_date', ''),
            'type': type,
            'poster_path': self.TMDB_IMAGE_PATH + r['poster_path']  if r.get('poster_path') else self.DEFAULT_POSTER_PATH,
            'id': r['id']
        } for r in results]

        return Response(results, status=status.HTTP_200_OK)

class ShowInfo(APIView):
    
    TMDB_IMAGE_PATH = 'https://image.tmdb.org/t/p/original'
    TMDB_API_ENDPOINT = 'https://api.themoviedb.org/3'
    DEFAULT_POSTER_PATH = 'http://localhost:8000/media/thumbnail/default.png'
    
    def get(self, request, format=None):
        
        tmdb_id = request.query_params.get('id')
        type = request.query_params.get('type')
        
        if not (tmdb_id or type):
            return Response({"detail": "id or type must not be empty"},
                            status=status.HTTP_400_BAD_REQUEST)

        params = { 'api_key': os.getenv('TMDB_KEY') }
        
        url = f'{self.TMDB_API_ENDPOINT}/{type}/{tmdb_id}?{urlencode(params)}'
        response = requests.get(url)
        
        if response.status_code != 200:
            return Response({"detail": "external endpoint died"},
                            status=status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        
        payload = {k: data[k] for k in (
            'adult', 'backdrop_path', 'genres', 'homepage', 'id',
            'original_language', 'overview', 'popularity', 'poster_path',
            'production_companies', 'production_countries', 'spoken_languages',
            'tagline', 'vote_average', 'vote_count'
        )}
        
        payload['title'] = data['title'] if type == 'movie' else data['name']
        payload['original_title'] = data['original_title'] if type == 'movie' else data['original_name']
        payload['type'] = type
        payload['details'] = {k: data[k] for k in (
            'budget', 'imdb_id', 'release_date', 'revenue', 'runtime', 'status'
        )} if type == 'movie' else {k: data[k] for k in (
            'episode_run_time', 'first_air_date', 'in_production', 'languages',
            'last_air_date', 'last_episode_to_air', 'next_episode_to_air',
            'networks', 'number_of_episodes', 'number_of_seasons',
            'origin_country', 'seasons'
        )}
        
        payload['poster_path'] = self.TMDB_IMAGE_PATH + payload['poster_path'] \
            if payload.get('poster_path') else self.DEFAULT_POSTER_PATH
        payload['backdrop_path'] = self.TMDB_IMAGE_PATH + payload['backdrop_path'] \
            if payload.get('backdrop_path') else self.DEFAULT_POSTER_PATH
        
        return Response(payload, status=status.HTTP_200_OK)

class SeasonInfo(APIView):

    TMDB_IMAGE_PATH = 'https://image.tmdb.org/t/p/original'
    TMDB_API_ENDPOINT = 'https://api.themoviedb.org/3'
    DEFAULT_POSTER_PATH = 'http://localhost:8000/media/thumbnail/default.png'
    
    def get(self, request, format=None):
        
        tmdb_id = request.query_params.get('id')
        season_number = request.query_params.get('season_number')
        
        if not (tmdb_id or season_number):
            return Response({"detail": "id or season_number must not be empty"},
                            status=status.HTTP_400_BAD_REQUEST)

        params = { 'api_key': os.getenv('TMDB_KEY') }
        
        url = f'{self.TMDB_API_ENDPOINT}/tv/{tmdb_id}/season/{season_number}?{urlencode(params)}'
        response = requests.get(url)
        
        if response.status_code != 200:
            return Response({"detail": "external endpoint died"},
                            status=status.HTTP_404_NOT_FOUND)
        
        data = response.json()
        
        payload = {k: data[k] for k in (
            'air_date', 'name', 'overview', 'id', 'season_number', 'vote_average'
        )}
        
        payload['title'] = data['name']
        payload['episodes'] = [{k: v for k, v in ep.items() if k not in ('crew', 'guest_stars')}
                               for ep in data['episodes']]

        for i, ep in enumerate(payload['episodes']):
            payload['episodes'][i]['still_path'] = self.TMDB_IMAGE_PATH + ep['still_path'] \
            if ep.get('still_path') else self.DEFAULT_POSTER_PATH
        
        return Response(payload, status=status.HTTP_200_OK)