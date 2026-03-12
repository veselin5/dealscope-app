"""
Scraper for buildingbox.bg - New construction focus.
Uses Playwright for JavaScript-rendered content.
"""
import re
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

import sys
sys.path.append('..')
from config import polite_delay, CITIES, normalize_property_type, bgn_to_eur


class BuildingBoxBgScraper:
    """Scraper for buildingbox.bg using Playwright."""

    name = "buildingbox_bg"
    base_url = "https://buildingbox.bg"

    # City mapping
    CITY_SLUGS = {
        "sofia": "sofia",
        "burgas": "burgas",
        "varna": "varna",
        "plovdiv": "plovdiv",
    }

    def __init__(self):
        self.playwright = None
        self.browser = None

    async def _init_browser(self):
        """Initialize Playwright browser."""
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError("Playwright is not installed. Run: pip install playwright && playwright install")

        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)

    async def _close_browser(self):
        """Close Playwright browser."""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    def build_search_url(self, city: str, property_type: str = None, page: int = 1) -> str:
        """Build the search URL for buildingbox.bg."""
        city_slug = self.CITY_SLUGS.get(city, "sofia")
        url = f"{self.base_url}/bg/properties/{city_slug}"

        params = []
        if property_type:
            params.append(f"type={property_type}")
        if page > 1:
            params.append(f"page={page}")

        if params:
            url += "?" + "&".join(params)

        return url

    async def scrape_async(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape listings asynchronously."""
        all_listings = []

        try:
            await self._init_browser()
            page = await self.browser.new_page()

            # Set viewport and user agent
            await page.set_viewport_size({"width": 1920, "height": 1080})

            for page_num in range(1, max_pages + 1):
                url = self.build_search_url(city, property_type, page_num)
                print(f"Scraping page {page_num}: {url}")

                try:
                    await page.goto(url, wait_until="networkidle", timeout=30000)

                    # Wait for listings to load
                    await page.wait_for_selector('.property-card, .listing-item, article', timeout=10000)

                    # Get page content
                    content = await page.content()

                    listings = self._parse_page(content, city)

                    if not listings:
                        print(f"No listings found on page {page_num}, stopping")
                        break

                    all_listings.extend(listings)
                    print(f"Found {len(listings)} listings on page {page_num}")

                    # Polite delay
                    await asyncio.sleep(2)

                except Exception as e:
                    print(f"Error on page {page_num}: {e}")
                    break

        finally:
            await self._close_browser()

        return all_listings

    def scrape(self, city: str, property_type: str = None, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Synchronous wrapper for scraping."""
        return asyncio.run(self.scrape_async(city, property_type, max_pages))

    def _parse_page(self, html: str, city: str) -> List[Dict[str, Any]]:
        """Parse page content and extract listings."""
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")

        listings = []

        # buildingbox.bg listing containers
        containers = soup.select('.property-card, .listing-item, article[class*="property"]')

        if not containers:
            containers = soup.select('[class*="listing"], [class*="property"]')

        for container in containers:
            try:
                listing = self._parse_listing(container, city)
                if listing and listing.get("price_eur"):
                    listings.append(listing)
            except Exception as e:
                print(f"Error parsing listing: {e}")
                continue

        return listings

    def _parse_listing(self, container, city: str) -> Optional[Dict[str, Any]]:
        """Parse a single listing container."""
        # Extract link
        link_elem = container.select_one('a[href*="/property/"], a[href*="/building/"]')
        if not link_elem:
            link_elem = container.select_one('a')

        if not link_elem:
            return None

        href = link_elem.get("href", "")
        if not href.startswith("http"):
            href = self.base_url + href

        # Extract ID
        id_match = re.search(r'/(\d+)(?:\?|$|/)', href)
        source_id = id_match.group(1) if id_match else href.split("/")[-1]

        # Extract title
        title_elem = container.select_one('h2, h3, h4, .title, [class*="title"]')
        title = title_elem.get_text(strip=True) if title_elem else ""

        if not title:
            return None

        # Extract price
        price_elem = container.select_one('.price, [class*="price"]')
        price_text = price_elem.get_text(strip=True) if price_elem else ""
        price_eur = self._extract_price(price_text)

        if not price_eur:
            return None

        # Extract area
        area_sqm = None
        area_elem = container.select_one('[class*="area"], [class*="size"]')
        if area_elem:
            area_text = area_elem.get_text(strip=True)
            area_match = re.search(r'(\d+(?:[.,]\d+)?)', area_text)
            if area_match:
                area_sqm = float(area_match.group(1).replace(",", "."))

        # Extract floor
        floor = None
        total_floors = None
        floor_elem = container.select_one('[class*="floor"], [class*="етаж"]')
        if floor_elem:
            floor_text = floor_elem.get_text(strip=True)
            floor_match = re.search(r'(\d+)\s*(?:/|от)?\s*(\d+)?', floor_text)
            if floor_match:
                floor = int(floor_match.group(1))
                if floor_match.group(2):
                    total_floors = int(floor_match.group(2))

        # Extract location
        location_elem = container.select_one('.location, [class*="location"], [class*="address"]')
        neighborhood = location_elem.get_text(strip=True) if location_elem else None

        # Extract project/building name
        project_elem = container.select_one('.project-name, [class*="project"], [class*="building-name"]')
        if project_elem and not neighborhood:
            neighborhood = project_elem.get_text(strip=True)

        # Extract photos
        photos = []
        img_elems = container.select('img[src], img[data-src]')
        for img in img_elems[:5]:
            src = img.get("data-src") or img.get("src")
            if src and not any(x in src.lower() for x in ["placeholder", "logo", "icon"]):
                if not src.startswith("http"):
                    src = self.base_url + src
                photos.append(src)

        # buildingbox.bg is all new construction from developers
        is_agency = True

        # Extract completion date if available
        completion_elem = container.select_one('[class*="completion"], [class*="deadline"], [class*="срок"]')
        description = None
        if completion_elem:
            description = f"Срок на завършване: {completion_elem.get_text(strip=True)}"

        return {
            "source": self.name,
            "source_id": source_id,
            "source_url": href,
            "city": city,
            "property_type": normalize_property_type(title),
            "title": self._clean_text(title),
            "price_eur": price_eur,
            "area_sqm": area_sqm,
            "floor": floor,
            "total_floors": total_floors,
            "neighborhood": self._clean_text(neighborhood) if neighborhood else None,
            "photos": photos,
            "description": description,
            "is_agency": is_agency,
            "scraped_at": datetime.utcnow().isoformat(),
        }

    def _extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text."""
        if not price_text:
            return None

        price_text = price_text.strip().lower()
        is_bgn = "лв" in price_text or "bgn" in price_text

        numbers = re.findall(r'[\d\s.,]+', price_text)
        if not numbers:
            return None

        price_str = numbers[0].replace(" ", "").replace(",", ".")
        parts = price_str.split(".")
        if len(parts) > 2:
            price_str = "".join(parts[:-1]) + "." + parts[-1]
        elif len(parts) == 2 and len(parts[1]) == 3:
            price_str = "".join(parts)

        try:
            price = float(price_str)
            if is_bgn:
                price = bgn_to_eur(price)
            return round(price, 2)
        except ValueError:
            return None

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        return " ".join(text.split()).strip()


if __name__ == "__main__":
    scraper = BuildingBoxBgScraper()
    listings = scraper.scrape("sofia", max_pages=1)
    print(f"Found {len(listings)} listings")
    if listings:
        print("Sample listing:", listings[0])
