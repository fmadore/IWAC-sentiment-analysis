"""Backward-compatible facade for the importable :mod:`iwac_preprocess` core.

Existing command names remain stable for researchers and documentation. New
code and tests should import ``iwac_preprocess`` directly.
"""

from iwac_preprocess import *  # noqa: F401,F403

# Re-exported for older command-line helpers; they now live beside the analysis.
from iwac_preprocess.extremes import (  # noqa: E402,F401
    EXTREME_CENTRALITY_MARGINAL,
    EXTREME_CENTRALITY_VERY_CENTRAL,
    EXTREME_POLARITY_VERY_NEGATIVE,
    EXTREME_POLARITY_VERY_POSITIVE,
    EXTREME_SUBJECTIVITY_HIGH,
    EXTREME_SUBJECTIVITY_LOW,
)
