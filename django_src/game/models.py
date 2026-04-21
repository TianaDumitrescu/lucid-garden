from django.conf import settings
from django.db import models
from main.models import Lucid


# Stores streak progress, battle charges, and starter species choice for each user
class PlayerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    alarm_streak = models.PositiveIntegerField(default=0)
    battle_charges = models.PositiveIntegerField(default=0)
    battleWinStreak = models.PositiveIntegerField(default=0)
    starter_species_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.user.username}'s game profile"
# Represents an active battle session for a player, including the enemy's species, level, HP, turn counts, and battle log
class BattleSession(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_AWAITING_SWITCH = "awaiting_switch"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_AWAITING_SWITCH, "Awaiting Switch"),
    ]
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="battle_session",
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    enemy_species_id = models.PositiveIntegerField()
    enemy_level = models.PositiveIntegerField()
    enemy_upgrade_history = models.JSONField(default=list, blank=True)
    enemy_current_hp = models.PositiveIntegerField()
    player_turn_count = models.PositiveIntegerField(default=0)
    enemy_turn_count = models.PositiveIntegerField(default=0)
    active_party_lucid = models.ForeignKey(
        Lucid,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    log = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"Battle for {self.owner.username} vs {self.enemy_species_id}"

# Represents the state of each party Lucid during a battle, including current HP and reference to the battle and owned Lucid
class BattlePartyState(models.Model):
    battle = models.ForeignKey(
        BattleSession,
        on_delete=models.CASCADE,
        related_name="party_states",
    )
    owned_lucid = models.ForeignKey(
        Lucid,
        on_delete=models.CASCADE,
        related_name="battle_states",
    )
    current_hp = models.PositiveIntegerField()

    class Meta:
        unique_together = ("battle", "owned_lucid")

    def __str__(self):
        return f"Battle state for {self.owned_lucid_id} in battle {self.battle_id}"
