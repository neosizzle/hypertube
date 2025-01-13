import bcrypt
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


from .models import AppUser
from video.serializers import VideoSerializer

class AppUserSerializer(serializers.Serializer):
	id = serializers.IntegerField(read_only=True)
	username = serializers.CharField(required=True, max_length=100, validators=[UniqueValidator(queryset=AppUser.objects.all())])
	first_name = serializers.CharField(required=False, max_length=100)
	last_name = serializers.CharField(required=False, max_length=100)
	email = serializers.EmailField(required=False, max_length=255, validators=[UniqueValidator(queryset=AppUser.objects.all())])
	password = serializers.CharField(required=False, max_length=255, min_length=7) # TODO make this more secure
	ft_iden = serializers.CharField(required=False, max_length=100)
	discord_iden = serializers.CharField(required=False, max_length=100)
	github_iden = serializers.CharField(required=False, max_length=100)
	profile_picture = serializers.ImageField(required=False, allow_null=True, default='profile_pics/default.png')
	watched_videos = VideoSerializer(many=True, read_only=True)

	def to_representation(self, instance):
		representation = super().to_representation(instance)
		representation.pop('password', None)
		
		return representation

	def create(self, validated_data):
		"""
		Create and return a new `AppUser` instance, given the validated data.
		"""
		return AppUser.objects.create(**validated_data)

	# TODO: support update oauth creds if needed
	# NOTE: profile picture is not editable by serializer
	def update(self, instance, validated_data):
		"""
		Update and return an existing `AppUser` instance, given the validated data.
		"""
		instance.username = validated_data.get('username', instance.username)
		instance.first_name = validated_data.get('first_name', instance.first_name)
		instance.last_name = validated_data.get('last_name', instance.last_name)
		instance.email = validated_data.get('email', instance.email)
		instance.password = validated_data.get('password', instance.password)
		instance.watched_videos = validated_data.get('watched_videos', instance.watched_videos)

		instance.save()
		return instance
