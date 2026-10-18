# Maintaining BezelKit

How to keep the device data up to date. This is the maintainer's runbook — for how the tooling works internally, see the [Generator README](https://github.com/markbattistella/BezelKit-Generator/).

Device data is updated locally, when Apple releases new hardware, with one command: `./update-devices.sh`. There is no scheduled job: GitHub's runner images lag behind new Xcode releases, so a hosted scan can miss new devices for weeks.

## Quick reference

| Situation | What to do |
| --------- | ---------- |
| A new iPhone or iPad just launched | [Run it locally the same day](#a-new-device-just-launched) |
| You want to check right now | [Run a scan](#running-a-scan) |
| A device says "needs a simulator boot" | [Confirm it](#when-a-device-needs-checking) |
| Wondering when a version gets tagged | [Releases and tags](#releases-and-tags) |
| Something's broken | [Troubleshooting](#troubleshooting) |

All local commands run from the `Generator/` directory unless stated otherwise.

## One-time setup

You only need this once per machine.

```bash
brew install gh && gh auth login
```

The GitHub CLI is used by the release step to publish the GitHub release.

## A new device just launched

1. Install the new Xcode (beta or RC is fine) alongside your existing one — don't replace it.

2. From the repository root:

    ```bash
    ./update-devices.sh --xcode /Applications/Xcode-27.0.0-RC.app
    ```

    This scans the new Xcode's device catalog, boots simulators only for devices that can't be confirmed from it, regenerates `bezel.min.json` and `SupportedDeviceList.md`, and shows you what changed. Drop `--xcode` to use the Xcode you already have selected.

3. Check the diff, then ship it:

    ```bash
    ./update-devices.sh --release
    ```

    The release step commits both repositories in the right order, pushes, tags the package `yy.m.d`, and publishes a GitHub release listing the new devices.

| Command | What it does |
| ------- | ------------ |
| `./update-devices.sh` | Scan, apply, regenerate docs, show what changed |
| `./update-devices.sh --release` | The same, then commit, push, tag and publish |
| `./update-devices.sh --check` | Report only. Changes nothing; exits `1` if the data is out of date |
| `--xcode <path>` | Use a specific Xcode instead of the selected one |
| `--verify none\|flagged\|unverified` | How much to confirm by booting simulators (default `flagged`) |

Each real run writes its summary to [`LastDeviceScan.md`](LastDeviceScan.md) at the repository root, overwriting the last one, so what the scan found sits next to the data it changed and is committed with it. It's outside every package target, so it never ships with the library. `--check` doesn't write it.

Exit codes: `0` up to date or done, `1` changes found (with `--check`) or a step failed, `2` a device needs measuring by hand. `--release` refuses to publish in that last case unless you add `--force`.

`--check` is safe to run on a schedule, for example weekly from `launchd` or a self-hosted runner on this Mac, to find out a new device exists without applying anything. It can't run on GitHub's hosted runners for new hardware, because their images carry an older Xcode for weeks after a release.

You do **not** need a VM, and you do **not** need to add anything to `pending` by hand. Devices are discovered from Xcode automatically.

## Running a scan

```bash
cd Generator

# Just tell me what's out there — seconds, no simulators
swift run BezelGenerator scan --verify none

# Apply changes, booting only what's uncertain
swift run BezelGenerator scan --apply

# Apply, and confirm everything not yet simulator-verified
swift run BezelGenerator scan --apply --verify unverified
```

Nothing is written without `--apply`.

## Multi-screen and uneven-corner devices

Foldables, and any phone whose corners aren't all the same, need more than one radius. You don't do anything special for them: a scan reads each built-in screen's size and four corner radii from the `displays` list in Xcode's device profile and records them as `screens`. It works out which devices need it on its own. A device does when it has more than one built-in screen, or a screen with uneven corners. Everything else stays a single number.

```bash
cd Generator
swift run BezelGenerator scan --apply
```

The scan output lists them under **Per-screen corners**, and `generate-docs` adds them to a **Multi-screen devices** table in `SupportedDeviceList.md`.

- Corners are the physical corners with the device held upright. BezelKit matches the active screen by `nativeSize` (`UIScreen.nativeBounds`, in pixels) and rotates the corners to match the interface orientation, so none of this depends on how the simulator is posed or folded.
- The screens are numbered in Xcode's order (`Screen 1`, `Screen 2`). Rename one in `apple-device-database.json` (for example to `Outer`) and later scans keep your name while refreshing the numbers.
- The top level `bezel` is still the single number the scan reads, and is what older versions of the package use.
- Xcode's profile is treated as authoritative. On iPhone Duo it matches what was measured on a running simulator, with the outer screen at 8 / 59 / 8 / 59 and the inner at 55.

If Xcode lists several built-in screens for a device but not enough data to read each one's corners, the scan can't record them, and it says so rather than passing quietly: the terminal shows **Multi-screen device(s) found without per-screen data**, the summary gets a warning table, `update-devices.sh` exits with `2`, and `--release` refuses to publish. Only the single radius is recorded until you fix it. Measure it with a full-window `UIView` set to `cornerConfiguration = .corners(radius: .containerConcentric())` on each screen and orientation, read `effectiveRadius(corner:)` for all four corners, and add a `screens` entry to the database by hand. A window that doesn't fill the screen reports its own rounder corners, so use a full-bleed one.

## Understanding the output

A scan sorts every device into one of these:

| Result | Meaning | Action |
| ------ | ------- | ------ |
| **Unchanged** | Matches what's already stored | None |
| **Verified by simulator** | Booted and measured. Ground truth | None |
| **Accepted from Xcode catalog** | Trusted without booting, because the value is either fractional or matches an already-verified device of the same chassis | None — it gets confirmed automatically on a later run |
| **Settled** | Xcode's catalog disagrees with the stored value, but a boot already settled it in the stored value's favour | None. Ignore it — it won't be re-checked |
| **Awaiting verification** | Can't be trusted without a boot. **Not written** | [See below](#when-a-device-needs-checking) |
| **Legacy** | In the database but no longer shipped by Xcode | None. Historical entries, never touched |
| **Name corrections** | Xcode's name differs from the stored one | None — applied automatically, Xcode is authoritative |

## When a device needs checking

A device gets flagged when its corner radius is a whole number *and* either no verified device shares its chassis design, or one does and disagrees. That usually means a brand-new chassis, and it happens once or twice a year.

Nothing is written for a flagged device until it's confirmed, so there's no risk of bad data landing. To confirm it, run a scan on a machine that has a simulator runtime for it:

```bash
cd Generator
swift run BezelGenerator scan --apply --verify flagged
```

To check one device in isolation without touching the database:

```bash
swift run BezelGenerator test --name "iPhone 18 Pro"
```

If no runtime exists yet, install one via **Xcode → Settings → Components**, or leave it and scan again once it's available.

## Releases and tags

For Swift Package Manager the tag **is** the release — a commit on `main` with no tag reaches nobody depending on a version rule. So tagging isn't optional bookkeeping; it's how the data ships.

`generate-docs --release` tags and publishes for you. As a safety net, the [`Auto tag`](.github/workflows/auto-tag.yml) workflow also fires when `bezel.min.json` changes on `main` and tags it if the commit isn't already tagged, so the two never collide. Changes to the generator, workflows or documentation are deliberately **not** tagged — there's nothing in them for a consumer to consume.

Release notes are generated by diffing the resource, split into added devices and updated ones (bezel corrections and renames).

### Version format

CalVer, `yy.m.d`, **never zero-padded**:

```text
26.9.10     correct
26.09.10    invalid — semver rejects leading zeroes, SwiftPM ignores the tag
```

If two releases land on the same day the day component doubles as a counter, so a second release on the 10th becomes `26.9.11`. Versions stay valid and strictly increasing, which is all SwiftPM needs.

> [!NOTE]
> With CalVer, the year is the major version, so `from: "26.0.0"` in a consumer's manifest stops resolving once tags reach `27.x`. Each January the README's install snippet needs bumping to the new year, and consumers have to update their manifests to keep receiving device data.

## Command reference

| Command | What it does |
| ------- | ------------ |
| `scan --verify none` | Report what Xcode knows. No boots, no writes |
| `scan --apply` | Apply changes, booting only uncertain devices |
| `scan --apply --verify unverified` | Apply, confirming everything not yet simulator-verified |
| `test --name "<device>"` | Check one device without touching the database |
| `generate-docs` | Rebuild `SupportedDeviceList.md` |
| `generate-docs --release` | Commit both repos, push, tag, publish a GitHub release |

## Troubleshooting

**"No `.simdevicetype` bundles found"**
No Xcode is selected, or the selected one is incomplete. Check with `xcode-select -p` and fix with `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, or set `DEVELOPER_DIR` for a side-by-side install.

**A new device doesn't appear at all**
Your Xcode is too old to know about it. Install the newest Xcode and point `DEVELOPER_DIR` at it.

**A device fails with "App installation failed"**
The device is too old to run the helper app — `iPad6,7` and `iPad6,8` do this. It stays catalog-derived and gets retried on each scan. Harmless.

**The same devices get flagged on every scan**
They shouldn't — a confirmed device records the catalog value it was checked against and won't be re-opened. If it keeps happening, the boot isn't being recorded; check that the scan ran with `--apply`.
