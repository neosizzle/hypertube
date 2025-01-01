# Generated by Django 5.1.4 on 2024-12-31 03:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app_users', '0002_appuser_email_appuser_first_name_appuser_last_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appuser',
            name='email',
            field=models.EmailField(max_length=255, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='appuser',
            name='password',
            field=models.CharField(max_length=255, null=True),
        ),
    ]
