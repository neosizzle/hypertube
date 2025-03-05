from django.db import models
from app_users.models import AppUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Video(models.Model):
	torrent_file_name = models.CharField(max_length=1000)
	# name = models.CharField(max_length=100, unique=True)
	overview = models.CharField(max_length=10000, blank=True)
	en_sub_file_name = models.CharField(max_length=1000, blank=True)
	bm_sub_file_name = models.CharField(max_length=1000, blank=True)
	watched_by = models.ManyToManyField(AppUser, blank=True, related_name='watched_videos') # why is this not in users model? to prevent circular import since user model imports this model
	tmdb_id = models.IntegerField()
	type = models.CharField(max_length=5) # movie or tv
	last_watched_time = models.DateTimeField(default=timezone.now)

	class Meta:
		unique_together = ('tmdb_id', 'type')

class Comment(models.Model):
	created = models.DateTimeField(auto_now_add=True)
	video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='video')
	content = models.CharField(max_length=1024, default="")
	user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='user')

