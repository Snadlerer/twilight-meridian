# Twilight Meridian

A Cold War **staff-atlas** strategy game. Two poles — the **Atlantic Compact** and the **Continental Directorate** — contest satellites, neutrals, and one rogue client. Strip the last satellite, or break the homeland’s morale, stability, or shops, and the era is yours. Do not let your own core fail.

Play in the browser from this project, or take a desk copy:

## Desk copies — download library

| You have | Download |
| --- | --- |
| **Windows 10/11, 64-bit Intel/AMD** | [TwilightMeridian-Windows-x64.zip](https://github.com/Snadlerer/twilight-meridian/releases/download/v1.0.0/TwilightMeridian-Windows-x64.zip) |
| **macOS Apple Silicon** (M1 / M2 / M3 / M4) | [TwilightMeridian-macOS-AppleSilicon.tar.gz](https://github.com/Snadlerer/twilight-meridian/releases/download/v1.0.0/TwilightMeridian-macOS-AppleSilicon.tar.gz) |
| **macOS Intel** | [TwilightMeridian-macOS-Intel.tar.gz](https://github.com/Snadlerer/twilight-meridian/releases/download/v1.0.0/TwilightMeridian-macOS-Intel.tar.gz) |

Full notes and checksums live on the **[v1.0.0 release](https://github.com/Snadlerer/twilight-meridian/releases/tag/v1.0.0)**.

### Windows
Unzip. Keep the whole `Twilight Meridian` folder together. Double-click `Twilight Meridian.exe`. If SmartScreen appears: **More info → Run anyway**.

### macOS
Extract the archive. **Right-click** `Twilight Meridian.app` → **Open**. The copy is unsigned, so Gatekeeper asks once.

Saves stay on that machine.

## System requirements

| | Windows | macOS |
| --- | --- | --- |
| OS | Windows 10 or 11, 64-bit | macOS 11 Big Sur or later (12 Monterey+ recommended) |
| Chip | Intel / AMD 64-bit. Not ARM, not 32-bit | Apple Silicon *or* Intel (pick the matching archive) |
| RAM | 4 GB min, 8 GB comfortable | same |
| Display | 1024×680 min; 1440×900 intended | same |
| Network | None — plays offline | None |

Installed size is about 310 MB on Windows and 450–470 MB on Mac.

## How the room works

- **Cores** are large homelands. If morale, stability, or economy drop through the floor, that pole collapses.
- **Satellites** are binary clients. Lose the last one and the bloc is hollow.
- **Neutrals** lean. Sympathy moves; they are not flags you paint overnight.
- One satellite is a **rogue** — more subject to the other side.
- Every pressure has a counter: Broadcast ↔ Blackout, Diktat ↔ Defy, Clandestine ↔ Counter-intel, Arms ↔ Embargo.

## Project

Game source lives under `src/game` and `src/components/game`. The desk shell is `desktop/`.
