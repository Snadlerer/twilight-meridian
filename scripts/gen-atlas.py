#!/usr/bin/env python3
"""Staff-atlas polygons: lon/lat Europe, projected to 1600×900."""
from __future__ import annotations

MAP_W, MAP_H = 1600, 900
LON0, LON1 = -11.6, 43.4
LAT0, LAT1 = 34.2, 71.4


def xy(lon: float, lat: float) -> tuple[float, float]:
    x = (lon - LON0) / (LON1 - LON0) * MAP_W
    y = (LAT1 - lat) / (LAT1 - LAT0) * MAP_H
    return round(x, 1), round(y, 1)


def ring(pts: list[tuple[float, float]]) -> list[list[float]]:
    out = [list(xy(lon, lat)) for lon, lat in pts]
    if out[0] != out[-1]:
        out.append(out[0][:])
    return out


def centroid(rings: list[list[list[float]]]) -> tuple[float, float]:
    pts = rings[0]
    n = max(1, len(pts) - 1)
    sx = sum(p[0] for p in pts[:-1])
    sy = sum(p[1] for p in pts[:-1])
    return round(sx / n, 1), round(sy / n, 1)


def area(rings: list[list[list[float]]]) -> int:
    a = 0.0
    for r in rings:
        s = 0.0
        for i in range(len(r) - 1):
            s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
        a += abs(s) / 2
    return int(a)


# --- coasts (lon, lat), clockwise-enough, simplified but recognisable ---

