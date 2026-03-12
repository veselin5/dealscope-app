#!/usr/bin/env python3
"""
Generate realistic demo data for the DealScope platform.
Creates JSON data that mimics what the scrapers would return.
"""
import json
import random
from datetime import datetime, timedelta
import uuid

# Bulgarian neighborhoods by city
NEIGHBORHOODS = {
    "sofia": [
        "Лозенец", "Борово", "Витоша", "Младост 1", "Младост 2", "Младост 3", "Младост 4",
        "Люлин 1", "Люлин 2", "Люлин 3", "Люлин 4", "Люлин 5", "Люлин 6", "Люлин 7", "Люлин 8",
        "Дружба 1", "Дружба 2", "Надежда 1", "Надежда 2", "Надежда 3", "Надежда 4",
        "Студентски град", "Гео Милев", "Редута", "Изток", "Изгрев", "Яворов",
        "Център", "Оборище", "Докторски паметник", "Банишора", "Хаджи Димитър",
        "Подуяне", "Слатина", "Сердика", "Захарна фабрика", "Павлово", "Бояна",
        "Драгалевци", "Симеоново", "Кръстова вада", "Овча купел", "Горна баня",
        "Банкя", "Княжево", "Хладилника", "Стрелбище", "Иван Вазов", "Белите брези"
    ],
    "burgas": [
        "Център", "Възраждане", "Лазур", "Славейков", "Зорница", "Изгрев",
        "Меден рудник", "Братя Миладинови", "Сарафово", "Крайморие"
    ],
    "varna": [
        "Център", "Чайка", "Левски", "Трошево", "Владиславово", "Виница",
        "Младост", "Възраждане", "Аспарухово", "Галата", "Бриз"
    ],
    "plovdiv": [
        "Център", "Кючук Париж", "Тракия", "Южен", "Смирненски", "Марица",
        "Захарна фабрика", "Въстанически", "Филипово", "Коматево"
    ]
}

# Property types
PROPERTY_TYPES = ["apartment_1", "apartment_2", "apartment_3", "apartment_4", "studio", "house"]

# Sources with realistic weights
SOURCES = [
    ("imot_bg", 0.35),
    ("homes_bg", 0.20),
    ("olx_bg", 0.15),
    ("alo_bg", 0.10),
    ("address_bg", 0.10),
    ("bazar_bg", 0.05),
    ("buildingbox_bg", 0.05),
]

# Price ranges by property type (EUR)
PRICE_RANGES = {
    "studio": (35000, 80000),
    "apartment_1": (45000, 110000),
    "apartment_2": (65000, 180000),
    "apartment_3": (90000, 280000),
    "apartment_4": (130000, 450000),
    "house": (150000, 800000),
}

# Area ranges by property type (m²)
AREA_RANGES = {
    "studio": (20, 40),
    "apartment_1": (35, 60),
    "apartment_2": (55, 90),
    "apartment_3": (80, 130),
    "apartment_4": (110, 200),
    "house": (150, 400),
}

# Placeholder images (using picsum for demo)
def generate_photos(count=5):
    """Generate placeholder photo URLs."""
    photos = []
    for _ in range(count):
        width = random.choice([800, 1024, 1200])
        height = random.choice([600, 768, 900])
        seed = random.randint(1, 1000)
        photos.append(f"https://picsum.photos/seed/{seed}/{width}/{height}")
    return photos

def generate_price_history(current_price, months=6):
    """Generate realistic price history."""
    history = []
    price = current_price * random.uniform(0.95, 1.10)  # Start slightly different

    for i in range(months, 0, -1):
        date = datetime.now() - timedelta(days=i*30)
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(price)
        })
        # Random price change (-5% to +3%)
        price = price * random.uniform(0.95, 1.03)

    # Make sure current price is last
    history.append({
        "date": datetime.now().strftime("%Y-%m-%d"),
        "price": round(current_price)
    })

    return history

