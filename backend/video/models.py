from django.db import models
from app_users.models import AppUser
from django.core.validators import MinValueValidator, MaxValueValidator

class Torrent(models.Model):
	file_name = models.CharField(max_length=100, unique=True, default="")

class Video(models.Model):
	torrent = models.ForeignKey(Torrent, on_delete=models.CASCADE, related_name='torrent')
	airing_date = models.DateField(null=True)
	name = models.CharField(max_length=100, unique=True)
	rating = models.SmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], null=True) # rating scale to 100 -> should be the average from all sources
	genre = models.CharField(max_length=100, default="")
	summary = models.CharField(max_length=1024, default="")
	casting = models.CharField(max_length=100, default="")
	director = models.CharField(max_length=100, default="")
	producer = models.CharField(max_length=100, default="")
	subtitle = models.FileField(upload_to='subtitles/', null=True, blank=True, default='subtitles/default.png')
	thumbnail = models.ImageField(upload_to='thumbnail/', null=True, blank=True, default='thumbnail/default.png')

class Comment(models.Model):
	created = models.DateTimeField(auto_now_add=True)
	video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='video')
	content = models.CharField(max_length=1024, default="")
	user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='user')

