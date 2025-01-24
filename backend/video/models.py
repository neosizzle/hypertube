from django.db import models
from app_users.models import AppUser
from django.core.validators import MinValueValidator, MaxValueValidator

class Torrent(models.Model):
	file_name = models.CharField(max_length=100, unique=True, default="")

class Video(models.Model):
	torrent = models.ForeignKey(Torrent, on_delete=models.CASCADE, related_name='torrent', null=True)
	name = models.CharField(max_length=100, unique=True)
	overview = models.CharField(max_length=1000)
	subtitle = models.FileField(upload_to='subtitles/', null=True, blank=True, default='subtitles/default.png')
	watched_by = models.ManyToManyField(AppUser, blank=True, related_name='watched_videos') # why is this not in users model? to prevent circular import since user model imports this model
	tmdb_id = models.IntegerField()
	type = models.CharField(max_length=5) # movie or tv

	class Meta:
		unique_together = ('tmdb_id', 'type')

class Comment(models.Model):
	created = models.DateTimeField(auto_now_add=True)
	video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='video')
	content = models.CharField(max_length=1024, default="")
	user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='user')

