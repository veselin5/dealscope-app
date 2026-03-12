#!/usr/bin/env python3
"""
Main scraper runner script.

Usage:
    python run_scraper.py --source homes_bg --city sofia --pages 3
    python run_scraper.py --all --city sofia --pages 2
    python run_scraper.py --source olx_bg --dry-run --pages 1

Options:
    --source NAME    Scraper to run (homes_bg, address_bg, bazar_bg, olx_bg, buildingbox_bg)
    --all            Run all scrapers
    --city CITY      City to scrape (sofia, burgas, varna, plovdiv) [default: sofia]
    --pages N        Maximum pages to scrape per source [default: 3]
    --dry-run        Print results without saving to database
    --output FILE    Output results to JSON file
"""
import argparse
import json
import sys
from datetime import datetime
from typing import List, Dict, Any

from parsers import get_scraper, get_all_scrapers, SCRAPERS


def run_scraper(
    source: str,
    city: str = "sofia",
    max_pages: int = 3,
    dry_run: bool = False,
) -> List[Dict[str, Any]]:
    """Run a single scraper and return results."""
    print(f"\n{'='*60}")
    print(f"Running {source} scraper for {city}")
    print(f"{'='*60}")

    try:
        scraper = get_scraper(source)
        listings = scraper.scrape(city=city, max_pages=max_pages)

        print(f"\nResults for {source}:")
        print(f"  - Total listings: {len(listings)}")

        if listings:
            avg_price = sum(l.get("price_eur", 0) for l in listings) / len(listings)
            with_area = [l for l in listings if l.get("area_sqm")]
            avg_area = sum(l.get("area_sqm", 0) for l in with_area) / len(with_area) if with_area else 0

            print(f"  - Average price: €{avg_price:,.0f}")
            print(f"  - Average area: {avg_area:.0f} m²")
            print(f"  - With photos: {sum(1 for l in listings if l.get('photos'))}")
            print(f"  - Agency listings: {sum(1 for l in listings if l.get('is_agency'))}")

        return listings

    except Exception as e:
        print(f"Error running {source}: {e}")
        return []


def run_all_scrapers(
    city: str = "sofia",
    max_pages: int = 3,
    dry_run: bool = False,
) -> Dict[str, List[Dict[str, Any]]]:
    """Run all scrapers and return combined results."""
    results = {}

    for source in SCRAPERS.keys():
        listings = run_scraper(source, city, max_pages, dry_run)
        results[source] = listings

    return results


def save_results(results: Dict[str, List], output_file: str):
    """Save results to JSON file."""
    data = {
        "scraped_at": datetime.utcnow().isoformat(),
        "sources": results,
        "totals": {
            "sources": len(results),
            "listings": sum(len(listings) for listings in results.values()),
        }
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nResults saved to {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="DealScope Real Estate Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run_scraper.py --source homes_bg --city sofia --pages 3
    python run_scraper.py --all --city burgas --pages 2
    python run_scraper.py --source olx_bg --dry-run --output results.json
        """
    )

    parser.add_argument(
        "--source",
        choices=list(SCRAPERS.keys()),
        help="Scraper to run"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run all scrapers"
    )
    parser.add_argument(
        "--city",
        choices=["sofia", "burgas", "varna", "plovdiv"],
        default="sofia",
        help="City to scrape (default: sofia)"
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=3,
        help="Maximum pages to scrape per source (default: 3)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print results without saving to database"
    )
    parser.add_argument(
        "--output",
        help="Output results to JSON file"
    )

    args = parser.parse_args()

    if not args.source and not args.all:
        parser.print_help()
        print("\nError: Please specify --source or --all")
        sys.exit(1)

    print(f"\nDealScope Scraper")
    print(f"{'='*60}")
    print(f"City: {args.city}")
    print(f"Max pages: {args.pages}")
    print(f"Dry run: {args.dry_run}")
    print(f"Output: {args.output or 'None'}")

    if args.all:
        results = run_all_scrapers(args.city, args.pages, args.dry_run)
    else:
        listings = run_scraper(args.source, args.city, args.pages, args.dry_run)
        results = {args.source: listings}

    # Print summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")

    total_listings = 0
    for source, listings in results.items():
        count = len(listings)
        total_listings += count
        print(f"  {source}: {count} listings")

    print(f"  {'='*40}")
    print(f"  TOTAL: {total_listings} listings")

    if args.output:
        save_results(results, args.output)

    if args.dry_run and total_listings > 0:
        print("\n[DRY RUN] Sample listing:")
        for source, listings in results.items():
            if listings:
                sample = listings[0]
                print(json.dumps(sample, ensure_ascii=False, indent=2))
                break


if __name__ == "__main__":
    main()
