"""
Scraper for bazar.bg - Bulgarian classifieds platform.
"""
import re
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

import sys
sys.path.append('..')
from base_scraper import BaseScraper
from config import polite_delay, CITIES


class BazarBgScraper(BaseScraper):
    """Scraper for bazar.bg website."""

    name = "bazar_bg"
    base_url = "https://bazar.bg"

    # City mapping for bazar.bg
    CITY_PATHS = {
        "sofia": "sofia-grad",
        "burgas": "burgas",
        "varna": "varna",
        "plovdiv": "plovdiv",
    }

    def build_search_url(self, city: str, property_type: str = None, page: int = 1) -> str:
        """Build the search URL for bazar.bg."""
        city_path = self.CITY_PATHS.get(city, "sofia-grad")

        # bazar.bg URL structure for real estate
        url = f"{self.base_url}/obiavi/imoti-prodazhba/{city_path}"

        if page > 1:
            url += f"?page={page}"

        return url

    def scrape(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape listings from bazar.bg."""
        all_listings = []
        self.logger.info(f"Starting bazar.bg scrape for {city}")

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

        self.logger.info(f"Total listings scraped from bazar.bg: {len(all_listings)}")
        return all_listings

    def parse_listing_page(self, soup: BeautifulSoup, city: str, property_type: str = None) -> List[Dict[str, Any]]:
        """Parse the search results page."""
        listings = []

        # bazar.bg listing containers
        listing_containers = soup.select('.classified, .ad-item, .listing, article')

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
        # Extract link
        link_elem = container.select_one('a[href*="/obiava/"], a[href*="/ad/"]')
        if not link_elem:
            link_elem = container.select_one('a')

        if not link_elem:
            return None

        href = link_elem.get("href", "")
        if not href.startswith("http"):
            href = self.base_url + href

        # Skip category links
        if "/obiavi/" in href and not "/obiava/" in href and len(href.split("/")) < 6:
            return None

        # Extract ID from URL
        id_match = re.search(r'[-/](\d+)(?:\?|$|\.html)', href)
        source_id = id_match.group(1) if id_match else href.split("/")[-1].split("?")[0]

        # Extract title
        title_elem = container.select_one('h2, h3, .title, [class*="title"], a')
        title = ""
        if title_elem:
            title = title_elem.get_text(strip=True)

        if not title or len(title) < 5:
            return None

        # Extract price
        price_elem = container.select_one('.price, [class*="price"]')
        price_text = price_elem.get_text(strip=True) if price_elem else ""
        price_eur = self.extract_price(price_text)

        if not price_eur:
            return None

        # Extract details
        area_sqm = None
        floor = None
        total_floors = None

        details_text = container.get_text(" ", strip=True)

        # Extract area from details
        area_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:кв\.?м|m2|m²)', details_text)
        if area_match:
            area_sqm = float(area_match.group(1).replace(",", "."))

        # Extract floor
        floor_match = re.search(r'(\d+)\s*(?:/|от|етаж)', details_text.lower())
        if floor_match:
            floor = int(floor_match.group(1))
            total_match = re.search(r'от\s*(\d+)', details_text.lower())
            if total_match:
                total_floors = int(total_match.group(1))

        # Extract location/neighborhood
        location_elem = container.select_one('.location, [class*="location"], [class*="region"]')
        neighborhood = location_elem.get_text(strip=True) if location_elem else None

        # Extract photos
        photos = []
        img_elems = container.select('img[src], img[data-src]')
        for img in img_elems[:5]:
            src = img.get("data-src") or img.get("src")
            if src and not any(x in src.lower() for x in ["placeholder", "logo", "icon", "avatar"]):
                if not src.startswith("http"):
                    src = self.base_url + src
                photos.append(src)

        # bazar.bg is primarily private listings
        is_agency = False
        agency_indicators = ["агенция", "broker", "agency", "имоти"]
        text_lower = details_text.lower()
        if any(ind in text_lower for ind in agency_indicators):
            is_agency = True

        return self.create_listing(
            source_id=source_id,
            source_url=href,
            city=city,
            property_type=title,
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
    scraper = BazarBgScraper()
    listings = scraper.scrape("sofia", max_pages=1)
    print(f"Found {len(listings)} listings")
    if listings:
        print("Sample listing:", listings[0])
