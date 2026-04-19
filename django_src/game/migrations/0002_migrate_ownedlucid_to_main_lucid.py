import json
from pathlib import Path

import django.db.models.deletion
from django.db import migrations, models


LUCIDS_PATH = Path(__file__).resolve().parents[3] / "lucids.json"


def _load_species_names():
    with LUCIDS_PATH.open("r", encoding="utf-8") as lucid_file:
        data = json.load(lucid_file)
    return {species["id"]: species["name"] for species in data["lucids"]}


def migrate_owned_lucids_to_main(apps, schema_editor):
    Lucid = apps.get_model("main", "Lucid")
    OwnedLucid = apps.get_model("game", "OwnedLucid")
    BattleSession = apps.get_model("game", "BattleSession")
    BattlePartyState = apps.get_model("game", "BattlePartyState")

    species_names = _load_species_names()
    next_unique_id = (Lucid.objects.order_by("-unique_id").values_list("unique_id", flat=True).first() or 0) + 1
    lucid_id_map = {}

    for owned_lucid in OwnedLucid.objects.order_by("id"):
        new_lucid = Lucid.objects.create(
            owner_id=owned_lucid.owner_id,
            unique_id=next_unique_id,
            nickname=species_names.get(owned_lucid.species_id, f"Lucid {next_unique_id}"),
            species_id=owned_lucid.species_id,
            level=owned_lucid.level,
            upgrade_history=owned_lucid.upgrade_history,
            pending_levelups=owned_lucid.pending_levelups,
            party_slot=owned_lucid.party_slot,
            created_at=owned_lucid.created_at,
            updated_at=owned_lucid.updated_at,
        )
        lucid_id_map[owned_lucid.id] = new_lucid.id
        next_unique_id += 1

    for session in BattleSession.objects.exclude(active_party_lucid_id__isnull=True):
        session.active_party_lucid_id = lucid_id_map.get(session.active_party_lucid_id)
        session.save(update_fields=["active_party_lucid"])

    for party_state in BattlePartyState.objects.all():
        party_state.owned_lucid_id = lucid_id_map[party_state.owned_lucid_id]
        party_state.save(update_fields=["owned_lucid"])


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0001_initial"),
        ("main", "0004_lucid_created_at_lucid_updated_at"),
    ]

    operations = [
        migrations.RunPython(migrate_owned_lucids_to_main, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="battlesession",
            name="active_party_lucid",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="main.lucid",
            ),
        ),
        migrations.AlterField(
            model_name="battlepartystate",
            name="owned_lucid",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="battle_states",
                to="main.lucid",
            ),
        ),
        migrations.DeleteModel(
            name="OwnedLucid",
        ),
    ]
