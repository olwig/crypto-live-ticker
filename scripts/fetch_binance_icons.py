#!/usr/bin/env python3
"""Fetch Binance spot TRADING pairs and official base-asset PNG icons.

Usage:
  python3 fetch_binance_icons.py
  python3 fetch_binance_icons.py --out ./assets

Writes:
  {out}/{symbol.lower()}.png     e.g. btcusdt.png  (ticker drop-in)
  mapping.csv
  symbols-trading.txt
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import ssl
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

EXCHANGE_INFO = "https://data-api.binance.vision/api/v3/exchangeInfo"
LOGO = "https://bin.bnbstatic.com/static/assets/logos/{base}.png"
UA = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 "
        "fetch-binance-icons/1.0"
    )
}
CTX = ssl.create_default_context()


def http_get(url: str, timeout: int = 25) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
        return resp.read()


def load_pairs() -> list[dict]:
    raw = json.loads(http_get(EXCHANGE_INFO))
    pairs = [
        {
            "symbol": s["symbol"],
            "base": s["baseAsset"],
            "quote": s["quoteAsset"],
        }
        for s in raw["symbols"]
        if s.get("status") == "TRADING"
    ]
    pairs.sort(key=lambda p: p["symbol"])
    return pairs


def fetch_logo(base: str) -> tuple[str, bytes | None, str]:
    encoded = urllib.parse.quote(base, safe="")
    url = LOGO.format(base=encoded)
    try:
        blob = http_get(url)
    except Exception as exc:
        return base, None, str(exc)
    if blob[:8] != b"\x89PNG\r\n\x1a\n" or len(blob) < 80:
        return base, None, "not a png"
    return base, blob, url


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="assets/", help="output directory")
    ap.add_argument("--workers", type=int, default=12, help="concurrent workers for fetching logos")
    args = ap.parse_args()

    out = Path(args.out)

    print(f"output directory: {out}", flush=True)

    out.mkdir(parents=True, exist_ok=True)

    print("exchangeInfo …", flush=True)
    pairs = load_pairs()
    bases = sorted({p["base"] for p in pairs})
    print(f"TRADING pairs: {len(pairs)}  unique bases: {len(bases)}", flush=True)

    (Path.cwd() / "binance-spot-symbols-trading.txt").write_text(
        "\n".join(p["symbol"] for p in pairs) + "\n", encoding="utf-8"
    )

    logos: dict[str, bytes] = {}
    failed: list[tuple[str, str]] = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futs = [pool.submit(fetch_logo, b) for b in bases]
        for i, fut in enumerate(as_completed(futs), 1):
            base, blob, src = fut.result()
            if blob:
                logos[base] = blob
            else:
                failed.append((base, src))
            if i % 50 == 0 or i == len(bases):
                print(f"  logos {i}/{len(bases)} ok={len(logos)} fail={len(failed)}", flush=True)

    written = 0
    rows = []
    for p in pairs:
        name = p["symbol"].lower() + ".png"
        ok = p["base"] in logos
        if ok:
            (out / name).write_bytes(logos[p["base"]])
            written += 1
        rows.append(
            {
                "symbol": p["symbol"],
                "base": p["base"],
                "quote": p["quote"],
                "pair_png": name,
                "icon_ok": "1" if ok else "0",
            }
        )

    map_path = Path.cwd() / "mapping.csv"
    with map_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["symbol", "base", "quote", "pair_png", "icon_ok"])
        w.writeheader()
        w.writerows(rows)

    miss_path = Path.cwd() / "missing-bases.txt"
    miss_path.write_text("\n".join(f"{b}\t{err}" for b, err in failed) + "\n", encoding="utf-8")

    print(f"wrote {written}/{len(pairs)} pair PNGs -> {Path.cwd()}")
    print(f"mapping -> {map_path}")
    if failed:
        print(f"missing bases ({len(failed)}): " + ", ".join(b for b, _ in failed[:20]))
    return 0 if written else 1


if __name__ == "__main__":
    sys.exit(main())
