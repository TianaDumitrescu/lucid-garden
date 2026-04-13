from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from datetime import datetime, timedelta

# Create your models here.

# Alarm Clock Model
class Alarm(models.Model):
    alarm_time = models.TimeField()
    wake_up_time = models.DateTimeField(null=True, blank=True)
    label = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.label} at {self.alarm_time}"
    
    def get_next_due(self):
        now = datetime.now()

        due_today = now.replace(
            hour=self.alarm_time.hour,
            minute=self.alarm_time.minute,
            second=0,
            microsecond=0
        )

        if due_today > now:
            return due_today
        return due_today + timedelta(days=1)
    
    def is_due(self):
        next_due = self.get_next_due()
        return datetime.now() >= next_due

    def update_wake_up(self):
        self.wake_up_time = datetime.now()

    def met_alarm(self):
        if self.wake_up_time == None:
            return False
        if self.wake_up_time >= self.get_next_due():
            return True
        else:
            return False

# Lucid Model - Essentially represents
class Lucid(models.Model):
    id = models.IntegerField
    name = models.CharField(max_length = 64)
    # Types represents what "species" is inherited by the Lucids (i.e. )
    types = ArrayField(models.CharField(max_length = 64), size = 5)
    description = models.CharField(max_length = 1024)
    spawn_rate = models.FloatField
    spawn_level_offset = models.IntegerField
    # Evolution represents the current level of the Lucid in it's "progression path"
    # Index one is the previous, index 2 is the next
    evolution = ArrayField(models.CharField(max_length = 64), size = 2)

# User Database Model - Each user will officially have one
class UserDatabase(models.Model):
    # The user's username
    username = models.CharField(max_length = 64)
    # The user's saved password
    password = models.CharField(max_length = 64)
    # The current score the user has
    totalPoints = models.IntegerField;
    # The lucids array essentially holds all the lucids
    # The number represents the Lucid ID
    lucids = ArrayField(models.IntegerField, size = 25)
    # Represents the actual alarm clock model
    alarm = models.ForeignKey(Alarm, on_delete = models.CASCADE)
    