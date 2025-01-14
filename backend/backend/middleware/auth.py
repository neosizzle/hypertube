from django.http import HttpResponseForbidden
from django.utils import timezone

from app_users.models import AppUser, Session

class AuthMiddleware:
	non_auth_paths = [
		("POST", "/api/auth/login"),
		("POST", "/api/users"),
		("GET", "/api/oauth"),
		("POST", "/api/auth/otp"),
		("POST", "/api/auth/reset"),
		("GET", "/api/videos"),
		("GET", "/api/comments"),
		("GET", "/api/search"),
		("GET", "/api/info")
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
		try:
			if request.path.startswith(self.admin_path) or request.path.startswith(self.media_path) or key in self.non_auth_paths or request.app_user is not None:
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