import os
from django.utils import timezone
from django.conf import settings

from video.models import Video

# https://medium.com/@mainadanielwachira/a-comprehensive-guide-to-using-django-crontab-for-scheduled-tasks-bb62b99083e8
# python manage.py crontab add / show / remove
EXPIRE_SECS = 60 * 60 * 24 * 30
# EXPIRE_SECS = 30

def clean_videos():
	print(f"running clean_videos {timezone.now()}")
	# get all the videos and manually filter and delete
	videos = Video.objects.all()

	for video in videos:
		last_watched_time = video.last_watched_time
		time_diff = timezone.now() - last_watched_time
		if time_diff.total_seconds() > EXPIRE_SECS:
			# search torrent file and delete from file system
			file_path = os.path.join(settings.MEDIA_ROOT, f'torrents/{video.torrent.file_name}')
			if os.path.exists(file_path):
				os.remove(file_path)
				print(f"The file {file_path} has been deleted.")
			else:
				print(f"The file {file_path} does not exist.")

			# delete video model, should also delete torrent model as well due to cascade property
			video.delete()