BRITAIN = [
    (-5.0, 50.0), (-3.6, 50.2), (-2.0, 50.5), (-1.2, 50.6), (1.4, 51.1),
    (1.5, 51.5), (0.4, 51.5), (0.9, 52.6), (0.4, 52.9), (0.2, 53.4),
    (-0.2, 53.7), (0.1, 54.1), (-0.9, 54.6), (-1.4, 54.7), (-1.2, 55.0),
    (-1.6, 55.8), (-2.1, 56.0), (-2.7, 56.2), (-2.4, 56.9), (-3.3, 57.6),
    (-4.0, 57.7), (-2.7, 57.7), (-1.8, 57.6), (-3.1, 58.6), (-4.6, 57.6),
    (-5.6, 57.5), (-5.7, 56.7), (-5.6, 55.9), (-4.9, 55.3), (-4.8, 54.8),
    (-3.5, 54.6), (-3.4, 54.1), (-4.7, 53.4), (-4.3, 52.4), (-4.1, 51.7),
    (-5.0, 51.6), (-5.6, 50.4), (-5.0, 50.0),
]
IRELAND = [
    (-10.4, 51.5), (-9.6, 51.4), (-8.4, 51.7), (-6.4, 52.1), (-6.0, 52.6),
    (-6.0, 53.3), (-6.2, 54.1), (-7.3, 55.3), (-8.2, 54.8), (-8.6, 54.2),
    (-10.1, 54.5), (-10.2, 53.4), (-9.7, 52.3), (-10.4, 51.5),
]
FRANCE = [
    (-1.8, 48.6), (-2.6, 48.6), (-4.6, 48.4), (-4.8, 47.8), (-3.4, 47.5),
    (-2.2, 47.2), (-1.6, 46.5), (-1.2, 45.5), (-1.5, 44.6), (-1.2, 43.4),
    (1.4, 43.4), (3.0, 42.6), (3.5, 43.4), (4.8, 43.4), (6.6, 43.2),
    (7.4, 43.7), (6.8, 44.6), (6.0, 45.1), (5.9, 46.2), (6.8, 47.4),
    (7.6, 47.6), (8.2, 48.9), (7.6, 49.1), (6.4, 49.2), (4.8, 49.9),
    (2.6, 51.1), (2.0, 51.0), (1.6, 50.8), (1.8, 50.0), (1.4, 49.4),
    (0.2, 49.4), (-0.4, 49.3), (-1.2, 49.7), (-1.8, 48.6),
]
CORSICA = [
    (8.6, 42.7), (9.4, 42.3), (9.5, 41.6), (8.8, 41.4), (8.6, 42.0), (8.6, 42.7),
]
IBERIA_SPAIN = [
    (-8.0, 43.7), (-6.8, 43.6), (-5.6, 43.5), (-3.8, 43.4), (-1.8, 43.3),
    (-0.5, 42.8), (0.4, 42.4), (1.8, 42.3), (3.2, 41.8), (3.2, 40.6),
    (0.8, 39.9), (0.1, 38.8), (-0.3, 37.6), (-1.3, 37.0), (-2.1, 36.7),
    (-4.8, 36.5), (-5.4, 36.1), (-5.6, 36.0), (-6.0, 36.2), (-5.8, 36.7),
    (-6.4, 37.0), (-6.9, 37.2), (-7.4, 37.2), (-7.1, 38.0), (-6.9, 39.3),
    (-7.0, 40.0), (-6.8, 41.2), (-7.0, 41.9), (-8.0, 42.1), (-8.5, 42.8),
    (-8.4, 43.3), (-8.0, 43.7),
]
PORTUGAL = [
    (-8.9, 42.1), (-8.2, 42.0), (-7.0, 41.9), (-6.8, 41.2), (-7.0, 40.0),
    (-6.9, 39.3), (-7.1, 38.0), (-7.4, 37.2), (-7.9, 37.1), (-8.9, 37.1),
    (-9.0, 38.4), (-9.4, 38.7), (-9.5, 39.4), (-9.2, 40.2), (-8.8, 41.1),
    (-8.9, 42.1),
]
ITALY = [
    (7.5, 43.9), (8.2, 44.1), (8.8, 44.4), (9.5, 45.2), (10.6, 45.5),
    (12.3, 45.5), (13.5, 45.6), (13.8, 43.8), (14.0, 42.6), (14.5, 41.3),
    (15.9, 41.6), (17.2, 40.9), (18.4, 40.3), (17.4, 39.8), (16.5, 39.5),
    (16.1, 38.9), (16.6, 38.2), (17.1, 38.9), (16.5, 39.4), (15.6, 38.1),
    (16.1, 37.9), (15.6, 37.5), (14.8, 38.1), (15.2, 39.6), (14.0, 40.8),
    (12.6, 41.5), (11.6, 42.3), (10.5, 42.9), (9.8, 41.6), (8.8, 41.1),
    (8.4, 40.7), (8.3, 39.1), (8.9, 38.9), (9.6, 39.2), (9.6, 37.9),
    (8.4, 37.9), (8.1, 38.9), (8.3, 40.6), (8.2, 41.9), (7.5, 43.9),
]
SICILY = [
    (12.5, 38.2), (13.3, 38.2), (15.1, 38.3), (15.6, 37.1), (14.0, 36.7),
    (12.6, 37.5), (12.5, 38.2),
]
SARDINIA = [
    (8.2, 41.2), (9.6, 40.9), (9.7, 39.2), (8.4, 38.9), (8.2, 40.0), (8.2, 41.2),
]
# Germany + Benelux + Denmark (Jutland)
WESFELD = [
    (3.4, 51.4), (2.6, 51.1), (4.8, 49.9), (6.4, 49.2), (7.6, 49.1),
    (8.2, 48.9), (8.5, 48.0), (10.0, 47.6), (13.0, 47.7), (13.8, 48.6),
    (14.4, 51.0), (14.2, 53.0), (13.6, 54.4), (11.1, 54.4), (10.4, 54.4),
    (9.9, 54.8), (8.6, 56.9), (8.4, 57.1), (9.5, 57.4), (10.6, 57.7),
    (10.6, 56.8), (10.2, 55.4), (11.0, 54.8), (12.0, 54.4), (11.0, 54.0),
    (8.6, 54.0), (8.5, 53.5), (7.0, 53.7), (6.5, 53.4), (4.8, 53.2),
    (4.7, 52.5), (3.4, 51.4),
]
ZEALAND = [
    (11.0, 56.1), (12.6, 56.1), (12.6, 54.9), (11.2, 54.8), (11.0, 56.1),
]
# Norway + Sweden
NORLAND = [
    (5.0, 58.9), (5.6, 59.0), (7.0, 58.0), (8.1, 58.0), (11.4, 58.9),
    (12.8, 56.2), (14.2, 55.4), (16.4, 56.2), (18.6, 57.4), (19.0, 59.8),
    (18.4, 62.5), (21.0, 65.0), (24.0, 65.8), (25.6, 66.5), (24.2, 68.6),
    (21.0, 70.2), (16.5, 69.2), (14.0, 68.0), (12.0, 65.8), (10.0, 64.0),
    (8.0, 63.4), (5.3, 62.5), (5.0, 61.0), (4.6, 59.6), (5.0, 58.9),
]
FINLAND = [
    (21.4, 61.0), (21.6, 62.6), (24.6, 64.8), (25.8, 66.4), (29.0, 69.6),
    (31.6, 70.0), (31.2, 69.0), (30.4, 67.6), (31.4, 66.2), (30.0, 64.0),
    (28.8, 61.6), (27.6, 60.4), (24.4, 60.1), (22.2, 60.4), (21.4, 61.0),
]
POLAND = [
    (14.2, 53.0), (14.4, 51.0), (14.8, 50.0), (16.8, 50.0), (19.0, 49.4),
    (22.6, 49.2), (24.0, 50.4), (23.8, 52.4), (23.4, 54.0), (18.8, 54.8),
    (16.6, 54.6), (14.6, 54.2), (14.2, 53.0),
]
CZECH_AT = [  # Valtara: Czech + Austria + Switzerland
    (6.0, 46.2), (6.8, 45.9), (7.2, 45.8), (8.8, 46.0), (10.5, 46.5),
    (13.0, 46.6), (16.0, 46.8), (17.2, 48.0), (16.9, 48.6), (16.8, 50.0),
    (14.8, 50.0), (14.4, 51.0), (13.8, 48.6), (13.0, 47.7), (10.0, 47.6),
    (8.5, 48.0), (8.2, 48.9), (7.6, 47.6), (6.8, 47.4), (5.9, 46.2), (6.0, 46.2),
]
HUNGARY = [
    (16.0, 46.8), (16.1, 45.8), (18.0, 45.8), (19.6, 46.1), (21.8, 46.2),
    (22.8, 47.6), (22.0, 48.4), (17.2, 48.0), (16.0, 46.8),
]
YUGOSLAVIA = [
    (13.6, 45.5), (13.8, 44.8), (14.8, 44.2), (16.4, 43.4), (18.4, 42.4),
    (19.4, 41.9), (20.4, 42.5), (22.4, 42.3), (22.8, 44.2), (21.6, 45.2),
    (19.6, 46.1), (18.0, 45.8), (16.1, 45.8), (16.0, 46.8), (13.6, 45.6),
    (13.6, 45.5),
]
GREECE = [
    (19.8, 39.7), (20.6, 40.1), (21.8, 40.8), (23.4, 41.1), (26.0, 41.2),
    (26.4, 40.8), (24.6, 40.1), (23.8, 39.5), (23.0, 38.4), (24.1, 38.3),
    (24.4, 37.6), (23.2, 36.4), (22.0, 36.7), (21.6, 37.5), (21.2, 38.2),
    (20.6, 38.8), (19.9, 39.5), (19.8, 39.7),
]
CRETE = [
    (23.6, 35.6), (26.3, 35.5), (26.2, 35.0), (23.6, 35.1), (23.6, 35.6),
]
ROMANIA_BG = [
    (21.6, 45.2), (22.8, 44.2), (22.4, 42.3), (23.0, 41.4), (27.4, 42.4),
    (28.6, 43.4), (29.6, 44.8), (29.7, 46.2), (28.2, 46.9), (26.6, 48.2),
    (24.0, 47.8), (22.8, 47.6), (21.8, 46.2), (21.6, 45.2),
]
UKRAINE = [
    (22.6, 49.2), (24.0, 47.8), (26.6, 48.2), (28.2, 46.9), (29.7, 46.2),
    (31.8, 46.6), (33.5, 46.2), (35.0, 45.3), (36.6, 45.2), (36.6, 47.0),
    (38.0, 48.4), (37.0, 50.4), (34.4, 51.4), (31.8, 52.0), (30.4, 51.5),
    (27.8, 51.6), (24.0, 50.4), (22.6, 49.2),
]
CRIMEA = [
    (32.5, 45.4), (33.8, 45.4), (36.6, 45.3), (36.5, 44.4), (33.8, 44.4),
    (32.5, 45.0), (32.5, 45.4),
]
BELARUS = [
    (23.4, 54.0), (23.8, 52.4), (24.0, 50.4), (27.8, 51.6), (30.4, 51.5),
    (31.8, 52.0), (31.6, 53.6), (30.4, 56.0), (28.0, 56.2), (25.8, 56.0),
    (23.6, 55.0), (23.4, 54.0),
]
BALTICS = [
    (21.0, 56.0), (22.0, 54.4), (23.4, 54.0), (23.6, 55.0), (25.8, 56.0),
    (28.0, 56.2), (28.2, 59.4), (26.4, 59.6), (24.4, 59.4), (21.8, 58.4),
    (21.0, 57.4), (21.0, 56.0),
]
# European Russia (Dunstow) — White Sea to Black-Sea-north, west of Urals-ish
RUSSIA = [
    (28.2, 59.4), (28.0, 56.2), (30.4, 56.0), (31.6, 53.6), (31.8, 52.0),
    (34.4, 51.4), (37.0, 50.4), (38.0, 48.4), (40.2, 48.8), (42.0, 50.2),
    (43.2, 52.6), (43.3, 56.0), (43.3, 60.0), (43.3, 64.0), (43.3, 68.0),
    (43.3, 70.8), (40.0, 70.6), (36.0, 69.4), (32.4, 70.0), (30.0, 69.8),
    (29.0, 69.6), (31.6, 70.0), (31.2, 69.0), (30.4, 67.6), (31.4, 66.2),
    (30.0, 64.0), (28.8, 61.6), (27.8, 60.0), (28.2, 59.4),
]
# Don / Kuban sat (Yaltai)
YALTAI = [
    (36.6, 47.0), (36.6, 45.2), (38.0, 44.6), (39.6, 44.0), (40.2, 45.4),
    (41.2, 46.6), (40.2, 48.8), (38.0, 48.4), (36.6, 47.0),
]
# Volga south / Caspian approach (Obren)
OBREN = [
    (42.0, 50.2), (40.2, 48.8), (41.2, 46.6), (43.2, 45.2), (43.3, 48.0),
    (43.3, 52.6), (42.0, 50.2),
]
ANATOLIA = [
    (26.4, 40.8), (27.4, 40.4), (29.0, 41.2), (32.0, 41.6), (35.0, 42.0),
    (38.0, 41.0), (41.2, 41.4), (43.2, 41.2), (43.3, 39.0), (42.0, 37.2),
    (36.2, 36.2), (32.4, 36.2), (30.6, 36.6), (28.2, 36.8), (27.2, 37.8),
    (27.4, 38.6), (26.3, 38.2), (26.1, 39.6), (26.4, 40.8),
]
CAUCASUS = [
    (40.2, 45.4), (39.6, 44.0), (40.0, 43.0), (40.2, 41.6), (41.2, 41.4),
    (43.2, 41.2), (43.3, 42.8), (43.3, 45.2), (41.2, 46.6), (40.2, 45.4),
]
MAGHREB = [
    (-9.6, 35.8), (-8.0, 35.8), (-5.8, 35.9), (-2.2, 35.3), (1.2, 36.7),
    (3.9, 36.9), (6.4, 37.0), (9.2, 37.2), (10.3, 36.8), (10.8, 35.8),
    (11.0, 34.6), (8.0, 34.45), (4.0, 34.45), (0.0, 34.45), (-4.0, 34.5),
    (-7.2, 34.7), (-9.8, 35.4), (-9.6, 35.8),
]

