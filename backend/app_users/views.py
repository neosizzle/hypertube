import os
import requests
import time
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
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

from app_users.models import AppUser, Session, PwResetAttempt
from app_users.serializers import AppUserSerializer

DISCORD_AUTH_URL = 'https://discord.com/oauth2/authorize'
DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token'
DISCORD_IDEN_URL = 'https://discord.com/api/users/@me'
INTRA_42_AUTH_URL = 'https://api.intra.42.fr/oauth/authorize'
INTRA_42_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
INTRA_42_IDEN_URL = 'https://api.intra.42.fr/v2/me'
GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_IDEN_URL = 'https://api.github.com/user'

REDIRECT_URI = 'http://localhost:3000/login'

class OAuthProvider(APIView):
	ACCEPTED_PROVIDERS = ['42', 'discord', 'github']
	
	def get(self, request, format=None):
		provider = request.query_params.get('provider')
		if provider not in self.ACCEPTED_PROVIDERS:
			return Response({"detail" : f"Accepted providers are {self.ACCEPTED_PROVIDERS}"}, status=status.HTTP_400_BAD_REQUEST)

		auth_url = None
		state = None
		scope = None
		client_id = None
		if provider == "42":
			scope = "public"
			state = "42_" + token_urlsafe(16)
			client_id = os.getenv('42_CLIENT_ID')
			auth_url = INTRA_42_AUTH_URL
		elif provider == "github":
			scope = "user:email read:user"
			state = "github_" + token_urlsafe(16)
			client_id = os.getenv('GITHUB_CLIENT_ID')
			auth_url = GITHUB_AUTH_URL
		elif provider == "discord":
			scope = "identify email"
			state = "discord_" + token_urlsafe(16)
			client_id = os.getenv('DISCORD_CLIENT_ID')
			auth_url = DISCORD_AUTH_URL
		else :
			return Response({"detail" : f"Unreachable"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		request.session['oauth_state'] = state
		request.session.save()
		query_params = {
			'response_type': 'code',
			'client_id': client_id,
			'redirect_uri': REDIRECT_URI,
			'scope': scope,
			'state': state
		}
		url = f"{auth_url}?{urlencode(query_params)}"

		# Redirect to the OAuth authorization URL
		return redirect(url)

class AuthLogin(APIView):
	# if username password, 
	# {
	#     "method": "username",
	#     "username": "test_user",
	#     "password": "password"
	# }

	# if oauth
	# {
	#     code: code,
	#     state: state,
	#     redirect_uri: redirect_uri,
	#     method: "42/github/discord"
	# }

	ACCEPTED_LOGIN_METHODS = ['username', '42', 'discord', 'github']

	# does code exchange and returns an infered user
	# can be either a first time registered user, or an existing user
	# in the case of registered users, this function will try to infer its username from the provider 
	# NOTE: This function will return none if serializer errors during new user registration by oauth (shouldnt happen under normal circumstances)
	# NOTE: This function will purposely raise error if 3rd party auth fails in any process
	def oauth_token_exchange(self, method, code, redirect_uri):
		# per method details
		method_details = {
			"42": {
				"token_url": INTRA_42_TOKEN_URL,
				"iden_url": INTRA_42_IDEN_URL,
				"client_id_env": '42_CLIENT_ID',
				"client_secret_env": '42_CLIENT_SECRET',
				"iden_key": 'login',
				"client_type": 'application/x-www-form-urlencoded',
				"user_key": 'ft_iden'
			},
			"discord": {
				"token_url": DISCORD_TOKEN_URL,
				"iden_url": DISCORD_IDEN_URL,
				"client_id_env": 'DISCORD_CLIENT_ID',
				"client_secret_env": 'DISCORD_CLIENT_SECRET',
				"iden_key": 'id',
				"client_type": 'application/x-www-form-urlencoded',
				"user_key": 'discord_iden'
			},
			"github": {
				"token_url": GITHUB_TOKEN_URL,
				"iden_url": GITHUB_IDEN_URL,
				"client_id_env": 'GITHUB_CLIENT_ID',
				"client_secret_env": 'GITHUB_CLIENT_SECRET',
				"iden_key": 'login',
				"client_type": 'application/x-www-form-urlencoded',
				"user_key": 'github_iden'
			}
		}

		details = method_details.get(method)
		if not details:
			return None 

		data = {
			'client_id': os.getenv(details['client_id_env']),
			'client_secret': os.getenv(details['client_secret_env']),
			'grant_type': 'authorization_code',
			'code': code,
			'redirect_uri': redirect_uri
		}
		headers = {
			'Content-Type': details['client_type'],
			'Accept': 'application/json'
		}

		response = requests.post(details['token_url'], data=data, headers=headers)
		response.raise_for_status()

		token = response.json()['access_token']
		headers = {
			'Authorization': f'Bearer {token}'
		}

		# Request user identity
		response = requests.get(details['iden_url'], headers=headers)
		response.raise_for_status()

		# Get the user identifier (e.g., login, id)
		user_iden = response.json()[details['iden_key']]

		# Try to get the user from the database, otherwise create a new one
		try:
			user = AppUser.objects.get(**{details['user_key']: user_iden})
			return AppUserSerializer(user).data
		except AppUser.DoesNotExist:
			# Create a new user if not found
			serializer = AppUserSerializer(data={
				"username": f"user{int(time.time())}",
				details['user_key']: user_iden
			})

			if serializer.is_valid():
				serializer.save()
				return serializer.data

			error(serializer.errors)
			return None

	def post(self, request, format=None):
		body = request.data
		method = body.get('method')
		if method is None:
			return Response({"detail" : "method field is required"}, status=status.HTTP_400_BAD_REQUEST)
		if method not in self.ACCEPTED_LOGIN_METHODS:
			return Response({"detail" : f"method field can only be {self.ACCEPTED_LOGIN_METHODS}"}, status=status.HTTP_400_BAD_REQUEST)

		# handle username method
		if method == "username":
			username = body.get('username')
			password = body.get('password')
			
			try:
				user = AppUser.objects.get(username=username)
				if not user.check_password(password):
					return Response({"detail" : "credentials invalid"}, status=status.HTTP_401_UNAUTHORIZED)
			except AppUser.DoesNotExist:
				raise Http404
			
			session = Session.create_session_for_user(user.id)
			data = AppUserSerializer(user).data
			data.update({"token": session.token})
			
			response = Response(data)
			response.set_cookie('token', session.token, httponly=True, samesite='Strict')

			info(" Set-Cookie: ", response.cookies.get('token'))

			return response
		# handle other oauth methods
		else:
			code = body.get('code')
			state = body.get('state')
			redirect_uri = body.get('redirect_uri')
			stored_state = request.session.get('oauth_state')

			if not state or state != stored_state:
				return Response(data={'detail': 'State does not match'}, status=status.HTTP_400_BAD_REQUEST)
			user = self.oauth_token_exchange(method, code, redirect_uri)
			session = Session.create_session_for_user(user.get('id'))
			data = user
			data.update({"token": session.token})
			
			response = Response(data)
			response.set_cookie('token', session.token, httponly=True, samesite='Strict')

			return response

class AuthLogout(APIView):
    """
    Log out a user.
    """
    def post(self, request, format=None):
        
        token = request.COOKIES.get('token')
        
        info(token)
        
        if not token:
            return Response({"detail": "No token found"}, status=status.HTTP_400_BAD_REQUEST)
        
        response = Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie('token')
        
        return response

class AppUserList(APIView):
	"""
	List all app_users, or create a new app_user.
	"""
	def get(self, request, format=None):
		username = request.query_params.get('username', "")

		app_users = AppUser.objects.all(username__startswith=username).order_by('username')
		serializer = AppUserSerializer(app_users, many=True)
		return Response(serializer.data)

	# {
	# 	"username": "password",
	# 	"password": "password",
	# 	"first_name": "first_name",
	# 	"last_name": "last_name"
	# }
	def post(self, request, format=None):
		serializer = AppUserSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AppUserDetail(APIView):
	"""
	Retrieve, update or delete a app_user instance.
	"""
	def get_object(self, pk):
		try:
			return AppUser.objects.get(pk=pk)
		except AppUser.DoesNotExist:
			raise Http404

	def get(self, request, format=None):		
		app_user = request.app_user
		serializer = AppUserSerializer(app_user)
		return Response(serializer.data)

	def patch(self, request, format=None):
		app_user = request.app_user
		serializer = AppUserSerializer(app_user, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)

		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, format=None):
		app_user = request.app_user

		old_path = app_user.profile_picture.path
		old_name = app_user.profile_picture.name.split('/')[-1]
		if old_path and old_name != 'default.png' and default_storage.exists(old_path):
			default_storage.delete(old_path)

		app_user.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

class AppUserOthersDetail(APIView):
	def get(self, request, pk, format=None):
		try:
			app_user = AppUser.objects.get(pk=pk)
			serializer = AppUserSerializer(app_user)
			return Response(serializer.data)
		except AppUser.DoesNotExist:
			return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
		except Exception as e:
			error(e)
			return Response({"detail": e}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AppUserPicture(APIView):
	def post(self, request, format=None):
		user = request.app_user
		file = request.FILES.get('image')
		if not file:
			return Response({"detail": "No image uploaded."}, status=status.HTTP_400_BAD_REQUEST)
		
		# Check file size (max 10MB)
		if file.size > 10 * 1024 * 1024:  # 10MB 
			return Response({"detail": "The image is too large. Please upload an image smaller than 10MB."}, status=status.HTTP_400_BAD_REQUEST)

		# Check if file is an image (using PIL to open and verify the image)
		try:
			image = Image.open(file)
			image.verify()  # This will check if the file is a valid image
		except (IOError, SyntaxError):
			return Response({"detail": "Invalid image file."}, status=status.HTTP_400_BAD_REQUEST)

		# delete old profile picture
		old_path = user.profile_picture.path
		old_name = user.profile_picture.name.split('/')[-1]
		if old_path and old_name != 'default.png' and default_storage.exists(old_path):
			default_storage.delete(old_path)

		file_path = f'profile_pics/{user.id}_{file.name}'

		with default_storage.open(file_path, 'wb+') as dest:
			for chunk in file.chunks():
				dest.write(chunk)

		file_url = default_storage.url(file_path)
	
		user.profile_picture = file_path
		user.save()
		return Response({"detail" : file_url}, status=status.HTTP_200_OK)

	def delete(self, request, format=None):
		
		user = request.app_user
		old_path = user.profile_picture.path
		if old_path and default_storage.exists(old_path):
			default_storage.delete(old_path)

		file_path = 'profile_pics/default.png'

		file_url = default_storage.url(file_path)
		user.profile_picture = file_path
		user.save()

		return Response({"detail" : file_url}, status=status.HTTP_200_OK)

class OTPRequest(APIView):
	def post(self, request, format=None):
		email = request.data.get("email")

		try:
			otp_req = PwResetAttempt.create_attempt_for_user(email)
			
			if otp_req is None:
				return Response({"detail" : "Too many requests"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
			
			# send email
			token = otp_req.token
			yag = yagmail.SMTP(user=os.getenv('EMAIL_SENDER'), password=os.getenv("EMAIL_APP_PW"))

			subject = "hypertube Password Reset OTP"
			content = "\n".join([
				"You have requested an OTP to reset the password of the hypertube account associated with this email.",
				f"<h1>OTP: {token}</h1>",
				"The OTP will expire in 30 seconds."
			])
			try:
				yag.send(to=email, subject=subject, contents=content)
				return Response(status=status.HTTP_200_OK)
			except Exception as e:
				error(f"yagmail error {e}")
				return Response({"detail" : "Send email error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		except ValueError:
			return Response({"detail" : "Email is not associated with any account"}, status=status.HTTP_400_BAD_REQUEST)
	
class PwReset(APIView):
	def post(self, request, format=None):
		new_pw = request.data.get("password")
		otp = request.data.get("otp")

		if new_pw is None or otp is None:
			return Response({"detail" : "'password' and 'otp' are required"}, status=status.HTTP_400_BAD_REQUEST)

		# Check if OTP exists for user and is not expired
		validated_otp_user = PwResetAttempt.validate_attempt_for_user(otp)
		if validated_otp_user is None:
			return Response({"detail" : "invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
		
		# change password
		serializer = AppUserSerializer(validated_otp_user, data={"password": new_pw, "username": validated_otp_user.username})
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)