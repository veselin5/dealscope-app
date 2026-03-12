"""
Scraper for addressbg.com - Professional real estate listings.
"""
import re
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

import sys
sys.path.append('..')
from base_scraper import BaseScraper
from config import polite_delay, CITIES


class AddressBgScraper(BaseScraper):
    """Scraper for addressbg.com website."""

    name = "address_bg"
    base_url = "https://www.address.bg"

    # City slug mapping
    CITY_SLUGS = {
        "sofia": "sofia",
        "burgas": "burgas",
        "varna": "varna",
        "plovdiv": "plovdiv",
    }

    def build_search_url(self, city: str, property_type: str = None, page: int = 1) -> str:
        """Build the search URL for address.bg."""
        city_slug = self.CITY_SLUGS.get(city, "sofia")
        url = f"{self.base_url}/bg/search/for-sale"

        params = [f"location={city_slug}"]

        if property_type:
            params.append(f"type={property_type}")

        if page > 1:
            params.append(f"page={page}")

        return f"{url}?{'&'.join(params)}"

    def scrape(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape listings from address.bg."""
        all_listings = []
        self.logger.info(f"Starting address.bg scrape for {city}")

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

        self.logger.info(f"Total listings scraped from address.bg: {len(all_listings)}")
        return all_listings

    def parse_listing_page(self, soup: BeautifulSoup, city: str, property_type: str = None) -> List[Dict[str, Any]]:
        """Parse the search results page."""
        listings = []

        # address.bg listing containers
        listing_containers = soup.select('.property-card, .listing-card, .result-item, [class*="property"]')

        if not listing_containers:
            listing_containers = soup.select('article, .card')

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
        link_elem = container.select_one('a[href*="/property/"], a[href*="/listing/"], a')
        if not link_elem:
            return None

        href = link_elem.get("href", "")
        if not href.startswith("http"):
            href = self.base_url + href

        # Skip non-listing links
        if not any(x in href for x in ["/property", "/listing", "/for-sale", "/продажба"]):
            # Check if it's a detail page link
            if len(href.split("/")) < 4:
                return None

        # Extract ID from URL
        id_match = re.search(r'[-/](\d+)(?:\?|$|\.)', href)
        source_id = id_match.group(1) if id_match else href.split("/")[-1].split("?")[0]

        # Extract title
        title_elem = container.select_one('h2, h3, h4, .title, [class*="title"]')
        title = title_elem.get_text(strip=True) if title_elem else ""

        if not title:
            return None

        # Extract price
        price_elem = container.select_one('.price, [class*="price"]')
        price_text = price_elem.get_text(strip=True) if price_elem else ""
        price_eur = self.extract_price(price_text)

        if not price_eur:
            return None

        # Extract area
        area_sqm = None
        details = container.select('.detail, .info, [class*="detail"], [class*="info"], span')
        for detail in details:
            text = detail.get_text(strip=True)
            if "кв" in text.lower() or "m²" in text or "m2" in text:
                area_sqm = self.extract_area(text)
                if area_sqm:
                    break

        # Try title if not found
        if not area_sqm and title:
            area_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:кв\.?м|m2|m²)', title)
            if area_match:
                area_sqm = float(area_match.group(1).replace(",", "."))

        # Extract floor
        floor = None
        total_floors = None
        for detail in details:
            text = detail.get_text(strip=True).lower()
            if "етаж" in text or "floor" in text:
                floor, total_floors = self.extract_floor(text)
                break

        # Extract neighborhood/location
        location_elem = container.select_one('.location, [class*="location"], [class*="address"]')
        neighborhood = location_elem.get_text(strip=True) if location_elem else None

        # Extract photos
        photos = []
        img_elems = container.select('img[src], img[data-src]')
        for img in img_elems[:5]:
            src = img.get("data-src") or img.get("src")
            if src and not any(x in src.lower() for x in ["placeholder", "logo", "icon"]):
                if not src.startswith("http"):
                    src = self.base_url + src
                photos.append(src)

        # address.bg is primarily professional listings
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
    scraper = AddressBgScraper()
    listings = scraper.scrape("sofia", max_pages=1)
    print(f"Found {len(listings)} listings")
    if listings:
        print("Sample listing:", listings[0])
