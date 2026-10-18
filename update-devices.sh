#!/bin/bash
#
# Update BezelKit's device data from the Xcode on this Mac.
#
#   ./update-devices.sh                 scan, apply, regenerate docs, show what changed
#                                       (also writes the summary to LastDeviceScan.md)
#   ./update-devices.sh --release       ...then commit both repos, push, tag and publish
#   ./update-devices.sh --check         report only: change nothing, exit 1 if anything is out of date
#
# Options:
#   --xcode <path>     use a specific Xcode, e.g. /Applications/Xcode-27.2.app (default: selected one)
#   --verify <mode>    none | flagged | unverified (default: flagged) — how much to confirm by booting simulators
#   --force            with --release, publish even though a multi-screen device is missing per-screen data
#   -h, --help         show this help
#
# Exit codes: 0 up to date / done, 1 changes found (--check) or a step failed, 2 needs a manual measurement.

set -euo pipefail

cd "$(dirname "$0")"

release=false
check=false
force=false
verify=flagged
xcode=""

usage() { sed -n '3,16p' "$0" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --release) release=true ;;
    --check)   check=true ;;
    --force)   force=true ;;
    --verify)  verify="${2:?--verify needs none, flagged or unverified}"; shift ;;
    --xcode)   xcode="${2:?--xcode needs a path to an Xcode.app}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
  shift
done

if $check && $release; then
  echo "--check changes nothing, so it can't be combined with --release." >&2
  exit 1
fi

# --- Preflight ---------------------------------------------------------------------------

if [ ! -f Generator/Package.swift ]; then
  echo "The Generator submodule is empty. Run: git submodule update --init" >&2
  exit 1
fi

if [ -n "$xcode" ]; then
  export DEVELOPER_DIR="$xcode/Contents/Developer"
fi

if ! xcrun --find simctl >/dev/null 2>&1; then
  echo "No Xcode is selected. Use --xcode <path>, or: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi

echo "Xcode: $(xcodebuild -version | head -1)  ($(xcode-select -p))"
echo

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
incomplete_marker="Multi-screen device(s) found without per-screen data"

# The summary of the last real run is kept in the repository, overwritten each time, so it sits
# beside the data it describes. It lives at the root, outside every package target, so it is
# never part of what the library ships.
scan_report="LastDeviceScan.md"

# --- Check only --------------------------------------------------------------------------

if $check; then
  (cd Generator && swift run --quiet BezelGenerator scan --verify none --summary "$tmp/summary.md") | tee "$tmp/scan.log"
  echo

  if grep -q "$incomplete_marker" "$tmp/scan.log"; then
    echo "A multi-screen device is missing per-screen data. See MAINTAINING.md." >&2
    exit 2
  fi

  if grep -q "the database matches Xcode's device catalog" "$tmp/summary.md"; then
    echo "Up to date."
    exit 0
  fi

  echo "Device data is out of date. Run ./update-devices.sh to apply it."
  exit 1
fi

# --- Scan and apply ----------------------------------------------------------------------

(cd Generator && swift run --quiet BezelGenerator scan --apply --verify "$verify" --summary "$tmp/summary.md") | tee "$tmp/scan.log"
echo
(cd Generator && swift run --quiet BezelGenerator generate-docs)
echo

{
  echo "<!-- Written by update-devices.sh and overwritten on every run. -->"
  echo
  echo "# Last device scan"
  echo
  echo "Run on $(date -u '+%Y-%m-%d %H:%M UTC') with $(xcodebuild -version | head -1) ($(xcodebuild -version | tail -1 | sed 's/Build version //')), verify mode \`$verify\`."
  echo
  cat "$tmp/summary.md"
} > "$scan_report"

needs_measuring=false
if grep -q "$incomplete_marker" "$tmp/scan.log"; then
  needs_measuring=true
fi

# --- Show what changed -------------------------------------------------------------------

package_changes=$(git status --porcelain -- Sources/BezelKit/Resources/bezel.min.json SupportedDeviceList.md "$scan_report")
generator_changes=$(git -C Generator status --porcelain -- apple-device-database.json)

if [ -z "$package_changes" ] && [ -z "$generator_changes" ]; then
  echo "Nothing changed — the device data is already up to date."
  $needs_measuring && exit 2
  exit 0
fi

echo "Changed:"
[ -n "$generator_changes" ] && git -C Generator --no-pager diff --stat -- apple-device-database.json
[ -n "$package_changes" ] && git status --short -- Sources/BezelKit/Resources/bezel.min.json SupportedDeviceList.md "$scan_report"
echo

if $needs_measuring; then
  echo "⚠️  A multi-screen device was found without per-screen data, so its corners are only a"
  echo "    single number. Measure it and add a 'screens' entry first (see MAINTAINING.md)."
  echo
fi

# --- Release or hand over ----------------------------------------------------------------

if $release; then
  if $needs_measuring && ! $force; then
    echo "Not releasing: that device's data would ship incomplete. Fix it, or pass --force." >&2
    exit 2
  fi
  (cd Generator && swift run --quiet BezelGenerator generate-docs --release)
  exit 0
fi

echo "Review the changes, then ship them with:  ./update-devices.sh --release"
$needs_measuring && exit 2
exit 0
