"""
Scraper for homes.bg - Major Bulgarian real estate portal.
"""
import re
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

import sys
sys.path.append('..')
from base_scraper import BaseScraper
from config import polite_delay, CITIES


class HomesBgScraper(BaseScraper):
    """Scraper for homes.bg website."""

    name = "homes_bg"
    base_url = "https://www.homes.bg"

    # City ID mapping for homes.bg
    CITY_IDS = {
        "sofia": "1",
        "burgas": "3",
        "varna": "2",
        "plovdiv": "4",
    }

    # Property type mapping
    PROPERTY_TYPE_IDS = {
        "apartment": "1",
        "house": "2",
        "studio": "6",
        "office": "4",
        "land": "3",
    }

    # City slug mapping for homes.bg
    CITY_SLUGS = {
        "sofia": "sofiya",
        "burgas": "burgas",
        "varna": "varna",
        "plovdiv": "plovdiv",
    }

    def build_search_url(self, city: str, property_type: str = None, page: int = 1) -> str:
        """Build the search URL for homes.bg."""
        city_slug = self.CITY_SLUGS.get(city, "sofiya")

        # New URL format: /prodazhbi-imoti-v-{city}
        url = f"{self.base_url}/prodazhbi-imoti-v-{city_slug}"

        if page > 1:
            url += f"?page={page}"

        return url

    def scrape(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape listings from homes.bg."""
        all_listings = []
        self.logger.info(f"Starting homes.bg scrape for {city}")

        for page in range(1, max_pages + 1):
            url = self.build_search_url(city, property_type, page)
            self.logger.info(f"Scraping page {page}: {url}")

            soup = self.get_page(url)
            if not soup:
                self.logger.warning(f"Failed to get page {page}")
                break

            listings = self.parse_listing_page(soup, city, property_type)
            if not listings:
                self.logger.info(f"No listings found on page {page}, stopping")
                break

            all_listings.extend(listings)
            self.logger.info(f"Found {len(listings)} listings on page {page}")

            polite_delay()

        self.logger.info(f"Total listings scraped from homes.bg: {len(all_listings)}")
        return all_listings

    def parse_listing_page(self, soup: BeautifulSoup, city: str, property_type: str = None) -> List[Dict[str, Any]]:
        """Parse the search results page."""
        listings = []

        # homes.bg uses various container classes - try common patterns
        listing_containers = soup.select('.listing-item, .property-item, .offer-item, article.listing')

        if not listing_containers:
            # Fallback: try to find any listing-like structure
            listing_containers = soup.select('[class*="listing"], [class*="property"], [class*="offer"]')

        for container in listing_containers:
            try:
                listing = self._parse_listing(container, city)
                if listing and listing.get("price_eur"):
                    listings.append(listing)
            except Exception as e:
                self.logger.error(f"Error parsing listing: {e}")
                continue

        return listings

    def _parse_listing(self, container: BeautifulSoup, city: str) -> Optional[Dict[str, Any]]:
        """Parse a single listing container."""
        # Extract link and ID
        link_elem = container.select_one('a[href*="/bg/"], a[href*="/property/"], a[href*="/offer/"]')
        if not link_elem:
            return None

        href = link_elem.get("href", "")
        if not href.startswith("http"):
            href = self.base_url + href

        # Extract ID from URL
        id_match = re.search(r'/(\d+)(?:\?|$|/)', href)
        source_id = id_match.group(1) if id_match else href.split("/")[-1]

        # Extract title
        title_elem = container.select_one('h2, h3, .title, [class*="title"]')
        title = title_elem.get_text(strip=True) if title_elem else ""

        # Extract price
        price_elem = container.select_one('.price, [class*="price"]')
        price_text = price_elem.get_text(strip=True) if price_elem else ""
        price_eur = self.extract_price(price_text)

        if not price_eur:
            return None

        # Extract area
        area_elem = container.select_one('[class*="area"], [class*="size"]')
        area_text = area_elem.get_text(strip=True) if area_elem else ""
        area_sqm = self.extract_area(area_text)

        # Try to extract from title if not found
        if not area_sqm and title:
            area_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:кв\.?м|m2|m²)', title)
            if area_match:
                area_sqm = float(area_match.group(1).replace(",", "."))

        # Extract floor
        floor_elem = container.select_one('[class*="floor"], [class*="етаж"]')
        floor_text = floor_elem.get_text(strip=True) if floor_elem else ""
        floor, total_floors = self.extract_floor(floor_text)

        # Extract neighborhood/location
        location_elem = container.select_one('.location, [class*="location"], [class*="address"]')
        neighborhood = location_elem.get_text(strip=True) if location_elem else None

        # Extract photos
        photos = []
        img_elems = container.select('img[src*="images"], img[data-src]')
        for img in img_elems[:5]:
            src = img.get("data-src") or img.get("src")
            if src and not "placeholder" in src.lower():
                if not src.startswith("http"):
                    src = self.base_url + src
                photos.append(src)

        # Detect if agency listing
        agency_indicators = container.select('[class*="agency"], [class*="broker"], [class*="агенция"]')
        is_agency = len(agency_indicators) > 0

        # Extract property type from title or container
        detected_type = None
        type_elem = container.select_one('[class*="type"], [class*="category"]')
        if type_elem:
            detected_type = type_elem.get_text(strip=True)
        elif title:
            detected_type = title

        return self.create_listing(
            source_id=source_id,
            source_url=href,
            city=city,
            property_type=detected_type,
            title=title,
            price_eur=price_eur,
            area_sqm=area_sqm,
            floor=floor,
            total_floors=total_floors,
            neighborhood=neighborhood,
            photos=photos,
            is_agency=is_agency,
        )


if __name__ == "__main__":
    # Test the scraper
    scraper = HomesBgScraper()
    listings = scraper.scrape("sofia", max_pages=1)
    print(f"Found {len(listings)} listings")
    if listings:
        print("Sample listing:", listings[0])
