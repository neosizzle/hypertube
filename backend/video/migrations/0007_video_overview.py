# Generated by Django 5.1.5 on 2025-01-24 09:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0006_alter_video_torrent'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='overview',
            field=models.CharField(default='', max_length=1000),
            preserve_default=False,
        ),
    ]
