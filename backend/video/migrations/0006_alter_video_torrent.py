# Generated by Django 5.1.5 on 2025-01-24 05:33

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0005_video_tmdb_id_video_type_alter_video_unique_together'),
    ]

    operations = [
        migrations.AlterField(
            model_name='video',
            name='torrent',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='torrent', to='video.torrent'),
        ),
    ]
