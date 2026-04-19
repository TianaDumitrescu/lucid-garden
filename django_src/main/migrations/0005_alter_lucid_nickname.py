from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0004_lucid_created_at_lucid_updated_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="lucid",
            name="nickname",
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
