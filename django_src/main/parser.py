import json
from pathlib import Path

LUCIDS_PATH = Path(__file__).resolve().parents[2] / "lucids.json"
LUCIDS = {}
LUCIDS_BY_NAME = {}

class LucidSpecies:
    identification = 0
    name = ""
    types = {}
    description = ""
    spawn_rate = 0
    spawn_level_offset = 0
    evolution = {}

    def __init__(self, identification, name, types, description, spawn_rate, spawn_level_offset, evolution):
        self.identification = identification
        self.name = name
        self.types = types
        self.description = description
        self.spawn_rate = spawn_rate
        self.spawn_level_offset = spawn_level_offset
        self.evolution = evolution

    def get_name(self):
        return self.name

    def get_id(self):
        return self.identification
    
    def get_types(self):
        return self.types

    def get_description(self):
        return self.description

    def get_spawn_rate(self):
        return self.spawn_rate

    def get_spawn_level_offset(self):
        return self.spawn_level_offset

    def get_evolution(self):
        return self.evolution

    def to_dict(self):
        return {
            "id": self.get_id(),
            "name": self.get_name(),
            "type": self.get_types(),
            "description": self.get_description(),
            "spawn_rate": self.get_spawn_rate(),
            "spawn_level_offset": self.get_spawn_level_offset(),
            "evolution": self.get_evolution(),
        }

def load_lucids():
    if LUCIDS:
        return LUCIDS

    with LUCIDS_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    lucids = data["lucids"]
    for lucid in lucids:
        identification = lucid["id"]
        name = lucid["name"]
        types = lucid["type"]
        description = lucid["description"]
        spawn_rate = lucid["spawn_rate"]
        spawn_level_offset = lucid["spawn_level_offset"]
        evolution = lucid["evolution"]
        species = LucidSpecies(identification, name, types, description, spawn_rate, spawn_level_offset, evolution)
        LUCIDS[identification] = species
        LUCIDS_BY_NAME[name] = species
    return LUCIDS


def get_species(species_id):
    load_lucids()
    species = LUCIDS.get(int(species_id))
    if species is None:
        raise ValueError(f"Unknown species id: {species_id}")
    return species


def get_species_by_name(name):
    load_lucids()
    species = LUCIDS_BY_NAME.get(name)
    if species is None:
        raise ValueError(f"Unknown species name: {name}")
    return species


def get_spawnable_species():
    load_lucids()
    return [species for species in LUCIDS.values() if species.get_spawn_rate() is not None]


def get_chain_for_species(species_id):
    species = get_species(species_id)
    while species.get_evolution()["prev"] is not None:
        species = get_species_by_name(species.get_evolution()["prev"])

    chain = [species]
    while chain[-1].get_evolution()["next"] is not None:
        chain.append(get_species_by_name(chain[-1].get_evolution()["next"]))
    return chain


def get_evolution_stage(species_id):
    chain = get_chain_for_species(species_id)
    for index, species in enumerate(chain):
        if species.get_id() == int(species_id):
            return index
    raise ValueError(f"Species {species_id} is not in its own chain.")


def get_species_for_level(species_id, level):
    chain = get_chain_for_species(species_id)
    target = chain[0]
    for current_species in chain[:-1]:
        evolution = current_species.get_evolution()
        next_name = evolution["next"]
        evolve_level = evolution["level"]
        if next_name is not None and evolve_level is not None and level >= evolve_level:
            target = get_species_by_name(next_name)
        else:
            break
    return target
