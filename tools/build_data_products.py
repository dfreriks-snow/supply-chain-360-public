#!/usr/bin/env python3
"""Rebuild public/data/data-products.json from the SAP BDC master catalog.

This file used to be maintained by hand, which is why it drifted (it sat at the
2026-07-15 catalog while the master moved on). Keep this script as the only way
it is produced.

Selection rule: every data product whose LineOfBusiness mentions "Supply Chain".
That includes combined assignments such as "Manufacturing,Supply Chain", not
just the exact-match "Supply Chain" products.

Each record is copied verbatim from the master catalog, with the product's CSN
Interop document embedded under `_csn` (raw, i18n tokens unresolved — the client
resolves labels itself).

Existing product order is preserved so refreshes produce a readable diff; newly
qualifying products are appended in catalog order.

Usage:
    python3 tools/build_data_products.py [--workspace PATH] [--check]
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

DEFAULT_WORKSPACE = pathlib.Path("/Users/dfreriks/Documents/SAP/SAP Skills")
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "data" / "data-products.json"
LOB_MATCH = "Supply Chain"


def qualifies(dp: dict) -> bool:
    return LOB_MATCH in (dp.get("LineOfBusiness") or "")


def embed_csn(dp: dict, csn_dir: pathlib.Path) -> dict:
    """Return a copy of dp with its CSN document embedded under `_csn`."""
    record = dict(dp)
    csn = None
    for port in dp.get("_OutputPortsDetail") or []:
        name = port.get("Name")
        if not name:
            continue
        path = csn_dir / f"{name}.csn.json"
        if path.exists():
            csn = json.loads(path.read_text())
            break
    record["_csn"] = csn
    return record


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workspace", type=pathlib.Path, default=DEFAULT_WORKSPACE)
    ap.add_argument("--check", action="store_true",
                    help="report what would change; write nothing")
    args = ap.parse_args()

    master_path = args.workspace / "sap_data_products_full.json"
    csn_dir = args.workspace / "csn_files"
    if not master_path.exists():
        print(f"ERROR: master catalog not found: {master_path}", file=sys.stderr)
        return 1

    master = json.loads(master_path.read_text())["data_products"]
    selected = [dp for dp in master if qualifies(dp)]
    by_name = {dp["TechnicalName"]: dp for dp in selected}

    previous = json.loads(OUT.read_text()) if OUT.exists() else []
    prior_order = [item["TechnicalName"] for item in previous]

    ordered = [by_name[n] for n in prior_order if n in by_name]
    ordered += [dp for dp in selected if dp["TechnicalName"] not in set(prior_order)]

    added = sorted(set(by_name) - set(prior_order))
    removed = sorted(set(prior_order) - set(by_name))
    print(f"master products : {len(master)}")
    print(f"selected (LoB contains {LOB_MATCH!r}): {len(ordered)}")
    print(f"added   : {len(added)} {added if added else ''}")
    print(f"removed : {len(removed)} {removed if removed else ''}")

    if args.check:
        print("--check: nothing written")
        return 0

    payload = [embed_csn(dp, csn_dir) for dp in ordered]
    missing = [p["TechnicalName"] for p in payload if p["_csn"] is None]
    if missing:
        print(f"WARNING: no CSN found for {len(missing)}: {missing}", file=sys.stderr)

    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"wrote {OUT} ({OUT.stat().st_size / 1e6:.1f} MB, {len(payload)} products)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
