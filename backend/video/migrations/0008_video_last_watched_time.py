# Generated by Django 5.1.4 on 2025-01-26 03:56

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0007_video_overview'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='last_watched_time',
            field=models.DateTimeField(default=datetime.datetime(2025, 1, 26, 3, 56, 45, 857315, tzinfo=datetime.timezone.utc)),
        ),
    ]
