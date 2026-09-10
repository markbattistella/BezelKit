# Maintaining BezelKit

How to keep the device data up to date. This is the maintainer's runbook — for how the tooling works internally, see the [Generator README](https://github.com/markbattistella/BezelKit-Generator/).

Most of the time you do nothing: a scheduled job checks for new devices on the 1st of each month and opens pull requests if anything changed.

## Quick reference

| Situation | What to do |
| --------- | ---------- |
| It's a normal month | Nothing. Wait for the CI pull requests |
| CI opened pull requests | [Merge them, generator first](#when-ci-opens-pull-requests) |
| A new iPhone or iPad just launched | [Run it locally the same day](#a-new-device-just-launched) |
| You want to check right now | [Trigger a scan by hand](#running-a-scan-by-hand) |
| A device says "needs a simulator boot" | [Confirm it](#when-a-device-needs-checking) |
| Wondering when a version gets tagged | [Releases and tags](#releases-and-tags) |
| Something's broken | [Troubleshooting](#troubleshooting) |

All local commands run from the `Generator/` directory unless stated otherwise.

## One-time setup

You only need this once per machine.

1. Install the GitHub CLI, used by the release step:

    ```bash
    brew install gh && gh auth login
    ```

2. Let the bot open pull requests.

    Device data lives in the `BezelKit-Generator` submodule while the package resource lives in this repo, so:

    - Install the app on **both** `BezelKit` and `BezelKit-Generator`, with read and write access to contents and pull requests.
    - Add `BOT_APP_CLIENT_ID` and `BOT_APP_PRIVATE_KEY` under **Settings → Secrets and variables → Actions** in the `BezelKit` repo — the same values the website repo uses.

    Pull requests then arrive authored by the bot rather than `github-actions`.

    Without those secrets the scan still runs and uploads its results as a downloadable artifact — it just can't open the pull requests for you.

## The monthly run

The [`Device scan`](.github/workflows/device-scan.yml) workflow runs at 06:00 UTC on the 1st of each month. It reads the device catalog from the newest Xcode on the runner, boots simulators to confirm anything not yet verified, and opens pull requests only if something actually changed.

It costs nothing — public repositories get unlimited standard runner minutes.

### When CI opens pull requests

You'll get two, one per repository. The summary on the Actions run tells you what changed.

1. Review and merge the **`BezelKit-Generator`** pull request first. It contains the device database.

    > [!IMPORTANT]
    > Use **Create a merge commit**, not squash. The BezelKit pull request points at that branch's exact commit; squashing creates a different commit and breaks the submodule pointer.

2. Review and merge the **`BezelKit`** pull request. It contains `bezel.min.json`, `SupportedDeviceList.md`, and the bumped submodule pointer.

3. Optionally cut a release:

    ```bash
    cd Generator
    git pull && swift run BezelGenerator generate-docs --release
    ```

If you squashed by accident, repoint the submodule on the BezelKit branch before merging it:

```bash
git submodule update --remote Generator
git add Generator && git commit --amend --no-edit && git push --force-with-lease
```

### When nothing appears

No pull requests means no new devices and no changes. Nothing to do.

## A new device just launched

CI won't see brand-new hardware until GitHub's runner images pick up the matching Xcode, which can take weeks. On launch day, run it yourself.

1. Install the new Xcode (beta or RC is fine) alongside your existing one — don't replace it.

2. Point the tools at it and scan:

    ```bash
    cd Generator
    export DEVELOPER_DIR=/Applications/Xcode-27.0.0-RC.app/Contents/Developer

    swift run BezelGenerator scan --verify none
    ```

    This takes seconds and boots nothing. It just shows you what the new Xcode knows about.

3. Apply it. This boots simulators only for devices that can't be confirmed from the catalog alone:

    ```bash
    swift run BezelGenerator scan --apply
    ```

4. Check the diff, then ship it:

    ```bash
    git -C . diff apple-device-database.json
    swift run BezelGenerator generate-docs --release
    ```

    The release step commits both repositories in the right order, pushes, tags the package `yy.m.d`, and publishes a GitHub release listing the new devices.

You do **not** need a VM, and you do **not** need to add anything to `pending` by hand. Devices are discovered from Xcode automatically.

## Running a scan by hand

### From GitHub

Go to **Actions → Device scan → Run workflow**. Two options:

| Input | Use |
| ----- | --- |
| `verify` | `unverified` confirms everything not yet simulator-checked (default). `flagged` only checks what's uncertain. `none` reports without booting anything |
| `dry_run` | Tick to see results without opening pull requests |

### Locally

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

If no runtime exists yet, install one via **Xcode → Settings → Components**, or leave it — the next monthly run will pick it up.

## Releases and tags

For Swift Package Manager the tag **is** the release — a commit on `main` with no tag reaches nobody depending on a version rule. So tagging isn't optional bookkeeping; it's how the data ships.

This is automatic. The [`Auto tag`](.github/workflows/auto-tag.yml) workflow fires when `bezel.min.json` changes on `main`, which means a merged device scan pull request tags and releases itself. Changes to the generator, workflows or documentation are deliberately **not** tagged — there's nothing in them for a consumer to consume.

Release notes are generated by diffing the resource, split into added devices and updated ones (bezel corrections and renames).

### Version format

CalVer, `yy.m.d`, **never zero-padded**:

```text
26.9.10     correct
26.09.10    invalid — semver rejects leading zeroes, SwiftPM ignores the tag
```

If two releases land on the same day the day component doubles as a counter, so a second release on the 10th becomes `26.9.11`. Versions stay valid and strictly increasing, which is all SwiftPM needs.

### Releasing by hand

`generate-docs --release` still works and still tags. The auto-tag workflow skips any commit that already carries a tag, so the two never collide — use whichever suits.

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

Tagging otherwise happens on its own — see [Releases and tags](#releases-and-tags).

## Troubleshooting

**"No `.simdevicetype` bundles found"**
No Xcode is selected, or the selected one is incomplete. Check with `xcode-select -p` and fix with `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, or set `DEVELOPER_DIR` for a side-by-side install.

**A new device doesn't appear at all**
Your Xcode is too old to know about it. Install the newest Xcode and point `DEVELOPER_DIR` at it.

**CI found changes but opened no pull requests**
The `BOT_APP_CLIENT_ID` / `BOT_APP_PRIVATE_KEY` secrets are missing, or the app isn't installed on both repositories. Download the `device-scan-results` artifact from the run to apply the changes by hand, then fix the setup.

**CI fails at "Create GitHub App token"**
The app isn't installed on one of the two repositories, or its installation lacks write access to contents and pull requests. Both `BezelKit` and `BezelKit-Generator` must be covered.

**A device fails with "App installation failed"**
The device is too old to run the helper app — `iPad6,7` and `iPad6,8` do this. It stays catalog-derived and gets retried each month. Harmless.

**The same devices get flagged every single month**
They shouldn't — a confirmed device records the catalog value it was checked against and won't be re-opened. If it keeps happening, the boot isn't being recorded; check that the scan ran with `--apply`.

**The submodule pointer is broken after a merge**
The generator pull request was squashed. See [When CI opens pull requests](#when-ci-opens-pull-requests).
