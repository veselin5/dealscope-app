"""
Base scraper class with common functionality.
"""
import logging
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
import requests
from bs4 import BeautifulSoup

from config import HEADERS, polite_delay, get_random_user_agent, bgn_to_eur, normalize_property_type

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


class BaseScraper(ABC):
    """Base class for all real estate scrapers."""

    name: str = "base"
    base_url: str = ""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.logger = logging.getLogger(self.__class__.__name__)

    def refresh_user_agent(self):
        """Refresh the user agent for a new request."""
        self.session.headers["User-Agent"] = get_random_user_agent()

    def get_page(self, url: str, params: dict = None) -> Optional[BeautifulSoup]:
        """Fetch a page and return BeautifulSoup object."""
        try:
            self.refresh_user_agent()
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, "lxml")
        except requests.RequestException as e:
            self.logger.error(f"Error fetching {url}: {e}")
            return None

    @abstractmethod
    def scrape(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """
        Scrape listings from the source.

        Args:
            city: City to scrape (sofia, burgas, varna, plovdiv)
            property_type: Optional property type filter
            max_pages: Maximum number of pages to scrape

        Returns:
            List of listing dictionaries
        """
        pass

    @abstractmethod
    def build_search_url(self, city: str, property_type: str = None, page: int = 1) -> str:
        """Build the search URL for the given parameters."""
        pass

    @abstractmethod
    def parse_listing_page(self, soup: BeautifulSoup, city: str, property_type: str = None) -> List[Dict[str, Any]]:
        """Parse a listing page and extract listing data."""
        pass

    def extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text, converting BGN to EUR if needed."""
        if not price_text:
            return None

        # Clean the text
        price_text = price_text.strip().lower()

        # Check if it's BGN or EUR
        is_bgn = "лв" in price_text or "bgn" in price_text

        # Extract numeric value
        numbers = re.findall(r'[\d\s.,]+', price_text)
        if not numbers:
            return None

        # Clean and parse the number
        price_str = numbers[0].replace(" ", "").replace(",", ".")
        # Handle Bulgarian format: 100.000 (thousands separator)
        parts = price_str.split(".")
        if len(parts) > 2:
            # Assume format like 100.000.00
            price_str = "".join(parts[:-1]) + "." + parts[-1]
        elif len(parts) == 2 and len(parts[1]) == 3:
            # Format like 100.000 (thousands separator, no decimals)
            price_str = "".join(parts)

        try:
            price = float(price_str)
            if is_bgn:
                price = bgn_to_eur(price)
            return round(price, 2)
        except ValueError:
            return None

    def extract_area(self, area_text: str) -> Optional[float]:
        """Extract area in square meters from text."""
        if not area_text:
            return None

        numbers = re.findall(r'(\d+(?:[.,]\d+)?)', area_text)
        if numbers:
            try:
                return float(numbers[0].replace(",", "."))
            except ValueError:
                pass
        return None

    def extract_floor(self, floor_text: str) -> tuple[Optional[int], Optional[int]]:
        """Extract floor and total floors from text."""
        if not floor_text:
            return None, None

        # Try to match "3/8" or "3 от 8" format
        match = re.search(r'(\d+)\s*(?:/|от|of)\s*(\d+)', floor_text)
        if match:
            return int(match.group(1)), int(match.group(2))

        # Try single number
        numbers = re.findall(r'\d+', floor_text)
        if numbers:
            return int(numbers[0]), None

        return None, None

    def clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        return " ".join(text.split()).strip()

    def create_listing(
        self,
        source_id: str,
        source_url: str,
        city: str,
        property_type: str,
        title: str,
        price_eur: float,
        area_sqm: float = None,
        floor: int = None,
        total_floors: int = None,
        neighborhood: str = None,
        photos: List[str] = None,
        description: str = None,
        is_agency: bool = None,
    ) -> Dict[str, Any]:
        """Create a standardized listing dictionary."""
        return {
            "source": self.name,
            "source_id": source_id,
            "source_url": source_url,
            "city": city,
            "property_type": normalize_property_type(property_type) if property_type else "apartment_2",
            "title": self.clean_text(title),
            "price_eur": price_eur,
            "area_sqm": area_sqm,
            "floor": floor,
            "total_floors": total_floors,
            "neighborhood": self.clean_text(neighborhood) if neighborhood else None,
            "photos": photos or [],
            "description": self.clean_text(description) if description else None,
            "is_agency": is_agency,
            "scraped_at": datetime.utcnow().isoformat(),
        }
