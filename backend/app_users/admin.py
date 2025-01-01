from django.contrib import admin
from app_users.models import AppUser, Session

# Register your models here.
class AppUserAdmin(admin.ModelAdmin):
  list_display = ("id", "username", "created")

admin.site.register(AppUser, AppUserAdmin)

class SessionAdmin(admin.ModelAdmin):
  list_display = ("token", "app_user", "expires_at")

admin.site.register(Session, SessionAdmin)