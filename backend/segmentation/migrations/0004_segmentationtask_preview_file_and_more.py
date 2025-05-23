# Generated by Django 4.2.7 on 2025-05-03 05:33

from django.db import migrations, models
import segmentation.models


class Migration(migrations.Migration):

    dependencies = [
        ('segmentation', '0003_remove_segmentationtask_lung_volume'),
    ]

    operations = [
        migrations.AddField(
            model_name='segmentationtask',
            name='preview_file',
            field=models.FileField(blank=True, help_text='Downsampled NIfTI preview for fast viewing', max_length=255, null=True, upload_to=segmentation.models.preview_file_path),
        ),
        migrations.AlterField(
            model_name='segmentationtask',
            name='confidence_score',
            field=models.FloatField(blank=True, help_text='Model confidence score (0–1)', null=True),
        ),
    ]
