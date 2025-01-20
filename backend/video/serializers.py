import json
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.core.validators import MinValueValidator, MaxValueValidator

from .models import Video, Comment
from app_users.models import AppUser

class VideoSerializer(serializers.Serializer):
	id = serializers.IntegerField(read_only=True)
	name = serializers.CharField(max_length=100, validators=[UniqueValidator(queryset=Video.objects.all())])
	subtitles = serializers.FileField(read_only=True, required=False, allow_null=True, default='thumbnail/subtitles.png')
	watched_by = serializers.PrimaryKeyRelatedField(queryset=AppUser.objects.all(), many=True, required=False)	
	

	def create(self, validated_data):
		# NOTE: NOT NULL constraint failed: video_video.torrent_id
		# will occur since we havent found a way to bind a video to a torrent properly
		return Video.objects.create(**validated_data)

	def update(self, instance, validated_data):
		instance.name = validated_data.get('name', instance.name)
		instance.subtitles = validated_data.get('subtitles', instance.subtitles)
		instance.watched_by = validated_data.get('watched_by', instance.watched_by)

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
			'profile_picture': str(user.profile_picture)
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
