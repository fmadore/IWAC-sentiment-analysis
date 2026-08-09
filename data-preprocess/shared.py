"""Backward-compatible facade for the importable :mod:`iwac_preprocess` core.

Existing command names remain stable for researchers and documentation. New
code and tests should import ``iwac_preprocess`` directly.
"""

from iwac_preprocess import *  # noqa: F401,F403

# Extreme-analysis constants are presentation categories rather than part of
# the cross-language sentiment contract.
EXTREME_SUBJECTIVITY_HIGH = 4
EXTREME_SUBJECTIVITY_LOW = 2
EXTREME_POLARITY_VERY_NEGATIVE = "Très négatif"
EXTREME_POLARITY_VERY_POSITIVE = "Très positif"
EXTREME_CENTRALITY_VERY_CENTRAL = "Très central"
EXTREME_CENTRALITY_MARGINAL = "Marginal"
