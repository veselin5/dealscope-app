"""
Scraper configuration settings.
"""
import random
from fake_useragent import UserAgent

# Initialize UserAgent for rotating user agents
try:
    ua = UserAgent()
except:
    ua = None

def get_random_user_agent():
    """Get a random user agent string."""
    if ua:
        return ua.random
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Default request headers
HEADERS = {
    "User-Agent": get_random_user_agent(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "bg-BG,bg;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Delay between requests (seconds)
MIN_DELAY = 2
MAX_DELAY = 4

def polite_delay():
    """Sleep for a random polite delay between requests."""
    import time
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    time.sleep(delay)

# City mappings
CITIES = {
    "sofia": {
        "bg_name": "София",
        "slug": "sofia",
    },
    "burgas": {
        "bg_name": "Бургас",
        "slug": "burgas",
    },
    "varna": {
        "bg_name": "Варна",
        "slug": "varna",
    },
    "plovdiv": {
        "bg_name": "Пловдив",
        "slug": "plovdiv",
    },
}

# Property type mappings
PROPERTY_TYPES = {
    "apartment_1": ["едностаен", "1-стаен", "1 стаен"],
    "apartment_2": ["двустаен", "2-стаен", "2 стаен"],
    "apartment_3": ["тристаен", "3-стаен", "3 стаен"],
    "apartment_4": ["четиристаен", "4-стаен", "4 стаен", "многостаен"],
    "studio": ["студио", "гарсониера"],
    "house": ["къща", "вила"],
    "villa": ["вила", "луксозна къща"],
    "land": ["парцел", "земя", "УПИ"],
    "commercial": ["офис", "магазин", "търговски"],
    "garage": ["гараж", "паркомясто"],
}

# EUR/BGN exchange rate (approximate)
EUR_BGN_RATE = 1.96

def bgn_to_eur(bgn_price: float) -> float:
    """Convert BGN to EUR."""
    return round(bgn_price / EUR_BGN_RATE, 2)

def normalize_property_type(raw_type: str) -> str:
    """Normalize property type string to standard format."""
    raw_lower = raw_type.lower()
    for prop_type, keywords in PROPERTY_TYPES.items():
        for keyword in keywords:
            if keyword in raw_lower:
                return prop_type
    return "apartment_2"  # Default
