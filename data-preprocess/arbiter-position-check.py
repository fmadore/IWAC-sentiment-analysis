"""
Check the published v2 panel arbiter for position bias, offline and read-only.

Recomputes, from ``static/data/iwac_arbiter_evaluations_v2.json`` and the
prompt's own ``display_order``, the slot in which each single-winner verdict's
winning analysis was presented, then runs a naive χ² against a uniform split
and a seating-adjusted permutation test (see ``iwac_preprocess.position_bias``
for the method and its limits). No API call, no network, nothing written.

    python data-preprocess/arbiter-position-check.py
    python data-preprocess/arbiter-position-check.py --json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from iwac_preprocess.arbiter_prompt import display_order
from iwac_preprocess.position_bias import PERMUTATION_SEED, PERMUTATIONS, position_bias_report
from validate_generated_data import ARBITER_V2_FILENAME, DATA_DIR


def main(argv: list[str] | None = None) -> dict:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--file", type=Path, default=DATA_DIR / ARBITER_V2_FILENAME)
    parser.add_argument("--permutations", type=int, default=PERMUTATIONS)
    parser.add_argument("--seed", type=int, default=PERMUTATION_SEED)
    parser.add_argument("--json", action="store_true", help="Print the report as JSON.")
    args = parser.parse_args(argv)

    payload = json.loads(args.file.read_text(encoding="utf-8"))
    report = position_bias_report(
        payload, display_order, permutations=args.permutations, seed=args.seed
    )
    if args.json:
        print(json.dumps(report, indent=2))
        return report

    naive, adjusted = report["naive"], report["seating_adjusted"]
    print(
        f"{report['single_winner']} single-winner verdicts of {report['verdicts']}, "
        f"{report['slots']} presentation slots"
    )
    print(f"Wins by slot (first to last): {naive['observed']}")
    print(
        f"Naive: chi2 = {naive['chi2']} on {naive['df']} df against a uniform "
        f"{naive['expected'][0]} per slot, p = {naive['p']}"
    )
    print(f"Seating-adjusted expected wins: {adjusted['expected']}")
    print(
        f"Seating-adjusted: chi2 = {adjusted['chi2']}, permutation p = "
        f"{adjusted['p_permutation']} ({adjusted['permutations']} permutations, seed "
        f"{adjusted['seed']}); asymptotic p = {adjusted['p_asymptotic']} (approximate)"
    )
    return report


if __name__ == "__main__":
    main()
