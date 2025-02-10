import json
import os
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination, PageNumberPagination
from rest_framework import status
from urllib.parse import urlencode
from dotenv import load_dotenv
import re
import urllib.parse
from datetime import datetime
from groq import Groq

from logging import error

load_dotenv()

from .models import Video, Comment
from .serializers import VideoSerializer, CommentSerializer

class VideoList(APIView):
	def get(self, request, format=None):
		# NOTE: Dont need ot handle sorting right...?
		name = request.query_params.get('name', "")

		# filter data
		videos = Video.objects.filter(name__startswith=name).order_by('name')
		
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
	def patch(self, request, pk):
		video = None
		try:
			video = Video.objects.get(pk=pk)
		except Video.DoesNotExist:
			return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
		except Exception as e:
			error(e)
			return Response({"detail": e}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
		serializer = VideoSerializer(video, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)

		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	def get(self, request, pk, format=None):
		try:
			video = Video.objects.get(pk=pk)
			serializer = VideoSerializer(video)
			print(f"{serializer.data}")
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

class CommentsByVideo(APIView):
	# NOTE: Required query parameters: video_id
	def get(self, request, format=None, pk=None):

		video_id = pk
		
		if not video_id:
			return Response({"detail": "video_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

		try:
			video = Video.objects.get(id=video_id)
			comments = Comment.objects.filter(video=video).order_by('-created')
			serializer = CommentSerializer(comments, many=True)
			return Response(serializer.data)
		except Video.DoesNotExist:
			return Response({"detail": "Video not found."}, status=status.HTTP_404_NOT_FOUND)
	

	def post(self, request, format=None, pk=None):

		body = request.data
		body['user'] = request.app_user.id
		body['video'] = pk
		serializer = CommentSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AllComments(APIView):

	def get(self, request, format=None):

		comments = Comment.objects.all()

		# newest items first
		res = comments.order_by('-created')

		p = PageNumberPagination()
		p.page_size = 10
		paginated_comments = p.paginate_queryset(res, request)
		serializer = CommentSerializer(paginated_comments, many=True)

		return p.get_paginated_response(serializer.data)

class CommentByID(APIView):

	def get(self, request, format=None, pk=None):

		try:
			comment = Comment.objects.get(pk=pk)

		except Comment.DoesNotExist:
			return Response({"detail": "Comment not found."},
							status=status.HTTP_404_NOT_FOUND)

		serializer = CommentSerializer(comment)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def delete(self, request, format=None, pk=None):

		try:
			comment = Comment.objects.get(pk=pk)

		except Comment.DoesNotExist:
			return Response({"detail": "Comment not found."},
				status=status.HTTP_404_NOT_FOUND)
			
		comment.delete()
		return Response(status=status.HTTP_200_OK)

TMDB_IMAGE_PATH = 'https://image.tmdb.org/t/p/original'
TMDB_API_ENDPOINT = 'https://api.themoviedb.org/3'
DEFAULT_POSTER_PATH = 'http://localhost:8000/media/thumbnail/default.png'
OMDB_API_ENDPOINT = 'http://www.omdbapi.com/'

class SearchExternalSource(APIView):
	
	def get(self, request, format=None):
		query = request.query_params.get('query')
		page = request.query_params.get('page', 1)
		
		if not query:
			return Response({"detail": "query must not be empty"}, status=status.HTTP_400_BAD_REQUEST)
		
		params = {
			'query': query,
			'api_key': os.getenv('TMDB_KEY'),
			'page': page
		}
		
		# NOTE: tv shows are disabled due to the current arch not supporting 
		# multifile torrents, which is what most tv shows do for each episode

		# tv_response = requests.get(f'{TMDB_API_ENDPOINT}/search/tv?{urlencode(params)}')
		# tv_data = tv_response.json()
		tv_data = {'results': [], 'total_pages': 0, 'total_results': 0}

		movie_response = requests.get(f'{TMDB_API_ENDPOINT}/search/movie?{urlencode(params)}')
		movie_data = movie_response.json()

		results = []
		
		for r in tv_data['results']:
			
			results.append({
				'title': r['name'],
				'date': r.get('first_air_date', ''),
				'type': 'tv',
				'poster_path': TMDB_IMAGE_PATH + r['poster_path']  if r.get('poster_path') else DEFAULT_POSTER_PATH,
				'id': r['id']
			})
		
		for r in movie_data['results']:
			
			results.append({
				'title': r['title'],
				'date': r.get('release_date', ''),
				'type': 'movie',
				'poster_path': TMDB_IMAGE_PATH + r['poster_path']  if r.get('poster_path') else DEFAULT_POSTER_PATH,
				'id': r['id']
			})

		results = sorted(results, key=lambda x : x.get('title', ''))
		
		results = filter(lambda x:  x.get('date') != '' and datetime.strptime(x.get('date'),'%Y-%m-%d') <= datetime.now(), results)
		
		payload = {}
		
		payload['results'] = results
		payload['page'] = page
		payload['total_pages'] = max(tv_data['total_pages'], movie_data['total_pages'])
		payload['total_results'] = tv_data['total_results'] + movie_data['total_results']

		return Response(payload, status=status.HTTP_200_OK)

class TrendingShows(APIView):

	def get(self, request, format=None):

		type = request.query_params.get('type')

		params = {
			'api_key': os.getenv('TMDB_KEY')
		}
		
		# NOTE: for now, we only support type movie
		if type != 'movie':
			return Response({"detail": "type can only be movie"}, status=status.HTTP_400_BAD_REQUEST)

		url = f'{TMDB_API_ENDPOINT}/{type}/popular?{urlencode(params)}'

		response = requests.get(url)
		
		data = response.json()
		
		results = [{
			'title': r['title'] if type == 'movie' else r['name'],
			'date': r.get('release_date', ''),
			'type': type,
			'poster_path': TMDB_IMAGE_PATH + r['poster_path']  if r.get('poster_path') else DEFAULT_POSTER_PATH,
			'id': r['id']
		} for r in data['results']]

		return Response(results, status=status.HTTP_200_OK)

class ShowInfo(APIView):
	
	def get(self, request, format=None):
		
		tmdb_id = request.query_params.get('id')
		type = request.query_params.get('type')
		
		if not (tmdb_id or type):
			return Response({"detail": "id or type must not be empty"},
							status=status.HTTP_400_BAD_REQUEST)

		params = {
			'api_key': os.getenv('TMDB_KEY'),
			'append_to_response': 'credits'
		}
		
		# NOTE: for now, only support type movie
		if type != 'movie':
			return Response({"detail": "type can only be movie"}, status=status.HTTP_400_BAD_REQUEST)

		url = f'{TMDB_API_ENDPOINT}/{type}/{tmdb_id}?{urlencode(params)}'
		response = requests.get(url)
		
		if response.status_code != 200:
			return Response({"detail": "external endpoint died"},
							status=status.HTTP_404_NOT_FOUND)
		
		data = response.json()
		
		payload = {k: data[k] for k in (
			'adult', 'backdrop_path', 'genres', 'homepage', 'id',
			'original_language', 'overview', 'popularity', 'poster_path',
			'production_companies', 'production_countries', 'spoken_languages',
			'tagline', 'vote_average', 'vote_count', 'credits'
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
		
		if type == 'tv':
			
			tmdb_params = {
				'api_key': os.getenv('TMDB_KEY')
			}
			
			response = requests.get(
				f'{TMDB_API_ENDPOINT}/{type}/{tmdb_id}/external_ids?{urlencode(tmdb_params)}')
			
			data = response.json()
			payload['details']['imdb_id'] = data.get('imdb_id', '')
		
		omdb_params = {
			'apikey': os.getenv('OMDB_KEY'),
			'i': payload['details']['imdb_id']
		}
		
		# on fail Response: False
		omdb_response = requests.get(f'{OMDB_API_ENDPOINT}?{urlencode(omdb_params)}')

		payload['details']['imdb_rating'] = omdb_response.json().get('imdbRating', '')
		
		payload['poster_path'] = TMDB_IMAGE_PATH + payload['poster_path'] \
			if payload.get('poster_path') else DEFAULT_POSTER_PATH
		payload['backdrop_path'] = TMDB_IMAGE_PATH + payload['backdrop_path'] \
			if payload.get('backdrop_path') else DEFAULT_POSTER_PATH
		
		
		payload['credits']['cast'] = [{k: v for k, v in cast.items()
									   if k in ('id', 'known_for_department',
										   'name', 'original_name',
										   'character')} 
									  for cast in payload['credits']['cast']]
			
			
		payload['credits']['crew'] = [{k: v for k, v in crew.items()
									   if k in ('id', 'known_for_department',
										   'original_name', 'character',
										   'name', 'department', 'job')}
									  for crew in payload['credits']['crew']]

		return Response(payload, status=status.HTTP_200_OK)

class SeasonInfo(APIView):
	
	def get(self, request, format=None):
		
		tmdb_id = request.query_params.get('id')
		season_number = request.query_params.get('season_number')
		
		if not (tmdb_id or season_number):
			return Response({"detail": "id or season_number must not be empty"},
							status=status.HTTP_400_BAD_REQUEST)

		params = { 'api_key': os.getenv('TMDB_KEY') }
		
		url = f'{TMDB_API_ENDPOINT}/tv/{tmdb_id}/season/{season_number}?{urlencode(params)}'
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
			payload['episodes'][i]['still_path'] = TMDB_IMAGE_PATH + ep['still_path'] \
				if ep.get('still_path') else DEFAULT_POSTER_PATH

			payload['episodes'][i]['title'] = ep['name']
			del payload['episodes'][i]['name']
		
		return Response(payload, status=status.HTTP_200_OK)

# TODO: Make LLM prioritise entries with english subtitles
class FindMovieTorrentFile(APIView):
	
	TORRENT_API_ENDPOINT = 'https://torrent-api-py-nx0x.onrender.com/api/v1/search'
	
	ALLOWED_SITES = [
		'yts', # movies only
	]

	example_input = {
		'titles': [
			'title 1',
			'title 2',
			'title 3',
			'title 4',
			'title 5',
			],
		'target': 'target title',
	}
	
	example_output = { 'title': 'selected title' }
	
	prompt = f"""
		You are a title matcher that will perform the following task:\n
		Given a list of titles and a target, select one title from the list that best matches the target title.\n
		If there are no titles that match the target, set the title as an empty string.\n
		The Input JSON will use the schema: {json.dumps(example_input, indent=2)}\n
		The Output JSON object must use the schema: {json.dumps(example_output, indent=2)}\n
		"""
	
	def get(self, request, format=None):
		
		client = Groq(api_key=os.environ.get("GROQ_KEY"))
		name = request.query_params.get('name')
		site = request.query_params.get('site')

		def parse_size(size_str):
			size_match = re.match(r'(\d+(\.\d+)?)\s*(B|KB|MB|GB|TB)', size_str.strip().upper())
			
			if not size_match:
				raise ValueError(f"Invalid size format {size_str}")

			size, _, unit = size_match.groups()
			size = float(size)
			
			# Conversion factors
			unit_factors = {
				'B': 1,
				'KB': 1024,
				'MB': 1024 ** 2,
				'GB': 1024 ** 3,
				'TB': 1024 ** 4
			}

			return size * unit_factors[unit]

		def find_healthy_torrent(torrents_list):
			HEALTH_CHECK_ENDPOINT = "https://checker.openwebtorrent.com/check"
			for torrent in torrents_list:
				response = requests.get(f"{HEALTH_CHECK_ENDPOINT}?magnet={urllib.parse.quote_plus(torrent['magnet'])}")
				response.raise_for_status()
				data = response.json()
				seeds = data.get('seeds')
				peers = data.get('peers')
				if seeds != None and peers != None and seeds > 0 and peers > 0:
					return torrent
			return None

		def matchTitles(titles):
			prompt_input = {
				'titles': titles,
				'target': name
			}
			
			cc = client.chat.completions.create(
				messages=[
					{
						"role": "system",
						"content": self.prompt
					},
					{
						"role": "user",
						"content": f"Select the title that best matches the target."
						f"Input: {json.dumps(prompt_input, indent=2)}",
					},
				],
				model="llama-3.3-70b-versatile",
				response_format={'type': "json_object"}
			)

			return json.loads(cc.choices[0].message.content)
		
		if (name or site) is None:
			return Response({"detail": "name, site must not be empty"},
							status=status.HTTP_400_BAD_REQUEST)
		
		if site not in self.ALLOWED_SITES:
			return Response({"detail": f"site must be one of the allowed sites {self.ALLOWED_SITES}"},
							status=status.HTTP_400_BAD_REQUEST)
		
		page = 1
		total_pages = None
		result = {}
		found_valid_magnet = False

		while not found_valid_magnet:
			if total_pages is not None and page > total_pages:
				break
			
			print(f"Trying page {page}")
			
			# query torrent api
			params = {
				'site': site,
				'query': f'{name}',
				'page': page,
			}
			
			response = requests.get(f"{self.TORRENT_API_ENDPOINT}?{urlencode(params)}")
			data = response.json()
			
			if data.get('error') is not None:
				return Response({"detail": data['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
			
			if not total_pages:
				# NOTE: no way to get total pages when using yts, hardcode to 20
				# In the event of total_pages being too big and `page` overflows
				# the loop will just continue and result will be empty
				total_pages = 20

			# match titles with LLM
			page_titles = [entry['name'] for entry in data['data']]
			while len(page_titles) > 0:
				prompt_output = matchTitles(page_titles)
				
				# LLM found a suitable title
				if (prompt_output.get('title', '') != ''):
					result_to_check = None

					for entry in data['data']:
						# get actual torrent info result from torrent API
						if entry['name'] == prompt_output['title']:
							result_to_check = entry
							break
				
					# we have magnet links, time to choose a healthy one
					torrents = sorted(result_to_check['torrents'], key = lambda x: parse_size(x['size'])) # sort by size, prioritize smaller files of the same movie
					valid_torrent = find_healthy_torrent(torrents)

					# found healthy, set found_valid magnet, result and break
					if valid_torrent != None:
						found_valid_magnet = True
						result_to_check['torrents'] = [valid_torrent]
						result = result_to_check
						break

					# no healthy, remove from page_titles and retry
					page_titles.remove(prompt_output['title'])
					continue
				
				# LLM thinks these titles are all shit, move on to next page
				break
			
			page += 1

		# print("Entry: ", result)
		if result == {}:
			return Response(result, status=status.HTTP_404_NOT_FOUND)
		return Response(result, status=status.HTTP_200_OK)

class FindTVTorrentFile(APIView):
	
	TORRENT_API_ENDPOINT = 'https://torrent-api-py-nx0x.onrender.com/api/v1/search'
	
	# NOTE: KEPADA PIHAK POLIS DIRAJA MALAYSIA, PROJEK INI HANYA DIGUNAKAN
	# UNTUK TUJUAN PEMBELAJARAN SAHAJA
	ALLOWED_SITES = [
		'nyaasi', # anime only
		'piratebay' # english / other tv series 
	]
	
	example_input = {
		'titles': [
			'title 1',
			'title 2',
			'title 3',
			'title 4',
			'title 5',
			],
		'target': {
			'name': 'show name',
			'season': 'season number',
			'episode': 'episode number'
		}
	}
			
	example_output = { 'title': 'selected title' }
	
	prompt = f"""
		You are a title matcher that will perform the following task:\n
		Given a list of titles and a target, select one title from the list that best matches the target show name, season number and episode number.\n
		If there are no titles that match the target, set the title as an empty string.\n
		The Input JSON will use the schema: {json.dumps(example_input, indent=2)}\n
		The Output JSON object must use the schema: {json.dumps(example_output, indent=2)}\n
		"""
	
	def get(self, request, format=None):
		
		client = Groq(api_key=os.environ.get("GROQ_KEY"))
		name = request.query_params.get('name')
		season_num = request.query_params.get('season')
		episode_num = request.query_params.get('episode')
		site = request.query_params.get('site')
		
		def matchTitles(titles):
			
			prompt_input = {
				'titles': titles,
				'target': {
					'name': name,
					'season': season_num,
					'episode': episode_num
				}
			}
			
			cc = client.chat.completions.create(
				messages=[
					{
						"role": "system",
						"content": self.prompt
					},
					{
						"role": "user",
						"content": f"Select the title that best matches the target."
						f"Input: {json.dumps(prompt_input, indent=2)}",
					},
				],
				model="llama-3.3-70b-versatile",
				response_format={'type': "json_object"}
			)

			return json.loads(cc.choices[0].message.content)

		if name is None or season_num is None or episode_num is None or site is None:
			return Response({"detail": "name, sesaon, episode are required parameters"},
							status=status.HTTP_400_BAD_REQUEST)
		
		if site not in self.ALLOWED_SITES:
			return Response({"detail": f"site must be one of the allowed sites {self.ALLOWED_SITES}"},
							status=status.HTTP_400_BAD_REQUEST)
		
		page = 1
		total_pages = None
		result = {}
		found_valid_magnet = False
		
		while not found_valid_magnet:
			if total_pages is not None and page > total_pages:
				break
			
			print(f"Trying page {page}")
			
			# query torrent api
			params = {
				'site': site,
				'query': f'{name} S{season_num}',
				'page': page,
			}
			
			print(f"{self.TORRENT_API_ENDPOINT}?{urlencode(params)}")
			response = requests.get(f"{self.TORRENT_API_ENDPOINT}?{urlencode(params)}")
			data = response.json()
			
			if data.get('error') is not None:
				return Response({"detail": data['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
			
			if not total_pages:
				total_pages = data.get('total_pages')

			# match titles with LLM
			page_titles = [entry['name'] for entry in data['data']]
			while len(page_titles) > 0:
				prompt_output = matchTitles(page_titles)
				
				# LLM found a suitable title
				if (prompt_output.get('title', '') != ''):
					result_to_check = None	

					for entry in data['data']:
						# get actual torrent info result from torrent API
						if entry['name'] == prompt_output['title']:
							result_to_check = entry
							break
					
					# we have 1 magnet link, see if its healthy
					# NOTE: nyaasi and piratebay has similar schema, can geneneralize deserialization here
					num_seeders = result_to_check.get("seeders")
					if num_seeders != None and int(num_seeders) > 0:
						result = result_to_check
						found_valid_magnet = True
						break
					
					# No healthy, remove page titles and retry
					# NOTE: for shows with episodes, what would happen here? in LAIAN we trust
					page_titles.remove(prompt_output['title'])
					continue

				# LLM thinks these titles are all shit, move on to next page
				break
			
			page += 1

		if result == {}:
			return Response(result, status=status.HTTP_404_NOT_FOUND)
		return Response(result, status=status.HTTP_200_OK)

class FromTMDB(APIView):
	
	"""
	Tries to query the database for a video with the corresponding tmdb id and type.
	If the video is found, provide the details for the frontend to call a seperate API endpoint that torrents / serves the video.
	If the video is not found, create a new record in the database.
	"""

	# Note: I think this is 	
	def get(self, request, format=None):
		
		tmdb_id = request.query_params.get('tmdb_id')
		type = request.query_params.get('type')
		
		if not tmdb_id or not type:
			return Response({"detail": "tmdb_id and type are required parameters"},
							status=status.HTTP_400_BAD_REQUEST)
		
		if type not in ['movie', 'tv']:
			return Response({"detail": "type must only be movie or tv"},
							status=status.HTTP_400_BAD_REQUEST)
		
		video, created = Video.objects.get_or_create(tmdb_id=tmdb_id, type=type)
		
		if created:
			print(f"Created new entry for tmdb id {tmdb_id}")
	
		return Response({"video_id": video.id, "created": created},
						status=status.HTTP_200_OK)
