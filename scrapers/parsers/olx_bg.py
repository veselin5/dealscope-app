"""
Scraper for olx.bg - Large Bulgarian classifieds platform.
"""
import re
import json
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

import sys
sys.path.append('..')
from base_scraper import BaseScraper
from config import polite_delay, CITIES


class OlxBgScraper(BaseScraper):
    """Scraper for olx.bg website."""

    name = "olx_bg"
    base_url = "https://www.olx.bg"

    # City mapping for olx.bg
    CITY_SLUGS = {
        "sofia": "sofiya",
        "burgas": "burgas",
        "varna": "varna",
        "plovdiv": "plovdiv",
    }

    def build_search_url(self, city: str, property_type: str = None, page: int = 1) -> str:
        """Build the search URL for olx.bg."""
        city_slug = self.CITY_SLUGS.get(city, "sofiya")

        # OLX URL structure for real estate
        url = f"{self.base_url}/d/bg/imoti/prodazbi/{city_slug}"

        if page > 1:
            url += f"?page={page}"

        return url

    def scrape(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape listings from olx.bg."""
        all_listings = []
        self.logger.info(f"Starting olx.bg scrape for {city}")

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

        self.logger.info(f"Total listings scraped from olx.bg: {len(all_listings)}")
        return all_listings

    def parse_listing_page(self, soup: BeautifulSoup, city: str, property_type: str = None) -> List[Dict[str, Any]]:
        """Parse the search results page."""
        listings = []

        # OLX uses data attributes or specific classes
        listing_containers = soup.select('[data-cy="l-card"], .offer-wrapper, .listing-grid-item, [class*="offer"]')

        if not listing_containers:
            # Try alternate selectors
            listing_containers = soup.select('article, .css-rc5s2u, .css-1sw7q4x')

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
        link_elem = container.select_one('a[href*="/d/"], a[href*="/ad/"]')
        if not link_elem:
            link_elem = container.select_one('a')

        if not link_elem:
            return None

        href = link_elem.get("href", "")
        if not href.startswith("http"):
            href = self.base_url + href

        # Skip non-listing pages
        if not "/d/" in href and not "/ad/" in href:
            return None

        # Extract ID from URL
        id_match = re.search(r'-ID([A-Za-z0-9]+)\.html', href)
        if not id_match:
            id_match = re.search(r'/(\d+)(?:\?|$|\.html)', href)

        source_id = id_match.group(1) if id_match else href.split("/")[-1].split(".")[0]

        # Extract title
        title_elem = container.select_one('h6, h4, h3, [data-cy*="title"], .title')
        title = title_elem.get_text(strip=True) if title_elem else ""

        if not title or len(title) < 3:
            return None

        # Extract price
        price_elem = container.select_one('[data-testid="ad-price"], .price, [class*="price"]')
        if not price_elem:
            # OLX often has price in specific pattern
            price_elem = container.select_one('p[class*="price"], span[class*="price"]')

        price_text = price_elem.get_text(strip=True) if price_elem else ""
        price_eur = self.extract_price(price_text)

        if not price_eur:
            return None

        # Extract details
        area_sqm = None
        floor = None
        total_floors = None

        # Get all text for parsing
        all_text = container.get_text(" ", strip=True)

        # Extract area
        area_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:кв\.?м|m2|m²)', all_text)
        if area_match:
            area_sqm = float(area_match.group(1).replace(",", "."))

        # Extract floor
        floor_match = re.search(r'(\d+)(?:\s*(?:[-/]|от)\s*(\d+))?\s*(?:ет|етаж|floor)', all_text.lower())
        if floor_match:
            floor = int(floor_match.group(1))
            if floor_match.group(2):
                total_floors = int(floor_match.group(2))

        # Extract location
        location_elem = container.select_one('[data-testid*="location"], .location, [class*="location"]')
        neighborhood = location_elem.get_text(strip=True) if location_elem else None

        # Clean up neighborhood
        if neighborhood:
            # Remove city name if present
            neighborhood = neighborhood.replace(CITIES.get(city, {}).get("bg_name", ""), "").strip()
            neighborhood = neighborhood.strip(",- ")

        # Extract photos
        photos = []
        img_elems = container.select('img[src], img[data-src]')
        for img in img_elems[:5]:
            src = img.get("data-src") or img.get("src")
            if src and not any(x in src.lower() for x in ["placeholder", "logo", "icon", "avatar", "user"]):
                if not src.startswith("http"):
                    src = "https:" + src if src.startswith("//") else self.base_url + src
                photos.append(src)

        # Detect agency
        is_agency = False
        agency_patterns = ["агенция", "broker", "agency", "професионален", "компания"]
        if any(p in all_text.lower() for p in agency_patterns):
            is_agency = True

        # Check seller badge
        seller_elem = container.select_one('[class*="business"], [class*="company"], [class*="pro"]')
        if seller_elem:
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
    scraper = OlxBgScraper()
    listings = scraper.scrape("sofia", max_pages=1)
    print(f"Found {len(listings)} listings")
    if listings:
        print("Sample listing:", listings[0])
