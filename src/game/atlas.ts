import type { Gov } from "./types";

export const MAP_W = 1600;
export const MAP_H = 900;

export type AtlasRole = "compact_core" | "directorate_core" | "compact_sat" | "directorate_sat" | "neutral";

export interface AtlasNation {
  id: number;
  name: string;
  adjective: string;
  capital: string;
  gov: Gov;
  role: AtlasRole;
  lean: number;
  cx: number;
  cy: number;
  area: number;
  neighbors: number[];
  polygons: number[][][];
  rogueCandidate?: boolean;
}

export const ATLAS: AtlasNation[] = [
  { id: 1, name: "Merholm", adjective: "Merholmer", capital: "Port Meridian", gov: "federation", role: "compact_core", lean: 100, cx: 167.7, cy: 481.6, area: 125860, neighbors: [2, 3, 4, 5], polygons: [[[48, 250], [160, 228], [268, 240], [310, 310], [298, 410], [320, 520], [280, 640], [210, 730], [120, 780], [56, 720], [40, 560], [36, 400], [48, 250]]] },
  { id: 2, name: "Norland", adjective: "Norlandic", capital: "Hvalstad", gov: "kingdom", role: "compact_sat", lean: 78, cx: 211.8, cy: 146.4, area: 55904, neighbors: [1, 3], polygons: [[[70, 72], [210, 48], [340, 62], [400, 120], [380, 190], [268, 240], [160, 228], [48, 250], [44, 170], [70, 72]]] },
  { id: 3, name: "Wesfeld", adjective: "Wesfeldian", capital: "Rothaven", gov: "republic", role: "compact_sat", lean: 62, cx: 421.7, cy: 249.0, area: 38870, neighbors: [1, 2, 4, 7], rogueCandidate: true, polygons: [[[268, 240], [380, 190], [400, 120], [490, 150], [540, 230], [520, 320], [460, 360], [310, 310], [268, 240]]] },
  { id: 4, name: "Calverry", adjective: "Calverrian", capital: "Port Calver", gov: "republic", role: "compact_sat", lean: 74, cx: 390.9, cy: 436.4, area: 35110, neighbors: [1, 3, 5, 8], polygons: [[[310, 310], [460, 360], [500, 430], [470, 520], [400, 560], [320, 520], [298, 410], [310, 310]]] },
  { id: 5, name: "Dunreach", adjective: "Dunreacher", capital: "Greyhook", gov: "mandate", role: "compact_sat", lean: 70, cx: 334.7, cy: 654.1, area: 29100, neighbors: [1, 4, 6], polygons: [[[320, 520], [400, 560], [430, 640], [400, 720], [300, 760], [210, 730], [280, 640], [320, 520]]] },
  { id: 6, name: "Ostmarch", adjective: "Ostmarcher", capital: "Linde", gov: "kingdom", role: "compact_sat", lean: 68, cx: 270.7, cy: 797.9, area: 30770, neighbors: [5], polygons: [[[120, 780], [210, 730], [300, 760], [400, 720], [430, 780], [360, 850], [220, 868], [130, 840], [120, 780]]] },
  { id: 7, name: "Valtara", adjective: "Valtaran", capital: "Sora", gov: "assembly", role: "neutral", lean: 14, cx: 645.9, cy: 223.4, area: 19700, neighbors: [3, 8, 9], polygons: [[[560, 180], [660, 150], [740, 190], [720, 270], [640, 300], [560, 260], [560, 180]]] },
  { id: 8, name: "Iberholt", adjective: "Iberholtish", capital: "Calla", gov: "republic", role: "neutral", lean: -10, cx: 578.9, cy: 490.3, area: 26550, neighbors: [4, 7, 10, 11], polygons: [[[500, 430], [580, 400], [660, 430], [680, 520], [620, 580], [530, 560], [470, 520], [500, 430]]] },
  { id: 9, name: "Karsino", adjective: "Karsinese", capital: "Vena", gov: "federation", role: "neutral", lean: 8, cx: 854.0, cy: 197.6, area: 24250, neighbors: [7, 12], polygons: [[[760, 140], [880, 120], [960, 170], [940, 250], [850, 280], [760, 240], [760, 140]]] },
  { id: 10, name: "Thalassa", adjective: "Thalassan", capital: "Mira", gov: "mandate", role: "neutral", lean: 2, cx: 780.3, cy: 371.7, area: 23100, neighbors: [8, 9, 12, 13], polygons: [[[700, 300], [800, 290], [870, 340], [860, 430], [780, 460], [700, 420], [700, 300]]] },
  { id: 11, name: "Ruvina", adjective: "Ruvine", capital: "Tesa", gov: "kingdom", role: "neutral", lean: -16, cx: 694.3, cy: 649.6, area: 27300, neighbors: [8, 13, 14], polygons: [[[620, 580], [700, 560], [780, 600], [800, 680], [740, 740], [640, 720], [580, 650], [620, 580]]] },
  { id: 12, name: "Selen", adjective: "Selene", capital: "Porto Selen", gov: "republic", role: "neutral", lean: 20, cx: 983.7, cy: 317.8, area: 21600, neighbors: [9, 10, 16], polygons: [[[900, 260], [1000, 240], [1080, 290], [1060, 370], [980, 400], [900, 360], [900, 260]]] },
  { id: 13, name: "Marak", adjective: "Maraki", capital: "Daru", gov: "junta", role: "neutral", lean: -6, cx: 900.4, cy: 537.0, area: 23800, neighbors: [10, 11, 17], polygons: [[[820, 470], [920, 450], [990, 500], [980, 590], [900, 630], [820, 590], [820, 470]]] },
  { id: 14, name: "Aegea", adjective: "Aegean", capital: "Nymos", gov: "assembly", role: "neutral", lean: 6, cx: 793.1, cy: 804.4, area: 19950, neighbors: [11], polygons: [[[700, 760], [810, 740], [900, 780], [880, 850], [780, 870], [690, 830], [700, 760]]] },
  { id: 15, name: "Dunstow", adjective: "Dunstovian", capital: "Novy Dunst", gov: "party-state", role: "directorate_core", lean: -100, cx: 1378.0, cy: 371.1, area: 143050, neighbors: [16, 18, 19, 20], polygons: [[[1180, 180], [1360, 140], [1500, 180], [1554, 280], [1560, 430], [1520, 560], [1440, 640], [1320, 600], [1240, 500], [1200, 360], [1180, 180]]] },
  { id: 16, name: "Belyov", adjective: "Belyovi", capital: "Krasnograd", gov: "party-state", role: "directorate_sat", lean: -76, cx: 1100.0, cy: 263.6, area: 39800, neighbors: [12, 15, 17], polygons: [[[1040, 120], [1180, 180], [1200, 360], [1120, 400], [1020, 340], [1000, 220], [1040, 120]]] },
  { id: 17, name: "Tarshek", adjective: "Tarsheki", capital: "Orda", gov: "junta", role: "directorate_sat", lean: -64, cx: 1047.8, cy: 468.7, area: 29800, neighbors: [13, 16, 18, 21], polygons: [[[1020, 340], [1120, 400], [1140, 500], [1080, 580], [980, 560], [960, 450], [1020, 340]]] },
  { id: 18, name: "Volna", adjective: "Volnese", capital: "Riga-on-Volna", gov: "assembly", role: "directorate_sat", lean: -70, cx: 1172.1, cy: 493.2, area: 22400, neighbors: [15, 17, 19, 21], polygons: [[[1120, 400], [1200, 360], [1240, 500], [1220, 580], [1140, 600], [1080, 580], [1140, 500], [1120, 400]]] },
  { id: 19, name: "Khast", adjective: "Khasti", capital: "Peln", gov: "party-state", role: "directorate_sat", lean: -80, cx: 1307.3, cy: 657.8, area: 34100, neighbors: [15, 18, 20, 22], polygons: [[[1240, 500], [1320, 600], [1440, 640], [1420, 730], [1300, 760], [1200, 700], [1220, 580], [1240, 500]]] },
  { id: 20, name: "Obren", adjective: "Obreni", capital: "St. Obren", gov: "mandate", role: "directorate_sat", lean: -72, cx: 1484.2, cy: 691.5, area: 22900, neighbors: [15, 19, 22], polygons: [[[1440, 640], [1520, 560], [1560, 620], [1540, 740], [1460, 800], [1380, 780], [1420, 730], [1440, 640]]] },
  { id: 21, name: "Yaltai", adjective: "Yaltaic", capital: "Kem", gov: "junta", role: "directorate_sat", lean: -58, cx: 1021.1, cy: 648.3, area: 30300, neighbors: [13, 17, 18, 22], polygons: [[[900, 630], [980, 560], [1080, 580], [1140, 600], [1120, 700], [1020, 740], [920, 700], [900, 630]]] },
  { id: 22, name: "Svirsk", adjective: "Svirskan", capital: "Svirsk", gov: "party-state", role: "directorate_sat", lean: -74, cx: 1226.4, cy: 789.8, area: 32300, neighbors: [19, 20, 21], polygons: [[[1120, 700], [1200, 700], [1300, 760], [1380, 780], [1360, 850], [1220, 870], [1100, 820], [1120, 700]]] },
];

export function rolePatron(role: AtlasRole): 0 | 1 | 2 {
  if (role === "compact_core" || role === "compact_sat") return 1;
  if (role === "directorate_core" || role === "directorate_sat") return 2;
  return 0;
}

function pip(x: number, y: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!, yi = ring[i]![1]!;
    const xj = ring[j]![0]!, yj = ring[j]![1]!;
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

export function nationAt(x: number, y: number): number | null {
  for (let i = ATLAS.length - 1; i >= 0; i--) {
    const a = ATLAS[i]!;
    for (const ring of a.polygons) {
      if (pip(x, y, ring)) return a.id;
    }
  }
  return null;
}

