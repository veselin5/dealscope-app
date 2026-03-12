"""
Scraper registry - all available scrapers.
"""
from .homes_bg import HomesBgScraper
from .address_bg import AddressBgScraper
from .bazar_bg import BazarBgScraper
from .olx_bg import OlxBgScraper
from .buildingbox_bg import BuildingBoxBgScraper

__all__ = [
    'HomesBgScraper',
    'AddressBgScraper',
    'BazarBgScraper',
    'OlxBgScraper',
    'BuildingBoxBgScraper',
]

# Scraper registry
SCRAPERS = {
    'homes_bg': HomesBgScraper,
    'address_bg': AddressBgScraper,
    'bazar_bg': BazarBgScraper,
    'olx_bg': OlxBgScraper,
    'buildingbox_bg': BuildingBoxBgScraper,
}

def get_scraper(name: str):
    """Get scraper class by name."""
    if name not in SCRAPERS:
        raise ValueError(f"Unknown scraper: {name}. Available: {list(SCRAPERS.keys())}")
    return SCRAPERS[name]()

def get_all_scrapers():
    """Get all available scraper instances."""
    return {name: cls() for name, cls in SCRAPERS.items()}