NATIONS = [
    dict(id=1, name="Merholm", adjective="Merholmer", capital="Port Meridian", gov="federation",
         role="compact_core", lean=100, rings=[BRITAIN]),
    dict(id=2, name="Norland", adjective="Norlandic", capital="Hvalstad", gov="kingdom",
         role="compact_sat", lean=78, rings=[NORLAND, FINLAND]),
    dict(id=3, name="Wesfeld", adjective="Wesfeldian", capital="Rothaven", gov="republic",
         role="compact_sat", lean=62, rogue=True, rings=[WESFELD, ZEALAND]),
    dict(id=4, name="Calverry", adjective="Calverrian", capital="Port Calver", gov="republic",
         role="compact_sat", lean=74, rings=[FRANCE, CORSICA]),
    dict(id=5, name="Dunreach", adjective="Dunreacher", capital="Greyhook", gov="mandate",
         role="compact_sat", lean=70, rings=[IRELAND]),
    dict(id=6, name="Ostmarch", adjective="Ostmarcher", capital="Linde", gov="kingdom",
         role="compact_sat", lean=68, rings=[PORTUGAL]),
    dict(id=7, name="Valtara", adjective="Valtaran", capital="Sora", gov="assembly",
         role="neutral", lean=14, rings=[CZECH_AT]),
    dict(id=8, name="Iberholt", adjective="Iberholtish", capital="Calla", gov="republic",
         role="neutral", lean=-10, rings=[IBERIA_SPAIN]),
    dict(id=9, name="Karsino", adjective="Karsinese", capital="Vena", gov="federation",
         role="neutral", lean=8, rings=[HUNGARY]),
    dict(id=10, name="Thalassa", adjective="Thalassan", capital="Mira", gov="mandate",
         role="neutral", lean=2, rings=[ITALY, SICILY, SARDINIA]),
    dict(id=11, name="Ruvina", adjective="Ruvine", capital="Tesa", gov="kingdom",
         role="neutral", lean=-16, rings=[YUGOSLAVIA]),
    dict(id=12, name="Selen", adjective="Selene", capital="Porto Selen", gov="republic",
         role="neutral", lean=20, rings=[POLAND]),
    dict(id=13, name="Marak", adjective="Maraki", capital="Daru", gov="junta",
         role="neutral", lean=-6, rings=[GREECE, CRETE]),
    dict(id=14, name="Aegea", adjective="Aegean", capital="Nymos", gov="assembly",
         role="neutral", lean=6, rings=[MAGHREB]),
    dict(id=15, name="Dunstow", adjective="Dunstovian", capital="Novy Dunst", gov="party-state",
         role="directorate_core", lean=-100, rings=[RUSSIA]),
    dict(id=16, name="Belyov", adjective="Belyovi", capital="Krasnograd", gov="party-state",
         role="directorate_sat", lean=-76, rings=[BELARUS]),
    dict(id=17, name="Tarshek", adjective="Tarsheki", capital="Orda", gov="junta",
         role="directorate_sat", lean=-64, rings=[UKRAINE, CRIMEA]),
    dict(id=18, name="Volna", adjective="Volnese", capital="Riga-on-Volna", gov="assembly",
         role="directorate_sat", lean=-70, rings=[BALTICS]),
    dict(id=19, name="Khast", adjective="Khasti", capital="Peln", gov="party-state",
         role="directorate_sat", lean=-80, rings=[ROMANIA_BG]),
    dict(id=20, name="Obren", adjective="Obreni", capital="St. Obren", gov="mandate",
         role="directorate_sat", lean=-72, rings=[OBREN]),
    dict(id=21, name="Yaltai", adjective="Yaltaic", capital="Kem", gov="junta",
         role="directorate_sat", lean=-58, rings=[YALTAI]),
    dict(id=22, name="Svirsk", adjective="Svirskan", capital="Svirsk", gov="party-state",
         role="directorate_sat", lean=-74, rings=[ANATOLIA, CAUCASUS]),
]

