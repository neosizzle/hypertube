import json
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from .models import Video, Comment
from app_users.models import AppUser

class VideoSerializer(serializers.Serializer):
	id = serializers.IntegerField(read_only=True)
	name = serializers.CharField(max_length=100, validators=[UniqueValidator(queryset=Video.objects.all())])
	overview = serializers.CharField(max_length=1000)
	en_sub_file_name = serializers.CharField(max_length=100)
	bm_sub_file_name = serializers.CharField(max_length=100)
	watched_by = serializers.PrimaryKeyRelatedField(queryset=AppUser.objects.all(), many=True, required=False)	
	tmdb_id = serializers.IntegerField(required=True)
	type = serializers.CharField(max_length=5, required=True) # movie or tv
	last_watched_time = serializers.DateTimeField(default=timezone.now)
	torrent_file_name = serializers.CharField(max_length=1024, read_only=True)

	def create(self, validated_data):
		# NOTE: NOT NULL constraint failed: video_video.torrent_id
		# will occur since we havent found a way to bind a video to a torrent properly
		return Video.objects.create(**validated_data)

	def update(self, instance, validated_data):
		instance.name = validated_data.get('name', instance.name)
		instance.overview = validated_data.get('overview', instance.name)
		instance.watched_by = validated_data.get('watched_by', instance.watched_by)
		instance.tmdb_id = validated_data.get('tmdb_id', instance.tmdb_id)
		instance.type = validated_data.get('type', instance.type)
		instance.last_watched_time = validated_data.get('last_watched_time', instance.last_watched_time)
		instance.en_sub_filename = validated_data.get('en_sub_filename', instance.en_sub_filename)
		instance.bn_sub_filename = validated_data.get('bm_sub_filename', instance.bm_sub_filename)
		instance.torrent_filename = validated_data.get('torrent_filename', instance.torrent_filename)

		instance.save()
		return instance



class CommentSerializer(serializers.Serializer):
	created = serializers.DateTimeField(read_only=True)
	content = serializers.CharField(max_length=1024, required=False, default="")
	video = serializers.PrimaryKeyRelatedField(queryset=Video.objects.all())
	user = serializers.PrimaryKeyRelatedField(queryset=AppUser.objects.all())	

	# custom to_rep here to expand user info to frontend
	def to_representation(self, instance):
		representation = super().to_representation(instance)
		user = AppUser.objects.get(pk=representation['user'])
		user_obj = {
			'id': user.id,
			'username': user.username,
			'profile_picture': user.profile_picture.url
		}

		representation['user'] = user_obj
		
		return representation

	def create(self, validated_data):
		return Comment.objects.create(**validated_data)

	def update(self, instance, validated_data):
		instance.content = validated_data.get('content', instance.content)
		instance.video = validated_data.get('video', instance.video)
		instance.user = validated_data.get('user', instance.user)
		
		instance.save()
		return instance
