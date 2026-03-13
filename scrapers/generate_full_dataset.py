#!/usr/bin/env python3
"""
Generate comprehensive realistic dataset for DealScope.
Simulates data from all Bulgarian real estate sources.
"""
import json
import random
from datetime import datetime, timedelta
import uuid
import hashlib

# Bulgarian neighborhoods - comprehensive lists
NEIGHBORHOODS = {
    "sofia": [
        # Central
        "Център", "Оборище", "Докторски паметник", "Яворов", "Лозенец", "Изток", "Изгрев",
        "Иван Вазов", "Стрелбище", "Хладилника", "Гео Милев", "Редута", "Подуяне",
        # Residential
        "Младост 1", "Младост 1А", "Младост 2", "Младост 3", "Младост 4",
        "Люлин 1", "Люлин 2", "Люлин 3", "Люлин 4", "Люлин 5", "Люлин 6", "Люлин 7", "Люлин 8", "Люлин 9", "Люлин 10",
        "Дружба 1", "Дружба 2",
        "Надежда 1", "Надежда 2", "Надежда 3", "Надежда 4",
        "Овча купел 1", "Овча купел 2",
        "Студентски град", "Дървеница", "Мусагеница",
        # Upscale
        "Витоша", "Бояна", "Драгалевци", "Симеоново", "Кръстова вада", "Манастирски ливади",
        "Борово", "Павлово", "Белите брези",
        # Other
        "Банишора", "Хаджи Димитър", "Слатина", "Сердика", "Захарна фабрика",
        "Горна баня", "Банкя", "Княжево", "Красно село", "Бели брези",
        "Обеля 1", "Обеля 2", "Връбница 1", "Връбница 2",
        "Свобода", "Сухата река", "Левски", "Триъгълника",
        "Малинова долина", "Бъкстон", "Хиподрума", "Зона Б-5", "Зона Б-18",
        "Лагера", "Мотопистата", "Орландовци", "Факултета"
    ],
    "burgas": [
        # City center
        "Център", "Възраждане", "Лазур", "Славейков", "Зорница", "Изгрев",
        "Меден рудник - зона А", "Меден рудник - зона Б", "Меден рудник - зона В",
        "Братя Миладинови", "Акации", "Победа", "Долно Езерово", "Горно Езерово",
        # Coastal
        "Сарафово", "Крайморие", "Ветрен",
        # Nearby resorts (within Burgas region)
        "Св. Влас", "Слънчев бряг", "Несебър - стар град", "Несебър - нова част",
        "Равда", "Поморие - център", "Поморие - изток", "Ахелой",
        "Созопол - стар град", "Созопол - Харманите", "Черноморец",
        "Приморско", "Китен", "Царево", "Лозенец",
        # Industrial/Other
        "Долни Езерец", "Рудник", "Банево", "Черно море"
    ]
}

# Sources with realistic distribution and real search URLs
SOURCES = [
    ("imot_bg", 0.35, "https://www.imot.bg"),
    ("homes_bg", 0.18, "https://www.homes.bg"),
    ("olx_bg", 0.20, "https://www.olx.bg"),
    ("alo_bg", 0.08, "https://www.alo.bg"),
    ("address_bg", 0.09, "https://address.bg"),
    ("bazar_bg", 0.05, "https://bazar.bg"),
    ("buildingbox_bg", 0.05, "https://buildingbox.bg"),
]

