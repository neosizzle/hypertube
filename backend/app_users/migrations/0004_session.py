# Generated by Django 5.1.4 on 2025-01-01 06:13

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app_users', '0003_alter_appuser_email_alter_appuser_password'),
    ]

    operations = [
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=100)),
                ('expires_at', models.DateTimeField(auto_now_add=True)),
                ('app_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='session', to='app_users.appuser')),
            ],
        ),
    ]