SEA_LINKS = {
    1: [2, 3, 4, 5],
    2: [1, 3, 18, 15],
    3: [1, 2, 4, 7, 12],
    4: [1, 3, 7, 8, 10],
    5: [1],
    6: [8, 14],
    7: [3, 4, 9, 10, 11, 12],
    8: [4, 6, 14],
    9: [7, 11, 12, 19],
    10: [4, 7, 11, 14],
    11: [7, 9, 10, 13, 19],
    12: [3, 7, 9, 16, 17, 18],
    13: [11, 14, 19, 22],
    14: [6, 8, 10, 13],
    15: [2, 16, 17, 18, 20, 21],
    16: [12, 15, 17, 18],
    17: [12, 15, 16, 19, 21],
    18: [2, 12, 15, 16],
    19: [9, 11, 13, 17, 22],
    20: [15, 21, 22],
    21: [15, 17, 20, 22],
    22: [13, 19, 20, 21],
}


def near(a, b, d=38.0) -> bool:
    d2 = d * d
    for ra in a:
        for pa in ra:
            for rb in b:
                for pb in rb:
                    dx = pa[0] - pb[0]
                    dy = pa[1] - pb[1]
                    if dx * dx + dy * dy <= d2:
                        return True
    return False


def build():
    packed = []
    for n in NATIONS:
        rings = [ring(r) for r in n["rings"]]
        cx, cy = centroid(rings)
        packed.append({**n, "polygons": rings, "cx": cx, "cy": cy, "area": area(rings)})

    for i, a in enumerate(packed):
        nbrs = set(SEA_LINKS.get(a["id"], []))
        for j, b in enumerate(packed):
            if i == j:
                continue
            if near(a["polygons"], b["polygons"], 40):
                nbrs.add(b["id"])
        a["neighbors"] = nbrs
    for a in packed:
        for nid in list(a["neighbors"]):
            other = next(x for x in packed if x["id"] == nid)
            other["neighbors"].add(a["id"])
    for a in packed:
        a["neighbors"] = sorted(a["neighbors"])

    rivers_ll = [
        # Rhine
        [(7.6, 47.6), (7.6, 49.1), (6.8, 51.0), (6.0, 51.8), (4.2, 51.9)],
        # Danube
        [(8.2, 48.1), (13.0, 48.3), (16.4, 48.2), (19.0, 47.8), (20.5, 45.8), (26.0, 45.2), (29.0, 45.3)],
        # Seine
        [(4.8, 49.4), (2.3, 48.9), (0.1, 49.4)],
        # Dnieper
        [(30.4, 51.5), (31.5, 49.0), (32.8, 47.2), (33.4, 46.5)],
        # Po
        [(7.6, 45.1), (10.5, 45.1), (12.3, 44.9)],
        # Tagus
        [(-5.8, 40.0), (-8.0, 39.2), (-9.1, 38.7)],
        # Vistula
        [(19.0, 49.6), (20.0, 51.8), (18.8, 54.4)],
        # Thames
        [(-0.6, 51.5), (0.6, 51.45)],
        # Loire
        [(4.0, 47.2), (0.5, 47.3), (-2.1, 47.2)],
        # Volga (west of map edge)
        [(38.0, 56.0), (40.0, 54.0), (43.0, 51.5), (43.2, 48.5)],
    ]
    rivers = [[list(xy(lon, lat)) for lon, lat in r] for r in rivers_ll]

    def fmt_ring(r):
        return "[" + ",".join(f"[{p[0]},{p[1]}]" for p in r) + "]"

    lines = [
        'import type { Gov } from "./types";',
        "export const MAP_W = 1600;",
        "export const MAP_H = 900;",
        'export type AtlasRole = "compact_core" | "directorate_core" | "compact_sat" | "directorate_sat" | "neutral";',
        "export interface AtlasNation {",
        "  id: number; name: string; adjective: string; capital: string; gov: Gov; role: AtlasRole;",
        "  lean: number; cx: number; cy: number; area: number; neighbors: number[]; polygons: number[][][];",
        "  rogueCandidate?: boolean;",
        "}",
        "export const ATLAS: AtlasNation[] = [",
    ]
    for n in packed:
        polys = "[" + ",".join(fmt_ring(r) for r in n["polygons"]) + "]"
        rogue = ", rogueCandidate: true" if n.get("rogue") else ""
        lines.append(
            "  { "
            + f'id: {n["id"]}, name: "{n["name"]}", adjective: "{n["adjective"]}", capital: "{n["capital"]}", '
            + f'gov: "{n["gov"]}", role: "{n["role"]}", lean: {n["lean"]}, cx: {n["cx"]}, cy: {n["cy"]}, '
            + f'area: {n["area"]}, neighbors: {n["neighbors"]}, polygons: {polys}{rogue}'
            + " },"
        )
    lines.append("];")
    lines.append("export const RIVERS: number[][][] = " + "[" + ",".join("[" + ",".join(f"[{p[0]},{p[1]}]" for p in r) + "]" for r in rivers) + "];")
    lines += [
        "export function rolePatron(role: AtlasRole): 0 | 1 | 2 {",
        '  if (role === "compact_core" || role === "compact_sat") return 1;',
        '  if (role === "directorate_core" || role === "directorate_sat") return 2;',
        "  return 0;",
        "}",
        "function pip(x: number, y: number, ring: number[][]): boolean {",
        "  let inside = false;",
        "  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {",
        "    const xi = ring[i]![0]!, yi = ring[i]![1]!;",
        "    const xj = ring[j]![0]!, yj = ring[j]![1]!;",
        "    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;",
        "    if (hit) inside = !inside;",
        "  }",
        "  return inside;",
        "}",
        "export function nationAt(x: number, y: number): number | null {",
        "  for (let i = ATLAS.length - 1; i >= 0; i--) {",
        "    const a = ATLAS[i]!;",
        "    const rings = a.polygons;",
        "    if (!rings.length) continue;",
        "    const inOuter = pip(x, y, rings[0]!);",
        "    let inHole = false;",
        "    let inIsland = false;",
        "    for (let r = 1; r < rings.length; r++) {",
        "      if (pip(x, y, rings[r]!)) {",
        "        if (inOuter) inHole = true;",
        "        else inIsland = true;",
        "      }",
        "    }",
        "    if ((inOuter && !inHole) || inIsland) return a.id;",
        "  }",
        "  return null;",
        "}",
        f"export const COMPASS: [number, number] = [{xy(3.8, 56.4)[0]}, {xy(3.8, 56.4)[1]}];",
    ]
    path = "/workspace/src/game/atlas.ts"
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")
    print("wrote", path, "nations", len(packed))
    for n in packed:
        print(f"  {n['id']:2} {n['name']:12} {n['area']:7} nbr {n['neighbors']}")


if __name__ == "__main__":
    build()
