from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from app_users.models import AppUser, Session
from app_users.serializers import AppUserSerializer

class AuthLogin(APIView):
	# if username password, 
	# {
	#     "method": "username",
	#     "username": "test_user",
	#     "password": "password"
	# }

	# if github
	# TODO

	# if 42
	# TODO

	# if discord
	# TODO

	ACCEPTED_LOGIN_METHODS = ['username']

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
			resp = AppUserSerializer(user).data
			resp.update({"token": session.token})
			print(f"AppUserSerializer(user).data {AppUserSerializer(user).data}")
			print(f"session {session}")
			return Response(resp)
		else:
			return Response({"detail" : "unreachable"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AppUserList(APIView):
	"""
	List all app_users, or create a new app_user.
	"""
	def get(self, request, format=None):
		app_users = AppUser.objects.all()
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

	def get(self, request, pk, format=None):
		app_user = self.get_object(pk)
		serializer = AppUserSerializer(app_user)
		return Response(serializer.data)

	def put(self, request, pk, format=None):
		app_user = self.get_object(pk)
		serializer = AppUserSerializer(app_user, data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, pk, format=None):
		app_user = self.get_object(pk)
		app_user.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)