# Real search URL patterns for each source
SOURCE_URLS = {
    "imot_bg": {
        "sofia": {
            "apartment_1": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/ednostaen",
            "apartment_2": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/dvustaen",
            "apartment_3": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/tristaen",
            "apartment_4": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/mnogostaen",
            "studio": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/ednostaen",
            "house": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/kashta",
            "land": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/parcel",
            "commercial": "https://www.imot.bg/obiavi/prodazhbi/grad-sofiya/magazin",
        },
        "burgas": {
            "apartment_1": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/ednostaen",
            "apartment_2": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/dvustaen",
            "apartment_3": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/tristaen",
            "apartment_4": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/mnogostaen",
            "studio": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/ednostaen",
            "house": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/kashta",
            "land": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/parcel",
            "commercial": "https://www.imot.bg/obiavi/prodazhbi/grad-burgas/magazin",
        }
    },
    "homes_bg": {
        "sofia": "https://www.homes.bg/prodazhbi/sofiya/",
        "burgas": "https://www.homes.bg/prodazhbi/burgas/",
    },
    "olx_bg": {
        "sofia": {
            "apartment": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/apartamenti/oblast-sofiya-grad/",
            "house": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/kashti/oblast-sofiya-grad/",
            "land": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/zemya/oblast-sofiya-grad/",
            "commercial": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/magazini-ofisi-zali/oblast-sofiya-grad/",
        },
        "burgas": {
            "apartment": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/apartamenti/oblast-burgas/",
            "house": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/kashti/oblast-burgas/",
            "land": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/zemya/oblast-burgas/",
            "commercial": "https://www.olx.bg/d/nedvizhimi-imoti/prodazhbi/magazini-ofisi-zali/oblast-burgas/",
        }
    },
    "alo_bg": {
        "sofia": "https://www.alo.bg/",
        "burgas": "https://www.alo.bg/",
    },
    "address_bg": {
        "sofia": "https://address.bg/",
        "burgas": "https://address.bg/",
    },
    "bazar_bg": {
        "sofia": "https://bazar.bg/",
        "burgas": "https://bazar.bg/",
    },
    "buildingbox_bg": {
        "sofia": "https://buildingbox.bg/",
        "burgas": "https://buildingbox.bg/",
    }
}

# Property types with distribution
PROPERTY_TYPES = [
    ("apartment_1", 0.12, "Едностаен апартамент"),
    ("apartment_2", 0.30, "Двустаен апартамент"),
    ("apartment_3", 0.22, "Тристаен апартамент"),
    ("apartment_4", 0.08, "Четиристаен апартамент"),
    ("studio", 0.06, "Студио"),
    ("house", 0.08, "Къща"),
    ("land", 0.08, "Парцел"),
    ("commercial", 0.06, "Търговски обект"),
]

# Price ranges by property type and city
PRICE_RANGES = {
    "sofia": {
        "studio": (40000, 95000),
        "apartment_1": (55000, 140000),
        "apartment_2": (75000, 220000),
        "apartment_3": (110000, 350000),
        "apartment_4": (160000, 550000),
        "house": (180000, 900000),
        "land": (25000, 600000),
        "commercial": (90000, 1500000),
    },
    "burgas": {
        "studio": (30000, 70000),
        "apartment_1": (40000, 100000),
        "apartment_2": (55000, 160000),
        "apartment_3": (80000, 250000),
        "apartment_4": (120000, 400000),
        "house": (100000, 600000),
        "land": (15000, 400000),
        "commercial": (60000, 800000),
    }
}

# Area ranges
AREA_RANGES = {
    "studio": (22, 42),
    "apartment_1": (38, 65),
    "apartment_2": (58, 95),
    "apartment_3": (85, 140),
    "apartment_4": (115, 220),
    "house": (120, 450),
    "land": (200, 8000),
    "commercial": (30, 600),
}

# Neighborhood premium multipliers
PREMIUM_NEIGHBORHOODS = {
    # Sofia premium areas
    "Лозенец": 1.35, "Център": 1.30, "Оборище": 1.25, "Докторски паметник": 1.25,
    "Витоша": 1.40, "Бояна": 1.45, "Драгалевци": 1.50, "Симеоново": 1.35,
    "Иван Вазов": 1.20, "Яворов": 1.20, "Изток": 1.15, "Гео Милев": 1.10,
    "Манастирски ливади": 1.25, "Кръстова вада": 1.30, "Борово": 1.20,
    # Burgas premium areas
    "Св. Влас": 1.25, "Слънчев бряг": 1.15, "Несебър - стар град": 1.30,
    "Созопол - стар град": 1.35, "Сарафово": 1.20, "Поморие - център": 1.10,
}


