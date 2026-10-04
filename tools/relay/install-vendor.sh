#!/usr/bin/env bash
# Installs the relay's PHP packages (the official Anthropic PHP SDK, anthropic-ai/sdk, and what it needs) into
# tools/relay/nbh-relay/vendor/, exactly as pinned in nbh-relay/composer.lock. Used by build-zip.sh and
# tests/run.sh; the person who uploads the zip never runs composer.
#
# When composer cannot fetch a package's release archive (dist) it clones the package's git repository instead.
# Such a clone carries .git, tests and docs; each one is cut back here to what its release archive holds
# (git archive applies the package's own export-ignore rules, which is how the archive is made), so the
# vendor folder has no nested git repositories and the upload stays small.
#
#   tools/relay/install-vendor.sh            install if vendor/ is missing or older than composer.lock
#   tools/relay/install-vendor.sh --force    remove vendor/ and install again
#   tools/relay/install-vendor.sh --update   re-resolve the versions in composer.json and rewrite composer.lock
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$HERE/nbh-relay"
VENDOR="$APP/vendor"
MODE="${1:-}"

command -v composer >/dev/null 2>&1 || { echo "install-vendor: composer is not installed (https://getcomposer.org)" >&2; exit 1; }
export COMPOSER_ALLOW_SUPERUSER=1 COMPOSER_NO_INTERACTION=1
# The relay's own version, so composer does not read it from this repository's git branch and commit (which
# would change vendor/composer/installed.php on every install and put the branch name in the upload).
export COMPOSER_ROOT_VERSION=1.0.0

if [ "$MODE" = "--update" ]; then
  rm -rf "$VENDOR"
  composer update --working-dir="$APP" --no-dev --prefer-dist --no-plugins --no-scripts --no-progress
elif [ "$MODE" = "--force" ] || [ ! -f "$VENDOR/autoload.php" ] || [ "$APP/composer.lock" -nt "$VENDOR/autoload.php" ]; then
  rm -rf "$VENDOR"
  composer install --working-dir="$APP" --no-dev --prefer-dist --no-plugins --no-scripts --no-progress
else
  echo "install-vendor: vendor/ is up to date with composer.lock"
  exit 0
fi

# Trim git clones to their release contents.
trimmed=0
while IFS= read -r -d '' gitdir; do
  pkg="$(dirname "$gitdir")"
  tmp="$(mktemp -d)"
  git -C "$pkg" archive --format=tar HEAD | tar -x -C "$tmp"
  rm -rf "$pkg"
  mkdir -p "$pkg"
  # move everything, dotfiles included
  (shopt -s dotglob nullglob; mv "$tmp"/* "$pkg"/)
  rmdir "$tmp"
  trimmed=$((trimmed + 1))
done < <(find "$VENDOR" -mindepth 3 -maxdepth 3 -type d -name .git -print0)

# standard-webhooks/standard-webhooks (a dependency of the SDK, for webhook signatures) is one repository with
# its library in ten languages; composer loads only libraries/php/src. Keep that, its licence and composer.json.
SW="$VENDOR/standard-webhooks/standard-webhooks"
if [ -d "$SW/libraries/php/src" ]; then
  find "$SW" -mindepth 1 -maxdepth 1 ! -name composer.json ! -name LICENSE ! -name README.md ! -name libraries -exec rm -rf {} +
  find "$SW/libraries" -mindepth 1 -maxdepth 1 ! -name php -exec rm -rf {} +
  find "$SW/libraries/php" -mindepth 1 -maxdepth 1 ! -name src -exec rm -rf {} +
fi

# Nothing in vendor/ may be a git repository, a test suite or a developer tool.
if find "$VENDOR" -name .git -print -quit | grep -q .; then echo "install-vendor: a .git folder is still in vendor/" >&2; exit 1; fi
if find "$VENDOR" -type d \( -name tests -o -name Tests \) -print -quit | grep -q .; then echo "install-vendor: a test folder is still in vendor/" >&2; find "$VENDOR" -type d \( -name tests -o -name Tests \) >&2; exit 1; fi
touch "$VENDOR/autoload.php"
echo "install-vendor: installed $(find "$VENDOR" -mindepth 2 -maxdepth 2 -type d | grep -vc '/composer$') packages ($trimmed trimmed from git clones), $(du -sh "$VENDOR" | cut -f1) in vendor/"
