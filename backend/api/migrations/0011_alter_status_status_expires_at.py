# Generated by Django 4.2.4 on 2025-04-21 13:00

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_alter_status_status_expires_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='status',
            name='status_expires_at',
            field=models.DateTimeField(default=datetime.datetime(2025, 4, 22, 13, 0, 56, 626353, tzinfo=datetime.timezone.utc)),
        ),
    ]