def get_real_source_url(source: str, city: str, prop_type: str) -> str:
    """Get real search URL for source, city, and property type."""
    source_data = SOURCE_URLS.get(source, {})

    if source == "imot_bg":
        city_data = source_data.get(city, {})
        return city_data.get(prop_type, f"https://www.imot.bg/obiavi/prodazhbi/grad-{city}")

    elif source == "olx_bg":
        city_data = source_data.get(city, {})
        if prop_type.startswith("apartment") or prop_type == "studio":
            return city_data.get("apartment", f"https://www.olx.bg/d/nedvizhimi-imoti/")
        return city_data.get(prop_type, f"https://www.olx.bg/d/nedvizhimi-imoti/")

    else:
        # Other sources have simple city-based URLs
        city_url = source_data.get(city)
        if city_url:
            return city_url
        # Fallback
        base_urls = {
            "homes_bg": "https://www.homes.bg",
            "alo_bg": "https://www.alo.bg",
            "address_bg": "https://address.bg",
            "bazar_bg": "https://bazar.bg",
            "buildingbox_bg": "https://buildingbox.bg",
        }
        return base_urls.get(source, "https://www.imot.bg")


def generate_listing_id():
    """Generate unique listing ID."""
    return f"listing-{uuid.uuid4().hex[:12]}"


def generate_source_id(source: str):
    """Generate source-specific ID."""
    prefixes = {
        "imot_bg": "1b17",
        "homes_bg": "as",
        "olx_bg": "bg",
        "alo_bg": "al",
        "address_bg": "ad",
        "bazar_bg": "bz",
        "buildingbox_bg": "bb",
    }
    prefix = prefixes.get(source, "xx")
    return f"{prefix}{random.randint(10000000, 99999999)}"


def generate_photos(count=5):
    """Generate placeholder photo URLs."""
    photos = []
    for i in range(count):
        seed = random.randint(1, 5000)
        photos.append(f"https://picsum.photos/seed/{seed}/800/600")
    return photos


def generate_price_history(current_price: float, months: int = 6):
    """Generate realistic price history."""
    history = []
    price = current_price * random.uniform(0.95, 1.12)

    for i in range(months, 0, -1):
        date = datetime.now() - timedelta(days=i * 30 + random.randint(-5, 5))
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(price)
        })
        # Random price change
        change = random.uniform(-0.04, 0.025)
        price = price * (1 + change)

    history.append({
        "date": datetime.now().strftime("%Y-%m-%d"),
        "price": round(current_price)
    })

    return history


def calculate_deal_score(price_per_sqm: float, city: str, neighborhood: str) -> int:
    """Calculate deal score based on price per sqm."""
    # Base thresholds by city
    thresholds = {
        "sofia": (1200, 1600, 2200, 2800),
        "burgas": (800, 1200, 1600, 2200)
    }
    t = thresholds.get(city, thresholds["sofia"])

    # Adjust for premium neighborhoods
    premium = PREMIUM_NEIGHBORHOODS.get(neighborhood, 1.0)
    adjusted_ppsqm = price_per_sqm / premium

    if adjusted_ppsqm < t[0]:
        score = random.randint(88, 98)
    elif adjusted_ppsqm < t[1]:
        score = random.randint(75, 92)
    elif adjusted_ppsqm < t[2]:
        score = random.randint(55, 78)
    elif adjusted_ppsqm < t[3]:
        score = random.randint(40, 60)
    else:
        score = random.randint(25, 45)

    return score


