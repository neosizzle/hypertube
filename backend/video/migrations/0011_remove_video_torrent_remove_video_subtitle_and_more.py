# Generated by Django 5.1.4 on 2025-01-31 05:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0010_alter_video_last_watched_time'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='video',
            name='torrent',
        ),
        migrations.RemoveField(
            model_name='video',
            name='subtitle',
        ),
        migrations.AddField(
            model_name='video',
            name='bm_sub_file_name',
            field=models.CharField(default='', max_length=100, unique=True),
        ),
        migrations.AddField(
            model_name='video',
            name='en_sub_file_name',
            field=models.CharField(default='', max_length=100, unique=True),
        ),
        migrations.AddField(
            model_name='video',
            name='torrent_file_name',
            field=models.CharField(default='', max_length=100, unique=True),
        ),
        migrations.DeleteModel(
            name='Torrent',
        ),
    ]
