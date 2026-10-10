#!/usr/bin/env bash
# Copy source images into ./assets so the page stays self-contained and
# deployable on its own (GitHub Pages serves this folder as the site root).
# Re-run after you update anything in the source image folder.
set -euo pipefail
cd "$(dirname "$0")"

# Source folder holding the original images. Auto-detected so this works both
# in the standalone layout (../img) and after the page moves into a code repo's
# docs/ folder (../figures). Override with:  SRC=path/to/images ./sync-assets.sh
if [ -z "${SRC:-}" ]; then
  for candidate in ../img ../figures ../../figures ../../img; do
    if [ -d "$candidate/slider" ]; then SRC="$candidate"; break; fi
  done
fi
[ -n "${SRC:-}" ] && [ -d "$SRC/slider" ] || {
  echo "error: no source image folder found (looked for ../img, ../figures)." >&2
  echo "       set it explicitly:  SRC=path/to/images ./sync-assets.sh" >&2
  exit 1
}
echo "source: $SRC"

# Stage into a temp dir and swap only once every copy succeeded. Deleting the
# live folders up front would leave the site with missing images if anything
# failed part-way through — which is exactly what happened once already.
STAGE=".sync-stage.$$"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

rm -rf "$STAGE"
mkdir -p "$STAGE"

# Optional folders. `compare/` fed the auto-sweeping head-to-head, which the
# page no longer renders; it is kept working so an existing source tree still
# syncs, but its absence is not an error.
if [ -d "$SRC/compare" ]; then
  mkdir -p "$STAGE/compare"
  cp "$SRC"/compare/*.png "$STAGE/compare/"
fi

# Pick up every numbered subfolder that exists, so adding img/slider/7 needs
# no edit here.
for dir in "$SRC"/slider/*/; do
  n="$(basename "$dir")"
  mkdir -p "$STAGE/slider/$n"
  cp "$dir"*.png "$STAGE/slider/$n/"
done

# The 4-up synced-magnifier row (Input / GT / CSUD / Ours). Optional: the page
# renders fine without it, so a source tree that predates it must still sync.
if [ -d "$SRC/loupe" ]; then
  mkdir -p "$STAGE/loupe"
  cp "$SRC"/loupe/*.png "$STAGE/loupe/"
fi

# The two self-demonstrating widgets (auto sweep, auto magnifier) run on this
# one throwaway pair rather than on a result scene, so a reader never mistakes
# a control demo for a claim about a particular image.
if [ -d "$SRC/sample" ]; then
  mkdir -p "$STAGE/sample"
  cp "$SRC"/sample/*.png "$STAGE/sample/"
fi

count="$(find "$STAGE" -name '*.png' | wc -l | tr -d ' ')"
[ "$count" -gt 0 ] || { echo "error: staged 0 images, refusing to swap." >&2; exit 1; }

# Swap: both folders are replaced together, after all copying is done.
rm -rf assets/compare assets/slider assets/loupe assets/sample
mkdir -p assets
mv "$STAGE/slider" assets/slider
if [ -d "$STAGE/compare" ]; then mv "$STAGE/compare" assets/compare; fi
# `[ -d ] && mv` would abort the whole script under `set -e` when the folder
# is absent, which is the supported case here.
if [ -d "$STAGE/loupe" ]; then mv "$STAGE/loupe" assets/loupe; fi
if [ -d "$STAGE/sample" ]; then mv "$STAGE/sample" assets/sample; fi

echo "synced $count images into assets/"
find assets/compare assets/slider assets/loupe assets/sample -name '*.png' 2>/dev/null | sort
