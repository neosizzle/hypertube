from django.contrib import admin
from video.models import Video, Comment, Torrent

# Register your models here.
class VideoAdmin(admin.ModelAdmin):
  list_display = ("id", "name")

admin.site.register(Video, VideoAdmin)

class TorrentAdmin(admin.ModelAdmin):
  list_display = ("id", "file_name")

admin.site.register(Torrent, TorrentAdmin)

class CommentAdmin(admin.ModelAdmin):
  list_display = ("id", "content", "video", "user")

admin.site.register(Comment, CommentAdmin)