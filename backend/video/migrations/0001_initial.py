# Generated by Django 5.1.4 on 2025-01-07 02:06

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('app_users', '0008_pwresetattempt'),
    ]

    operations = [
        migrations.CreateModel(
            name='Torrent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file_name', models.CharField(default='', max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Video',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('airing_date', models.DateField(null=True)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('rating', models.SmallIntegerField(null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ('genre', models.CharField(default='', max_length=100)),
                ('summary', models.CharField(default='', max_length=1024)),
                ('casting', models.CharField(default='', max_length=100)),
                ('director', models.CharField(default='', max_length=100)),
                ('producer', models.CharField(default='', max_length=100)),
                ('subtitle', models.FileField(blank=True, default='subtitles/default.png', null=True, upload_to='subtitles/')),
                ('thumbnail', models.ImageField(blank=True, default='thumbnail/default.png', null=True, upload_to='thumbnail/')),
                ('torrent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='torrent', to='video.torrent')),
            ],
        ),
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.CharField(default='', max_length=1024)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user', to='app_users.appuser')),
                ('video', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='video', to='video.video')),
            ],
        ),
    ]
