from django.db import models
from django.utils import timezone
from datetime import timedelta

import bcrypt
from dotenv import load_dotenv
import os
import random

load_dotenv()
secret_key = os.getenv('PASSWORD_HASH_KEY')  # Retrieve the key from .env

class AppUser(models.Model):
	created = models.DateTimeField(auto_now_add=True)
	username = models.CharField(max_length=100, unique=True, default="")
	first_name = models.CharField(max_length=100, default="")
	last_name = models.CharField(max_length=100, default="")
	email = models.EmailField(max_length=255, null=True, unique=True)
	password = models.CharField(max_length=255, null=True)
	ft_iden = models.CharField(max_length=100, default="")
	discord_iden = models.CharField(max_length=100, default="")
	github_iden = models.CharField(max_length=100, default="")
	profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True, default='profile_pics/default.png')

	class Meta:
		ordering = ['created']
		
	def save(self, *args, **kwargs):
		if secret_key is None:
			raise ValueError("PASSWORD_HASH_KEY is missing from .env")
		if self.password is not None:
			salted_password = f"{self.password}{secret_key}".encode('utf-8')
			hashed = bcrypt.hashpw(salted_password, bcrypt.gensalt()).decode('utf-8')
			self.password = hashed
		super().save(*args, **kwargs)

	def __str__(self):
		return f"{self.first_name} {self.last_name} ({self.username})"
	
	def check_password(self, plaintext_password):
		# Check if the password is correct using bcrypt
		if self.password is None or plaintext_password is None:
			return False
		if secret_key is None:
			raise ValueError("PASSWORD_HASH_KEY is missing from .env")
		return bcrypt.checkpw(f"{plaintext_password}{secret_key}".encode('utf-8'), self.password.encode('utf-8'))
	
class Session(models.Model):
	app_user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='session')
	token = models.CharField(max_length=100)
	expires_at = models.DateTimeField(auto_now_add=True)
	
	def __str__(self):
		return f"{self.app_user} ({self.token} {self.expires_at})"
	

	@classmethod
	def create_session_for_user(cls, user_id):
		try:
			app_user = AppUser.objects.get(id=user_id)
		except AppUser.DoesNotExist:
			raise ValueError("User with the given ID does not exist.")
		
		# Check if there is an existing session for this user
		existing_session = cls.objects.filter(app_user=app_user).first()
		if existing_session:
			# If there is an existing session, check if it has expired
			if existing_session.expires_at > timezone.now():
				# Return the existing session if it has not expired
				return existing_session
			else:
				# If the session has expired, delete that session
				existing_session.delete()

		token = bcrypt.gensalt().decode('utf-8') 
		
		expires_at = timezone.now() + timedelta(hours=24)
		session = cls.objects.create(app_user=app_user, token=token, expires_at=expires_at)
		
		# save session in DB
		session.save()
		return session
	
class PwResetAttempt(models.Model):
	app_user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='pw_reset')
	token = models.CharField(max_length=100)
	created_time = models.DateTimeField(auto_now_add=True)
	
	def __str__(self):
		return f"{self.app_user} ({self.token} {self.created_time})"
	

	@classmethod
	def create_attempt_for_user(cls, email):
		if email is None:
			raise ValueError("User with the given email does not exist.")
		try:
			app_user = AppUser.objects.get(email=email)
		except AppUser.DoesNotExist:
			raise ValueError("User with the given email does not exist.")
		
		# Check if there is an existing attempt for this user
		existing_attempt = cls.objects.filter(app_user=app_user).first()
		if existing_attempt:
			# if there is an attept but cooldown has not reached, return none
			if timezone.now() - existing_attempt.created_time < timedelta(seconds=30):
				return None
			else:
				# If the attempt has expired, delete that attempt
				existing_attempt.delete()

		token = str(random.randint(100000, 999999))
		
		created_time = timezone.now()
		request = cls.objects.create(app_user=app_user, token=token, created_time=created_time)		
		request.save()

		return request
	
	@classmethod
	def validate_attempt_for_user(cls, otp):
		# Check if there is an existing attempt for this user
		existing_attempt = cls.objects.filter(token=otp).first()
		if existing_attempt:
			if timezone.now() - existing_attempt.created_time < timedelta(minutes=10):
				# validate if otp is equals
				if otp != existing_attempt.token:
					return None
				
				# get user from otp, delete attempt and return
				user = existing_attempt.app_user
				existing_attempt.delete()
				return user
			else:
				# If the attempt has expired, delete that attempt and return none
				existing_attempt.delete()
				return None
		else:
			return None

	