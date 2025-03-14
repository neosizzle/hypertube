import re
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.core.exceptions import ValidationError

from .models import AppUser
from video.serializers import VideoSerializer

def PasswordValidator(value):
	res = re.match('^(?=\S{7,}$)(?=.*?\d)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[^A-Za-z\s0-9])', value)
	if res is None:
		raise ValidationError('Password needs to be at least 7 characters, include 1 digit, include 1 upper, include 1 lower and 1 special character')
	bad_passwords = [
		"123456",
		"password",
		"123456789",
		"12345678",
		"12345",
		"111111",
		"1234567",
		"sunshine",
		"qwerty",
		"iloveyou",
		"princess",
		"admin",
		"welcome",
		"666666",
		"abc123",
		"football",
		"123123",
		"monkey",
		"654321",
		"!@#$%^&*",
		"charlie",
		"aa123456",
		"donald",
		"password1",
		"qwerty123",
		"letmein",
		"zxcvbnm",
		"login",
		"starwars",
		"121212",
		"bailey",
		"freedom",
		"shadow",
		"passw0rd",
		"master",
		"baseball",
		"buster",
		"Daniel",
		"Hannah",
		"Thomas",
		"summer",
		"George",
		"Harley",
		"222222",
		"Jessica",
		"ginger",
		"abcdef",
		"Jordan",
		"55555",
		"Tigger",
		"Joshua",
		"Pepper",
		"Robert",
		"Matthew",
		"12341234",
		"Andrew",
		"lakers",
		"andrea",
		"1qaz2wsx",
		"sophie",
		"Ferrari",
		"Cheese",
		"Computer",
		"jesus",
		"Corvette",
		"Mercedes",
		"flower",
		"Blahblah",
		"Maverick",
		"Hello",
		"loveme",
		"nicole",
		"hunter",
		"amanda",
		"jennifer",
		"banana",
		"chelsea",
		"ranger",
		"trustno1",
		"merlin",
		"cookie",
		"ashley",
		"bandit",
		"killer",
		"aaaaaa",
		"1q2w3e",
		"zaq1zaq1",
		"mustang",
		"test",
		"hockey",
		"dallas",
		"whatever",
		"admin123",
		"michael",
		"liverpool",
		"querty",
		"william",
		"soccer",
		"london",
		"!@#$%^*",
		"trustnot",
		"dragon",
		"adobe123",
		"1234",
		"1234567890"
	]
	if value in bad_passwords:
			raise ValidationError('Password too common')
	return value


	
class AppUserSerializer(serializers.Serializer):
	id = serializers.IntegerField(read_only=True)
	username = serializers.CharField(required=True, max_length=100, validators=[UniqueValidator(queryset=AppUser.objects.all())])
	first_name = serializers.CharField(required=False, max_length=100)
	last_name = serializers.CharField(required=False, max_length=100)
	email = serializers.EmailField(required=False, max_length=255, validators=[UniqueValidator(queryset=AppUser.objects.all())])
	password = serializers.CharField(required=False, max_length=255, validators=[PasswordValidator])
	ft_iden = serializers.CharField(required=False, max_length=100)
	discord_iden = serializers.CharField(required=False, max_length=100)
	github_iden = serializers.CharField(required=False, max_length=100)
	profile_picture = serializers.ImageField(required=False, allow_null=True, default='profile_pics/default.png')
	watched_videos = VideoSerializer(many=True, read_only=True)
	lang = serializers.CharField(required=False, max_length=2)
	prefered_stream_dimensions = serializers.IntegerField(default=1)


	def to_representation(self, instance):
		representation = super().to_representation(instance)
		representation.pop('password', None)
		
		return representation

	def create(self, validated_data):
		"""
		Create and return a new `AppUser` instance, given the validated data.
		"""
		return AppUser.objects.create(**validated_data)

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
		instance.watched_videos.set(validated_data.get('watched_videos', instance.watched_videos.all()))
		instance.lang = validated_data.get('lang', instance.lang)
		instance.prefered_stream_dimensions = validated_data.get('prefered_stream_dimensions', instance.prefered_stream_dimensions)

		instance.save()
		return instance
