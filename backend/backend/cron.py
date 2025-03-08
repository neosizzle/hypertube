import os
import shutil
from django.utils import timezone
from django.conf import settings

from video.models import Video

# https://medium.com/@mainadanielwachira/a-comprehensive-guide-to-using-django-crontab-for-scheduled-tasks-bb62b99083e8
# sudo service cron start
# python manage.py crontab add / show / remove
# EXPIRE_SECS = 60 * 60 * 24 * 30
EXPIRE_SECS = 30

def delete_files(file_paths):
	for file_path in file_paths:
		if os.path.exists(file_path):
			if not os.path.isdir(file_path):
				os.remove(file_path)
				print(f"The file {file_path} has been deleted.")
			else:
				print(f"The file {file_path} is a directory.")
		else:
			print(f"The file {file_path} does not exist.")

def delete_folder(folder_path):
    try:
        if os.path.isdir(folder_path):
            shutil.rmtree(folder_path)
            print(f"Folder '{folder_path}' and all its contents removed successfully.")
        else:
            print(f"The path {folder_path} is not a valid directory.")
    except Exception as e:
        print(f"Error: {e}")

def clean_videos():
	print(f"running clean_videos {timezone.now()}")
	# get all the videos and manually filter and delete
	videos = Video.objects.all()

	for video in videos:
		last_watched_time = video.last_watched_time
		time_diff = timezone.now() - last_watched_time
		if time_diff.total_seconds() > EXPIRE_SECS:
			# search torrent file and delete from file system
			torrent_folder = os.path.join(settings.MEDIA_ROOT, f'torrents/{video.tmdb_id}')
			

			# search subtitle file and delete from file system
			# NOTE: hardcoding media root here
			prefix = "http://localhost:8000/media/subtitles/"
			en_sub_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{video.en_sub_file_name.replace(prefix, "")}')
			bm_sub_path = os.path.join(settings.MEDIA_ROOT, f'subtitles/{video.bm_sub_file_name.replace(prefix, "")}')

			delete_files([en_sub_path, bm_sub_path])
			delete_folder(torrent_folder)
			
			# delete video model
			video.delete()