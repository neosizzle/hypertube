# Generated by Django 5.1.4 on 2025-01-01 14:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app_users', '0004_session'),
    ]

    operations = [
        migrations.AddField(
            model_name='appuser',
            name='discord_iden',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='appuser',
            name='ft_iden',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='appuser',
            name='github_iden',
            field=models.CharField(default='', max_length=100),
        ),
    ]
