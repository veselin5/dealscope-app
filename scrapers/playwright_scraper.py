#!/usr/bin/env python3
"""
Playwright-based scraper for Bulgarian real estate websites.
Handles JavaScript-rendered pages and dynamic content.
"""
import json
import logging
import re
import time
import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright, Page, Browser, TimeoutError as PlaywrightTimeout

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# BGN to EUR conversion rate
BGN_TO_EUR = 0.51

def bgn_to_eur(bgn: float) -> float:
    return round(bgn * BGN_TO_EUR, 2)

def polite_delay(min_sec=2, max_sec=4):
    time.sleep(random.uniform(min_sec, max_sec))


class PlaywrightScraper:
    """Base Playwright scraper with common functionality."""

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.listings: List[Dict] = []

    def start_browser(self, playwright):
        """Start the browser."""
        self.browser = playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        return self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )

    def extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text."""
        if not price_text:
            return None
        price_text = price_text.strip().lower()
        is_bgn = "лв" in price_text or "bgn" in price_text

        # Remove spaces and extract numbers
        clean = re.sub(r'[^\d.,]', '', price_text.replace(' ', ''))
        if not clean:
            return None

        # Handle European number format
        clean = clean.replace(',', '.')
        parts = clean.split('.')
        if len(parts) > 2:
            clean = ''.join(parts[:-1]) + '.' + parts[-1]
        elif len(parts) == 2 and len(parts[1]) == 3:
            clean = ''.join(parts)

        try:
            price = float(clean)
            if is_bgn:
                price = bgn_to_eur(price)
            return round(price, 2)
        except ValueError:
            return None

    def extract_area(self, area_text: str) -> Optional[float]:
        """Extract area in square meters."""
        if not area_text:
            return None
        match = re.search(r'(\d+(?:[.,]\d+)?)', area_text)
        if match:
            return float(match.group(1).replace(',', '.'))
        return None

    def normalize_property_type(self, type_text: str) -> str:
        """Normalize property type to standard format."""
        if not type_text:
            return "apartment_2"
        type_lower = type_text.lower()

        if "парцел" in type_lower or "земя" in type_lower or "урегулиран" in type_lower:
            return "land"
        if "магазин" in type_lower or "офис" in type_lower or "търговск" in type_lower or "склад" in type_lower:
            return "commercial"
        if "къща" in type_lower or "вила" in type_lower:
            return "house"
        if "студио" in type_lower or "гарсониер" in type_lower:
            return "studio"
        if "едностаен" in type_lower or "1-стаен" in type_lower or "1 стаен" in type_lower:
            return "apartment_1"
        if "двустаен" in type_lower or "2-стаен" in type_lower or "2 стаен" in type_lower:
            return "apartment_2"
        if "тристаен" in type_lower or "3-стаен" in type_lower or "3 стаен" in type_lower:
            return "apartment_3"
        if "четиристаен" in type_lower or "4-стаен" in type_lower or "многостаен" in type_lower:
            return "apartment_4"
        if "апартамент" in type_lower:
            return "apartment_2"
        return "apartment_2"


class ImotBgScraper(PlaywrightScraper):
    """Scraper for imot.bg - the largest Bulgarian real estate portal."""

    name = "imot_bg"
    base_url = "https://www.imot.bg"

    # City codes for imot.bg
    CITY_CODES = {
        "sofia": "grad-sofiya",
        "burgas": "grad-burgas"
    }

    # Property type codes
    PROPERTY_TYPES = {
        "apartment": "prodava/apartament",
        "house": "prodava/kashta",
        "land": "prodava/parcel",
        "commercial": "prodava/ofis"
    }

    def scrape(self, city: str, max_pages: int = 50) -> List[Dict]:
        """Scrape all property types for a city."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            for prop_type, url_part in self.PROPERTY_TYPES.items():
                logger.info(f"Scraping imot.bg - {city} - {prop_type}")
                listings = self._scrape_property_type(page, city, prop_type, url_part, max_pages)
                all_listings.extend(listings)
                polite_delay(3, 5)

            context.close()

        return all_listings

    def _scrape_property_type(self, page: Page, city: str, prop_type: str, url_part: str, max_pages: int) -> List[Dict]:
        """Scrape a specific property type."""
        listings = []
        city_code = self.CITY_CODES.get(city, city)

        for page_num in range(1, max_pages + 1):
            try:
                url = f"{self.base_url}/{url_part}/{city_code}?page={page_num}"
                logger.info(f"Fetching page {page_num}: {url}")

                page.goto(url, timeout=30000, wait_until='networkidle')
                polite_delay(2, 3)

                # Wait for listings to load
                page.wait_for_selector('.offer-box, .item, .property-item, .advert', timeout=10000)

                # Get all listing elements
                listing_elements = page.query_selector_all('.offer-box, .item, .property-item, .advert')

                if not listing_elements:
                    logger.info(f"No listings found on page {page_num}, stopping")
                    break

                for element in listing_elements:
                    try:
                        listing = self._parse_listing_element(element, city, prop_type)
                        if listing and listing.get('price_eur'):
                            listings.append(listing)
                    except Exception as e:
                        logger.debug(f"Error parsing listing: {e}")
                        continue

                logger.info(f"Found {len(listing_elements)} listings on page {page_num}")
                polite_delay(2, 4)

            except PlaywrightTimeout:
                logger.warning(f"Timeout on page {page_num}")
                break
            except Exception as e:
                logger.error(f"Error on page {page_num}: {e}")
                break

        return listings

    def _parse_listing_element(self, element, city: str, prop_type: str) -> Optional[Dict]:
        """Parse a single listing element."""
        try:
            # Try different selectors for different layouts
            link = element.query_selector('a[href*="/ad/"], a[href*="/pcgi/"], a.lnk1')
            if not link:
                return None

            href = link.get_attribute('href')
            source_url = urljoin(self.base_url, href) if href else None
            source_id = re.search(r'/(\d+)', href).group(1) if href and re.search(r'/(\d+)', href) else None

            # Extract title
            title_el = element.query_selector('.title, h3, .offer-title, .lnk1')
            title = title_el.inner_text().strip() if title_el else "Property"

            # Extract price
            price_el = element.query_selector('.price, .offer-price, .price-container, [class*="price"]')
            price_text = price_el.inner_text() if price_el else ""
            price_eur = self.extract_price(price_text)

            # Extract area
            area_el = element.query_selector('[class*="area"], [class*="size"], .offer-size')
            area_text = area_el.inner_text() if area_el else ""
            area_sqm = self.extract_area(area_text)

            # Extract location/neighborhood
            location_el = element.query_selector('.location, .offer-location, [class*="location"]')
            neighborhood = location_el.inner_text().strip() if location_el else None

            # Extract photo
            img_el = element.query_selector('img')
            photo_url = img_el.get_attribute('src') if img_el else None
            photos = [photo_url] if photo_url and not 'placeholder' in photo_url else []

            return {
                "source": self.name,
                "source_id": source_id or f"imot-{hash(source_url) % 1000000}",
                "source_url": source_url,
                "city": city,
                "property_type": self.normalize_property_type(prop_type),
                "title": title,
                "price_eur": price_eur,
                "area_sqm": area_sqm,
                "neighborhood": neighborhood,
                "photos": photos,
                "is_agency": None,
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.debug(f"Parse error: {e}")
            return None


class HomesBgScraper(PlaywrightScraper):
    """Scraper for homes.bg."""

    name = "homes_bg"
    base_url = "https://www.homes.bg"

    CITY_CODES = {"sofia": "sofia", "burgas": "burgas"}

    def scrape(self, city: str, max_pages: int = 50) -> List[Dict]:
        """Scrape homes.bg listings."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            # Scrape different property types
            property_types = [
                ("apartamenti-prodava", "apartment"),
                ("kashti-prodava", "house"),
                ("partseli-prodava", "land"),
                ("ofisi-prodava", "commercial")
            ]

            for url_part, prop_type in property_types:
                logger.info(f"Scraping homes.bg - {city} - {prop_type}")

                for page_num in range(1, max_pages + 1):
                    try:
                        url = f"{self.base_url}/{url_part}/{city}?page={page_num}"
                        logger.info(f"Fetching: {url}")

                        page.goto(url, timeout=30000)
                        polite_delay(2, 3)

                        # Wait for content
                        page.wait_for_selector('.property-item, .listing-item, .offer', timeout=10000)

                        items = page.query_selector_all('.property-item, .listing-item, .offer')
                        if not items:
                            break

                        for item in items:
                            listing = self._parse_item(item, city, prop_type)
                            if listing and listing.get('price_eur'):
                                all_listings.append(listing)

                        logger.info(f"Page {page_num}: {len(items)} items")
                        polite_delay(2, 4)

                    except Exception as e:
                        logger.warning(f"Error on page {page_num}: {e}")
                        break

                polite_delay(3, 5)

            context.close()

        return all_listings

    def _parse_item(self, element, city: str, prop_type: str) -> Optional[Dict]:
        """Parse a listing item."""
        try:
            link = element.query_selector('a')
            href = link.get_attribute('href') if link else None

            title_el = element.query_selector('.title, h3, h4, .property-title')
            title = title_el.inner_text().strip() if title_el else "Property"

            price_el = element.query_selector('.price, [class*="price"]')
            price_eur = self.extract_price(price_el.inner_text() if price_el else "")

            area_el = element.query_selector('[class*="area"], [class*="size"]')
            area_sqm = self.extract_area(area_el.inner_text() if area_el else "")

            location_el = element.query_selector('.location, [class*="location"]')
            neighborhood = location_el.inner_text().strip() if location_el else None

            img_el = element.query_selector('img')
            photo = img_el.get_attribute('src') if img_el else None

            return {
                "source": self.name,
                "source_id": f"homes-{hash(href) % 1000000}" if href else None,
                "source_url": urljoin(self.base_url, href) if href else None,
                "city": city,
                "property_type": self.normalize_property_type(prop_type),
                "title": title,
                "price_eur": price_eur,
                "area_sqm": area_sqm,
                "neighborhood": neighborhood,
                "photos": [photo] if photo else [],
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception:
            return None


class OlxBgScraper(PlaywrightScraper):
    """Scraper for olx.bg real estate."""

    name = "olx_bg"
    base_url = "https://www.olx.bg"

    def scrape(self, city: str, max_pages: int = 50) -> List[Dict]:
        """Scrape OLX listings."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            # OLX categories
            categories = [
                ("nedvizhimi-imoti/prodazhbi/apartamenti", "apartment"),
                ("nedvizhimi-imoti/prodazhbi/kashti", "house"),
                ("nedvizhimi-imoti/prodazhbi/zemya", "land"),
                ("nedvizhimi-imoti/prodazhbi/magazini-ofisi-zali", "commercial")
            ]

            city_query = "q-" + city

            for category, prop_type in categories:
                logger.info(f"Scraping OLX - {city} - {prop_type}")

                for page_num in range(1, max_pages + 1):
                    try:
                        url = f"{self.base_url}/d/{category}/{city_query}/?page={page_num}"
                        logger.info(f"Fetching: {url}")

                        page.goto(url, timeout=30000)
                        polite_delay(2, 4)

                        # Wait for listings
                        page.wait_for_selector('[data-cy="l-card"], .offer-wrapper, .listing', timeout=10000)

                        items = page.query_selector_all('[data-cy="l-card"], .offer-wrapper, .listing')
                        if not items:
                            break

                        for item in items:
                            listing = self._parse_olx_item(item, city, prop_type)
                            if listing and listing.get('price_eur'):
                                all_listings.append(listing)

                        logger.info(f"Page {page_num}: {len(items)} items")
                        polite_delay(3, 5)

                    except Exception as e:
                        logger.warning(f"Error: {e}")
                        break

                polite_delay(3, 5)

            context.close()

        return all_listings

    def _parse_olx_item(self, element, city: str, prop_type: str) -> Optional[Dict]:
        """Parse OLX listing."""
        try:
            link = element.query_selector('a')
            href = link.get_attribute('href') if link else None

            title_el = element.query_selector('h6, .title, [data-cy="ad-title"]')
            title = title_el.inner_text().strip() if title_el else "Property"

            price_el = element.query_selector('[data-testid="ad-price"], .price, [class*="price"]')
            price_eur = self.extract_price(price_el.inner_text() if price_el else "")

            location_el = element.query_selector('[data-testid="location-date"], .location')
            neighborhood = location_el.inner_text().split('-')[0].strip() if location_el else None

            img_el = element.query_selector('img')
            photo = img_el.get_attribute('src') if img_el else None

            return {
                "source": self.name,
                "source_id": f"olx-{hash(href) % 1000000}" if href else None,
                "source_url": href if href and href.startswith('http') else urljoin(self.base_url, href) if href else None,
                "city": city,
                "property_type": self.normalize_property_type(prop_type),
                "title": title,
                "price_eur": price_eur,
                "neighborhood": neighborhood,
                "photos": [photo] if photo else [],
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception:
            return None


class AloBgScraper(PlaywrightScraper):
    """Scraper for alo.bg."""

    name = "alo_bg"
    base_url = "https://www.alo.bg"

    def scrape(self, city: str, max_pages: int = 50) -> List[Dict]:
        """Scrape alo.bg listings."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            categories = [
                ("imoti/prodava/apartamenti", "apartment"),
                ("imoti/prodava/kashti", "house"),
                ("imoti/prodava/partseli", "land"),
                ("imoti/prodava/ofisi", "commercial")
            ]

            for category, prop_type in categories:
                logger.info(f"Scraping alo.bg - {city} - {prop_type}")

                for page_num in range(1, max_pages + 1):
                    try:
                        url = f"{self.base_url}/{category}?location={city}&page={page_num}"
                        logger.info(f"Fetching: {url}")

                        page.goto(url, timeout=30000)
                        polite_delay(2, 3)

                        page.wait_for_selector('.listing-item, .ad-item, .offer', timeout=10000)

                        items = page.query_selector_all('.listing-item, .ad-item, .offer')
                        if not items:
                            break

                        for item in items:
                            listing = self._parse_item(item, city, prop_type)
                            if listing and listing.get('price_eur'):
                                all_listings.append(listing)

                        logger.info(f"Page {page_num}: {len(items)} items")
                        polite_delay(2, 4)

                    except Exception as e:
                        logger.warning(f"Error: {e}")
                        break

                polite_delay(3, 5)

            context.close()

        return all_listings

    def _parse_item(self, element, city: str, prop_type: str) -> Optional[Dict]:
        """Parse listing item."""
        try:
            link = element.query_selector('a')
            href = link.get_attribute('href') if link else None

            title_el = element.query_selector('.title, h3, h4')
            title = title_el.inner_text().strip() if title_el else "Property"

            price_el = element.query_selector('.price, [class*="price"]')
            price_eur = self.extract_price(price_el.inner_text() if price_el else "")

            area_el = element.query_selector('[class*="area"]')
            area_sqm = self.extract_area(area_el.inner_text() if area_el else "")

            return {
                "source": self.name,
                "source_id": f"alo-{hash(href) % 1000000}" if href else None,
                "source_url": urljoin(self.base_url, href) if href else None,
                "city": city,
                "property_type": self.normalize_property_type(prop_type),
                "title": title,
                "price_eur": price_eur,
                "area_sqm": area_sqm,
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception:
            return None


class AddressBgScraper(PlaywrightScraper):
    """Scraper for address.bg."""

    name = "address_bg"
    base_url = "https://address.bg"

    def scrape(self, city: str, max_pages: int = 50) -> List[Dict]:
        """Scrape address.bg listings."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            categories = [
                ("bg/prodazhbi/apartamenti", "apartment"),
                ("bg/prodazhbi/kashti", "house"),
                ("bg/prodazhbi/partseli", "land"),
                ("bg/prodazhbi/ofisi", "commercial")
            ]

            city_param = "sofia-grad" if city == "sofia" else "burgas-grad"

            for category, prop_type in categories:
                logger.info(f"Scraping address.bg - {city} - {prop_type}")

                for page_num in range(1, max_pages + 1):
                    try:
                        url = f"{self.base_url}/{category}/{city_param}?page={page_num}"
                        logger.info(f"Fetching: {url}")

                        page.goto(url, timeout=30000)
                        polite_delay(2, 3)

                        page.wait_for_selector('.property-card, .listing, .offer', timeout=10000)

                        items = page.query_selector_all('.property-card, .listing, .offer')
                        if not items:
                            break

                        for item in items:
                            listing = self._parse_item(item, city, prop_type)
                            if listing and listing.get('price_eur'):
                                all_listings.append(listing)

                        logger.info(f"Page {page_num}: {len(items)} items")
                        polite_delay(2, 4)

                    except Exception as e:
                        logger.warning(f"Error: {e}")
                        break

                polite_delay(3, 5)

            context.close()

        return all_listings

    def _parse_item(self, element, city: str, prop_type: str) -> Optional[Dict]:
        """Parse listing item."""
        try:
            link = element.query_selector('a')
            href = link.get_attribute('href') if link else None

            title_el = element.query_selector('.title, h3, h4, .name')
            title = title_el.inner_text().strip() if title_el else "Property"

            price_el = element.query_selector('.price, [class*="price"]')
            price_eur = self.extract_price(price_el.inner_text() if price_el else "")

            area_el = element.query_selector('[class*="area"], [class*="size"]')
            area_sqm = self.extract_area(area_el.inner_text() if area_el else "")

            location_el = element.query_selector('.location, [class*="location"]')
            neighborhood = location_el.inner_text().strip() if location_el else None

            img_el = element.query_selector('img')
            photo = img_el.get_attribute('src') if img_el else None

            return {
                "source": self.name,
                "source_id": f"address-{hash(href) % 1000000}" if href else None,
                "source_url": urljoin(self.base_url, href) if href else None,
                "city": city,
                "property_type": self.normalize_property_type(prop_type),
                "title": title,
                "price_eur": price_eur,
                "area_sqm": area_sqm,
                "neighborhood": neighborhood,
                "photos": [photo] if photo else [],
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception:
            return None


class BazarBgScraper(PlaywrightScraper):
    """Scraper for bazar.bg."""

    name = "bazar_bg"
    base_url = "https://bazar.bg"

    def scrape(self, city: str, max_pages: int = 50) -> List[Dict]:
        """Scrape bazar.bg listings."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            categories = [
                ("obiavi/imoti/apartamenti-stai/prodava", "apartment"),
                ("obiavi/imoti/kashti-vili/prodava", "house"),
                ("obiavi/imoti/partseli/prodava", "land"),
                ("obiavi/imoti/magazini-ofisi/prodava", "commercial")
            ]

            for category, prop_type in categories:
                logger.info(f"Scraping bazar.bg - {city} - {prop_type}")

                for page_num in range(1, max_pages + 1):
                    try:
                        url = f"{self.base_url}/{category}?city={city}&page={page_num}"
                        logger.info(f"Fetching: {url}")

                        page.goto(url, timeout=30000)
                        polite_delay(2, 3)

                        page.wait_for_selector('.classified, .listing, .ad-item', timeout=10000)

                        items = page.query_selector_all('.classified, .listing, .ad-item')
                        if not items:
                            break

                        for item in items:
                            listing = self._parse_item(item, city, prop_type)
                            if listing and listing.get('price_eur'):
                                all_listings.append(listing)

                        logger.info(f"Page {page_num}: {len(items)} items")
                        polite_delay(2, 4)

                    except Exception as e:
                        logger.warning(f"Error: {e}")
                        break

                polite_delay(3, 5)

            context.close()

        return all_listings

    def _parse_item(self, element, city: str, prop_type: str) -> Optional[Dict]:
        """Parse listing item."""
        try:
            link = element.query_selector('a')
            href = link.get_attribute('href') if link else None

            title_el = element.query_selector('.title, h3, h4, .name')
            title = title_el.inner_text().strip() if title_el else "Property"

            price_el = element.query_selector('.price, [class*="price"]')
            price_eur = self.extract_price(price_el.inner_text() if price_el else "")

            return {
                "source": self.name,
                "source_id": f"bazar-{hash(href) % 1000000}" if href else None,
                "source_url": urljoin(self.base_url, href) if href else None,
                "city": city,
                "property_type": self.normalize_property_type(prop_type),
                "title": title,
                "price_eur": price_eur,
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception:
            return None


class BuildingBoxBgScraper(PlaywrightScraper):
    """Scraper for buildingbox.bg - new construction focus."""

    name = "buildingbox_bg"
    base_url = "https://buildingbox.bg"

    def scrape(self, city: str, max_pages: int = 30) -> List[Dict]:
        """Scrape buildingbox.bg listings."""
        all_listings = []

        with sync_playwright() as p:
            context = self.start_browser(p)
            page = context.new_page()

            logger.info(f"Scraping buildingbox.bg - {city}")

            for page_num in range(1, max_pages + 1):
                try:
                    url = f"{self.base_url}/properties?city={city}&page={page_num}"
                    logger.info(f"Fetching: {url}")

                    page.goto(url, timeout=30000)
                    polite_delay(2, 3)

                    page.wait_for_selector('.property-card, .listing, .project', timeout=10000)

                    items = page.query_selector_all('.property-card, .listing, .project')
                    if not items:
                        break

                    for item in items:
                        listing = self._parse_item(item, city)
                        if listing and listing.get('price_eur'):
                            all_listings.append(listing)

                    logger.info(f"Page {page_num}: {len(items)} items")
                    polite_delay(2, 4)

                except Exception as e:
                    logger.warning(f"Error: {e}")
                    break

            context.close()

        return all_listings

    def _parse_item(self, element, city: str) -> Optional[Dict]:
        """Parse listing item."""
        try:
            link = element.query_selector('a')
            href = link.get_attribute('href') if link else None

            title_el = element.query_selector('.title, h3, h4, .name')
            title = title_el.inner_text().strip() if title_el else "New Construction"

            price_el = element.query_selector('.price, [class*="price"]')
            price_eur = self.extract_price(price_el.inner_text() if price_el else "")

            area_el = element.query_selector('[class*="area"], [class*="size"]')
            area_sqm = self.extract_area(area_el.inner_text() if area_el else "")

            img_el = element.query_selector('img')
            photo = img_el.get_attribute('src') if img_el else None

            return {
                "source": self.name,
                "source_id": f"bb-{hash(href) % 1000000}" if href else None,
                "source_url": urljoin(self.base_url, href) if href else None,
                "city": city,
                "property_type": "apartment_2",  # BuildingBox is mostly new apartments
                "title": title,
                "price_eur": price_eur,
                "area_sqm": area_sqm,
                "photos": [photo] if photo else [],
                "scraped_at": datetime.utcnow().isoformat()
            }
        except Exception:
            return None


def run_all_scrapers(cities: List[str] = None, max_pages: int = 50) -> List[Dict]:
    """Run all scrapers for specified cities."""
    if cities is None:
        cities = ["sofia", "burgas"]

    all_listings = []

    scrapers = [
        ImotBgScraper(),
        HomesBgScraper(),
        OlxBgScraper(),
        AloBgScraper(),
        AddressBgScraper(),
        BazarBgScraper(),
        BuildingBoxBgScraper(),
    ]

    for scraper in scrapers:
        for city in cities:
            logger.info(f"\n{'='*60}")
            logger.info(f"Running {scraper.name} for {city}")
            logger.info('='*60)

            try:
                listings = scraper.scrape(city, max_pages=max_pages)
                all_listings.extend(listings)
                logger.info(f"Got {len(listings)} listings from {scraper.name} - {city}")
            except Exception as e:
                logger.error(f"Error running {scraper.name} for {city}: {e}")

            polite_delay(5, 10)  # Extra delay between scrapers

    return all_listings


def save_listings(listings: List[Dict], output_file: str = "scraped_data.json"):
    """Save listings to JSON file."""
    # Calculate statistics
    stats = {
        "total_listings": len(listings),
        "new_today": len([l for l in listings if "T" in l.get("scraped_at", "")[:10] and l["scraped_at"][:10] == datetime.now().strftime("%Y-%m-%d")]),
        "avg_price": round(sum(l.get("price_eur", 0) for l in listings if l.get("price_eur")) / max(1, len([l for l in listings if l.get("price_eur")])), 2),
        "cities": {},
        "sources": {},
        "property_types": {}
    }

    for listing in listings:
        city = listing.get("city", "unknown")
        source = listing.get("source", "unknown")
        prop_type = listing.get("property_type", "unknown")

        stats["cities"][city] = stats["cities"].get(city, 0) + 1
        stats["sources"][source] = stats["sources"].get(source, 0) + 1
        stats["property_types"][prop_type] = stats["property_types"].get(prop_type, 0) + 1

    output = {
        "generated_at": datetime.now().isoformat(),
        "listings": listings,
        "stats": stats
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return stats


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scrape Bulgarian real estate websites")
    parser.add_argument("--cities", nargs="+", default=["sofia", "burgas"], help="Cities to scrape")
    parser.add_argument("--pages", type=int, default=50, help="Max pages per source")
    parser.add_argument("--output", default="scraped_data.json", help="Output file")
    parser.add_argument("--visible", action="store_true", help="Show browser window")

    args = parser.parse_args()

    logger.info(f"Starting scraper for cities: {args.cities}")
    logger.info(f"Max pages per source: {args.pages}")

    listings = run_all_scrapers(cities=args.cities, max_pages=args.pages)

    stats = save_listings(listings, args.output)

    print(f"\n{'='*60}")
    print("SCRAPING COMPLETE")
    print('='*60)
    print(f"Total listings: {stats['total_listings']}")
    print(f"Average price: €{stats['avg_price']:,.2f}")
    print(f"\nBy city:")
    for city, count in stats['cities'].items():
        print(f"  {city}: {count}")
    print(f"\nBy source:")
    for source, count in stats['sources'].items():
        print(f"  {source}: {count}")
    print(f"\nBy property type:")
    for ptype, count in stats['property_types'].items():
        print(f"  {ptype}: {count}")
    print(f"\nSaved to: {args.output}")
