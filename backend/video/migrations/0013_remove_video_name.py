# Generated by Django 5.1.4 on 2025-02-10 01:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0012_alter_video_bm_sub_file_name_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='video',
            name='name',
        ),
    ]