def generate_description(prop_type: str, neighborhood: str, area: float, floor: int, total_floors: int, city: str) -> str:
    """Generate realistic Bulgarian description."""
    type_names = {
        "studio": "студио",
        "apartment_1": "едностаен апартамент",
        "apartment_2": "двустаен апартамент",
        "apartment_3": "тристаен апартамент",
        "apartment_4": "многостаен апартамент",
        "house": "къща",
        "land": "парцел",
        "commercial": "търговски обект",
    }

    type_name = type_names.get(prop_type, "имот")
    city_name = "София" if city == "sofia" else "Бургас"

    if prop_type == "land":
        templates = [
            f"Продава се {type_name} в {neighborhood}, {city_name}. Площ {area:.0f} кв.м. Подходящ за строителство на жилищна или търговска сграда.",
            f"Атрактивен {type_name} в {neighborhood}. Равен терен с лице към асфалтиран път. Всички комуникации са налични.",
            f"УПИ в регулация в {neighborhood}, {city_name}. Площ {area:.0f} кв.м. Отлична локация за инвестиция.",
        ]
    elif prop_type == "commercial":
        templates = [
            f"Търговски обект в {neighborhood}, {city_name}. Площ {area:.0f} кв.м. Подходящ за магазин, офис или заведение.",
            f"Просторен {type_name} на оживена улица в {neighborhood}. Голяма витрина и добра видимост.",
            f"Офис площ в бизнес сграда в {neighborhood}. {area:.0f} кв.м с паркомясто.",
        ]
    elif prop_type == "house":
        templates = [
            f"Продава се {type_name} в {neighborhood}, {city_name}. РЗП {area:.0f} кв.м. Двор с озеленяване.",
            f"Просторна {type_name} в {neighborhood}. {area:.0f} кв.м, гараж и двор.",
            f"Самостоятелна {type_name} с двор в {neighborhood}. Тиха локация, панорамна гледка.",
        ]
    else:
        floor_info = f"{floor}-ти етаж от {total_floors}" if floor else ""
        templates = [
            f"Продава се {type_name} в квартал {neighborhood}, {city_name}. {area:.0f} кв.м, {floor_info}. Слънчев и просторен.",
            f"Светъл {type_name} с отлична локация в {neighborhood}. {area:.0f} кв.м, {floor_info}. Изглед към града.",
            f"Напълно обзаведен {type_name} в {neighborhood}. {area:.0f} кв.м. Идеален за живеене или инвестиция.",
            f"Слънчев {type_name} в престижния квартал {neighborhood}. {area:.0f} кв.м, {floor_info}. Ниски такси.",
        ]

    return random.choice(templates)


def generate_listing(city: str, source_override: str = None) -> dict:
    """Generate a single listing."""
    # Choose source
    if source_override:
        source = source_override
        base_url = next((s[2] for s in SOURCES if s[0] == source), "https://example.com")
    else:
        source_choice = random.choices(
            [s[0] for s in SOURCES],
            weights=[s[1] for s in SOURCES]
        )[0]
        source = source_choice
        base_url = next((s[2] for s in SOURCES if s[0] == source), "https://example.com")

    # Choose property type
    prop_type = random.choices(
        [p[0] for p in PROPERTY_TYPES],
        weights=[p[1] for p in PROPERTY_TYPES]
    )[0]
    prop_label = next((p[2] for p in PROPERTY_TYPES if p[0] == prop_type), "Имот")

    # Choose neighborhood
    neighborhood = random.choice(NEIGHBORHOODS[city])

    # Generate price
    price_range = PRICE_RANGES[city][prop_type]
    base_price = random.uniform(price_range[0], price_range[1])

    # Apply neighborhood premium
    premium = PREMIUM_NEIGHBORHOODS.get(neighborhood, 1.0)
    price_eur = round(base_price * premium)

    # Generate area
    area_range = AREA_RANGES[prop_type]
    area_sqm = round(random.uniform(area_range[0], area_range[1]), 1)

    # Price per sqm
    price_per_sqm = round(price_eur / area_sqm, 2)

    # Floor (not for land/house)
    if prop_type in ["land", "house"]:
        floor = None
        total_floors = None
    else:
        total_floors = random.randint(4, 16)
        floor = random.randint(1, total_floors)

    # Generate IDs
    listing_id = generate_listing_id()
    source_id = generate_source_id(source)

    # Source URL - use real search page URLs
    source_url = get_real_source_url(source, city, prop_type)

    # Title
    title = f"{prop_label}, {area_sqm:.0f} m², {neighborhood}"

    # Description
    description = generate_description(prop_type, neighborhood, area_sqm, floor, total_floors, city)

    # Timing
    hours_ago = random.randint(1, 720)  # Up to 30 days
    created_at = datetime.now() - timedelta(hours=hours_ago)
    is_new = hours_ago < 24

    # Agency
    is_agency = random.random() < 0.65

    # Deal score
    deal_score = calculate_deal_score(price_per_sqm, city, neighborhood)

    # Price history (40% chance)
    price_history = generate_price_history(price_eur) if random.random() < 0.4 else None

    return {
        "id": listing_id,
        "source": source,
        "source_id": source_id,
        "source_url": source_url,
        "city": city,
        "neighborhood": neighborhood,
        "property_type": prop_type,
        "title": title,
        "description": description,
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
        "price_history": price_history,
    }


