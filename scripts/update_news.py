#!/usr/bin/env python3
"""Fetch regional headlines for the public POWER RADIO website."""
import datetime as dt
import email.utils
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

REGIONS = ["Langerwehe", "Düren", "Jülich", "Aachen"]
OUT = pathlib.Path(__file__).resolve().parents[1] / "news.json"
now = dt.datetime.now(dt.timezone.utc)
result = {"updated_at": now.isoformat(), "regions": {}}
for region in REGIONS:
    query = urllib.parse.quote(f'"{region}" Nachrichten when:7d')
    url = f"https://news.google.com/rss/search?q={query}&hl=de&gl=DE&ceid=DE:de"
    entries = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "POWER-RADIO-News/1.0"})
        with urllib.request.urlopen(req, timeout=20) as response:
            root = ET.fromstring(response.read(2_000_000))
        for item in root.findall("./channel/item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            source = item.find("source")
            publisher = source.text.strip() if source is not None and source.text else "Google News"
            date_str = (item.findtext("pubDate") or "").strip()
            try:
                published = email.utils.parsedate_to_datetime(date_str).astimezone(dt.timezone.utc)
            except (TypeError, ValueError):
                continue
            if not title or not link or not link.startswith("https://"):
                continue
            if published < now - dt.timedelta(days=7) or published > now + dt.timedelta(hours=1):
                continue
            entries.append({"title": title[:220], "url": link, "source": publisher[:100], "published_at": published.isoformat()})
            if len(entries) == 6:
                break
    except Exception as exc:
        print(f"Feed unavailable for {region}: {exc}")
    result["regions"][region] = entries
# Preserve previous region headlines on temporary feed errors, but never serve older than 7 days.
if OUT.exists():
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
        for region in REGIONS:
            if not result["regions"][region]:
                for entry in old.get("regions", {}).get(region, []):
                    date = dt.datetime.fromisoformat(entry["published_at"].replace("Z", "+00:00"))
                    if date >= now - dt.timedelta(days=7):
                        result["regions"][region].append(entry)
    except (ValueError, KeyError, TypeError):
        pass
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Updated news.json", {k: len(v) for k, v in result["regions"].items()})