def generate_listing(city):
    """Generate a single realistic listing."""
    # Choose property type
    property_type = random.choices(
        PROPERTY_TYPES,
        weights=[0.10, 0.35, 0.30, 0.12, 0.08, 0.05]
    )[0]

    # Choose neighborhood
    neighborhood = random.choice(NEIGHBORHOODS[city])

    # Generate price based on city and type
    base_min, base_max = PRICE_RANGES[property_type]

    # City price multipliers
    city_multipliers = {"sofia": 1.4, "varna": 1.0, "burgas": 0.9, "plovdiv": 0.85}
    multiplier = city_multipliers.get(city, 1.0)

    # Neighborhood premium (center = +20%, others vary)
    if "Център" in neighborhood or "Лозенец" in neighborhood:
        multiplier *= 1.2
    elif "Витоша" in neighborhood or "Борово" in neighborhood:
        multiplier *= 1.15

    price_eur = round(random.uniform(base_min * multiplier, base_max * multiplier))

    # Generate area
    area_min, area_max = AREA_RANGES[property_type]
    area_sqm = round(random.uniform(area_min, area_max), 1)

    # Calculate price per sqm
    price_per_sqm = round(price_eur / area_sqm)

    # Generate floor
    total_floors = random.randint(3, 12)
    floor = random.randint(1, total_floors)

    # Choose source
    source = random.choices(
        [s[0] for s in SOURCES],
        weights=[s[1] for s in SOURCES]
    )[0]

    # Generate deal score (70-100 for good deals, 20-70 for average)
    base_score = random.randint(30, 95)
    # Bonus for lower price per sqm
    if price_per_sqm < 1200:
        base_score = min(100, base_score + 15)
    elif price_per_sqm < 1500:
        base_score = min(100, base_score + 8)
    deal_score = base_score

    # Property type labels in Bulgarian
    type_labels = {
        "studio": "Студио",
        "apartment_1": "Едностаен апартамент",
        "apartment_2": "Двустаен апартамент",
        "apartment_3": "Тристаен апартамент",
        "apartment_4": "Четиристаен апартамент",
        "house": "Къща",
    }

    title = f"{type_labels[property_type]}, {area_sqm} m², {neighborhood}"

    # Generate description
    descriptions = [
        f"Продава се {type_labels[property_type].lower()} в квартал {neighborhood}. Жилището се намира на {floor} етаж от {total_floors}-етажна сграда.",
        f"Светъл и просторен {type_labels[property_type].lower()} с изглед към града. Отлична локация в {neighborhood}.",
        f"Напълно обзаведен {type_labels[property_type].lower()} в {neighborhood}. Идеален за живеене или инвестиция.",
        f"Слънчев апартамент в престижния квартал {neighborhood}. Ниски такси за поддръжка.",
    ]

    # Is it new listing?
    created_at = datetime.now() - timedelta(hours=random.randint(1, 720))
    is_new = (datetime.now() - created_at).total_seconds() < 86400  # 24 hours

    # Is it agency?
    is_agency = random.random() < 0.65  # 65% are from agencies

    listing = {
        "id": f"listing-{uuid.uuid4().hex[:8]}",
        "source": source,
        "source_id": f"{source}-{random.randint(100000, 999999)}",
        "source_url": f"https://example.com/{source}/{random.randint(100000, 999999)}",
        "city": city,
        "neighborhood": neighborhood,
        "property_type": property_type,
        "title": title,
        "description": random.choice(descriptions),
        "price_eur": price_eur,
        "price_per_sqm": price_per_sqm,
        "area_sqm": area_sqm,
        "floor": floor,
        "total_floors": total_floors,
        "photos": generate_photos(random.randint(3, 8)),
        "is_agency": is_agency,
        "is_new": is_new,
        "deal_score": deal_score,
        "created_at": created_at.isoformat(),
        "updated_at": datetime.now().isoformat(),
        "price_history": generate_price_history(price_eur) if random.random() < 0.4 else None,
    }

    return listing

def generate_dataset(total_listings=200):
    """Generate a complete dataset of listings."""
    listings = []

    # Distribution by city
    city_weights = {"sofia": 0.55, "varna": 0.18, "burgas": 0.15, "plovdiv": 0.12}

    for _ in range(total_listings):
        city = random.choices(
            list(city_weights.keys()),
            weights=list(city_weights.values())
        )[0]
        listings.append(generate_listing(city))

    # Sort by created_at descending (newest first)
    listings.sort(key=lambda x: x["created_at"], reverse=True)

    return listings

def main():
    print("Generating demo data for DealScope platform...")

    # Generate listings
    listings = generate_dataset(200)

    # Calculate statistics
    stats = {
        "total_listings": len(listings),
        "new_today": sum(1 for l in listings if l["is_new"]),
        "price_drops": random.randint(15, 35),
        "avg_price": round(sum(l["price_eur"] for l in listings) / len(listings)),
        "avg_price_per_sqm": round(sum(l["price_per_sqm"] for l in listings) / len(listings)),
        "cities": {},
        "sources": {},
    }

    for listing in listings:
        # Count by city
        city = listing["city"]
        stats["cities"][city] = stats["cities"].get(city, 0) + 1

        # Count by source
        source = listing["source"]
        stats["sources"][source] = stats["sources"].get(source, 0) + 1

    # Save to JSON
    output = {
        "generated_at": datetime.now().isoformat(),
        "listings": listings,
        "stats": stats,
    }

    output_file = "demo_data.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nGenerated {len(listings)} listings")
    print(f"Saved to {output_file}")
    print(f"\nStatistics:")
    print(f"  - Total listings: {stats['total_listings']}")
    print(f"  - New today: {stats['new_today']}")
    print(f"  - Average price: €{stats['avg_price']:,}")
    print(f"  - Average price/m²: €{stats['avg_price_per_sqm']:,}")
    print(f"\nBy city:")
    for city, count in stats["cities"].items():
        print(f"  - {city}: {count}")
    print(f"\nBy source:")
    for source, count in stats["sources"].items():
        print(f"  - {source}: {count}")

if __name__ == "__main__":
    main()
