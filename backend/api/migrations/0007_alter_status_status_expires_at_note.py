# Generated by Django 4.2.4 on 2025-04-21 12:29

import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_status_status_expires_at_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='status',
            name='status_expires_at',
            field=models.DateTimeField(default=datetime.datetime(2025, 4, 22, 12, 29, 56, 432862, tzinfo=datetime.timezone.utc)),
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('consultation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='doctor_notes', to='api.consultation')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='api.doctor')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
