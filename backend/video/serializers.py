import bcrypt
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.core.validators import MinValueValidator, MaxValueValidator

from .models import Video, Comment
from app_users.models import AppUser

class VideoSerializer(serializers.Serializer):
	id = serializers.IntegerField(read_only=True)
	airing_date = serializers.DateField(required=False)
	name = serializers.CharField(max_length=100, validators=[UniqueValidator(queryset=Video.objects.all())])
	rating = serializers.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], required=False)
	genre = serializers.CharField(max_length=100, required=False, default="")
	summary = serializers.CharField(max_length=1024, required=False, default="")
	casting = serializers.CharField(max_length=100, required=False, default="")
	director = serializers.CharField(max_length=100, required=False, default="")
	producer = serializers.CharField(max_length=100, required=False, default="")
	subtitles = serializers.FileField(read_only=True, required=False, allow_null=True, default='thumbnail/subtitles.png')
	thumbnail = serializers.ImageField(read_only=True, required=False, allow_null=True, default='thumbnail/default.png')
	

	def create(self, validated_data):
		return Video.objects.create(**validated_data)

	def update(self, instance, validated_data):
		instance.airing_date = validated_data.get('airing_date', instance.airing_date)
		instance.name = validated_data.get('name', instance.name)
		instance.rating = validated_data.get('rating', instance.rating)
		instance.genre = validated_data.get('genre', instance.genre)
		instance.summary = validated_data.get('summary', instance.summary)
		instance.casting = validated_data.get('casting', instance.casting)
		instance.director = validated_data.get('director', instance.director)
		instance.producer = validated_data.get('producer', instance.producer)
		instance.subtitles = validated_data.get('subtitles', instance.subtitles)
		instance.thumbnail = validated_data.get('thumbnail', instance.thumbnail)

		instance.save()
		return instance


class CommentSerializer(serializers.Serializer):
	created = serializers.DateTimeField(read_only=True)
	content = serializers.CharField(max_length=1024, required=False, default="")
	video = serializers.PrimaryKeyRelatedField(queryset=Video.objects.all())
	user = serializers.PrimaryKeyRelatedField(queryset=AppUser.objects.all())	

	def create(self, validated_data):
		return Comment.objects.create(**validated_data)

	def update(self, instance, validated_data):
		instance.content = validated_data.get('content', instance.content)
		instance.video = validated_data.get('video', instance.video)
		instance.user = validated_data.get('user', instance.user)
		
		instance.save()
		return instance
