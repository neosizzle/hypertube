# Generated by Django 5.1.4 on 2025-01-02 12:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app_users', '0006_appuser_profile_picture'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appuser',
            name='profile_picture',
            field=models.ImageField(blank=True, default='profile_pics/default.png', null=True, upload_to='profile_pics/'),
        ),
    ]
