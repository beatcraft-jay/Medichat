# Generated by Django 4.2.4 on 2025-04-16 15:07

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_doctor_specialty_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='chatmessage',
            options={'ordering': ['timestamp']},
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='sender_type',
            field=models.CharField(choices=[('doctor', 'Doctor'), ('patient', 'Patient')], default='doctor', max_length=7),
        ),
        migrations.AddField(
            model_name='consultation',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='sender',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='consultation',
            name='start_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='consultation',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('scheduled', 'Scheduled'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='pending', max_length=12),
        ),
        migrations.AlterField(
            model_name='status',
            name='status_expires_at',
            field=models.DateTimeField(default=datetime.datetime(2025, 4, 17, 15, 7, 57, 629097, tzinfo=datetime.timezone.utc)),
        ),
        migrations.DeleteModel(
            name='Message',
        ),
    ]