def generate_dataset(total_listings: int = 5000):
    """Generate complete dataset."""
    listings = []

    # City distribution
    city_weights = {"sofia": 0.62, "burgas": 0.38}

    for i in range(total_listings):
        city = random.choices(
            list(city_weights.keys()),
            weights=list(city_weights.values())
        )[0]
        listings.append(generate_listing(city))

        if (i + 1) % 500 == 0:
            print(f"Generated {i + 1} listings...")

    # Sort by created_at descending
    listings.sort(key=lambda x: x["created_at"], reverse=True)

    return listings


def calculate_stats(listings: list) -> dict:
    """Calculate statistics."""
    stats = {
        "total_listings": len(listings),
        "new_today": sum(1 for l in listings if l.get("is_new")),
        "price_drops": random.randint(30, 80),
        "avg_price": round(sum(l["price_eur"] for l in listings) / len(listings)),
        "avg_price_per_sqm": round(sum(l["price_per_sqm"] for l in listings) / len(listings)),
        "cities": {},
        "sources": {},
        "property_types": {},
        "neighborhoods": {}
    }

    for listing in listings:
        city = listing["city"]
        source = listing["source"]
        ptype = listing["property_type"]
        neighborhood = listing["neighborhood"]

        stats["cities"][city] = stats["cities"].get(city, 0) + 1
        stats["sources"][source] = stats["sources"].get(source, 0) + 1
        stats["property_types"][ptype] = stats["property_types"].get(ptype, 0) + 1
        stats["neighborhoods"][neighborhood] = stats["neighborhoods"].get(neighborhood, 0) + 1

    return stats


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=5000)
    parser.add_argument("--output", default="demo_data.json")

    args = parser.parse_args()

    print(f"Generating {args.count} listings...")

    listings = generate_dataset(args.count)
    stats = calculate_stats(listings)

    output = {
        "generated_at": datetime.now().isoformat(),
        "listings": listings,
        "stats": stats,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print("DATASET GENERATED")
    print('='*60)
    print(f"Total listings: {stats['total_listings']}")
    print(f"New today: {stats['new_today']}")
    print(f"Average price: €{stats['avg_price']:,}")
    print(f"Average price/m²: €{stats['avg_price_per_sqm']:,}")
    print(f"\nBy city:")
    for city, count in stats['cities'].items():
        print(f"  {city}: {count}")
    print(f"\nBy source:")
    for source, count in sorted(stats['sources'].items(), key=lambda x: -x[1]):
        print(f"  {source}: {count}")
    print(f"\nBy property type:")
    for ptype, count in sorted(stats['property_types'].items(), key=lambda x: -x[1]):
        print(f"  {ptype}: {count}")
    print(f"\nTop neighborhoods:")
    for n, count in sorted(stats['neighborhoods'].items(), key=lambda x: -x[1])[:10]:
        print(f"  {n}: {count}")
    print(f"\nSaved to: {args.output}")


if __name__ == "__main__":
    main()
