from django.contrib import admin
from video.models import Video, Comment

# Register your models here.
class VideoAdmin(admin.ModelAdmin):
  list_display = ("id", "name")

admin.site.register(Video, VideoAdmin)

class CommentAdmin(admin.ModelAdmin):
  list_display = ("id", "content", "video", "user")

admin.site.register(Comment, CommentAdmin)