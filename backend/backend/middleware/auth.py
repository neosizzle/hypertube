import re
from django.http import HttpResponseForbidden
from django.utils import timezone

from app_users.models import AppUser, Session

class AuthMiddleware:
	non_auth_paths = [
		("POST", r"^/api/auth/login$"),
		("POST", r"^/api/users$"),
		("GET", r"^/api/oauth$"),
		("POST", r"^/api/auth/otp$"),
		("POST", r"^/api/auth/reset$"),
		("GET", r"^/api/videos$"),
		("GET", r"^/api/videos/\d+$"),
		("GET", r"^/api/videos/comments/\d+$"),
		("GET", r"^/api/comments$"),
		("GET", r"^/api/comments/all$"),
		("GET", r"^/api/show/search$"),
		("GET", r"^/api/show/popular$"),
		("GET", r"^/api/show/info$"),
		("GET", r"^/api/show/tv/season$"),
		("GET", r"^/api/torrent/tv/search$"),
		("GET", r"^/api/torrent/movie/search$"),
		("GET", r"^/api/videos/fromTMDB$"),
		("GET", r"^/api/videos/stream$"),
		]
	admin_path = "/admin" # allow all admin paths to pass, they use another auth system
	media_path = "/media" # allow all media paths to pass, they are publoic

	def __init__(self, get_response):
		self.get_response = get_response
		# One-time configuration and initialization.

	# This is called before the view function is called.
	# if this returns none, the view function will be called, else the request would get
	# intercepted here
	def process_view(self, request, view_func, view_args, view_kwargs):
		key = (request.method, request.path)
		print(key)
		try:
			if request.path.startswith(self.admin_path) or request.path.startswith(self.media_path):
				return None
			
			for method, path in self.non_auth_paths:
				if method == key[0] and re.match(path, key[1]):
					return None
				
			if request.app_user is not None:
				return None
		except AttributeError: # app user is not in request
			return HttpResponseForbidden("Token invalid")

	# Validate token and user here
	def __call__(self, request):

		token = request.COOKIES.get('token')
		if token is None:
			response = self.get_response(request)
			return response

		try:
			session = Session.objects.get(token=token)
			if session.expires_at > timezone.now():
				return HttpResponseForbidden("Token invalid")
			request.app_user = session.app_user
		except:
			pass

		response = self.get_response(request)
		return response