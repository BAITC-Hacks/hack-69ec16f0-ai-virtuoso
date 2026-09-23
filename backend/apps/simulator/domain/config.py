from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

CONFIG_PATH = Path(__file__).resolve().parent.parent / "data" / "city_config.json"


@lru_cache(maxsize=1)
def load_city_config() -> dict[str, Any]:
    with CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        return json.load(config_file)


def district_names() -> list[str]:
    return list(load_city_config()["districts"].keys())


def measure_ids() -> list[str]:
    return list(load_city_config()["measures"].keys())
