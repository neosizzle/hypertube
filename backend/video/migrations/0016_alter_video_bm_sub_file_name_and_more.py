# Generated by Django 5.1.4 on 2025-03-05 04:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('video', '0015_alter_video_bm_sub_file_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='video',
            name='bm_sub_file_name',
            field=models.CharField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name='video',
            name='en_sub_file_name',
            field=models.CharField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name='video',
            name='overview',
            field=models.CharField(blank=True, max_length=10000),
        ),
    ]
