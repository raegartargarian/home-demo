/**
 * The drawings.
 *
 * These are authored line drawings, not stock photography — the direction in
 * `docs/design-direction.md` §5C argues the exploded axonometric *is* the value
 * proposition ("every layer documented") in a way a photo of a nice kitchen
 * never will be, and it sidesteps licensing, model releases and stock-photo
 * tells entirely.
 *
 * Everything is generated from geometry rather than hand-written path data, so
 * a room can be moved by editing one number instead of twelve coordinates.
 *
 * Palette is shared with the app's token layer:
 *   ink        #282828   linework, never pure black
 *   blueprint  #A3C1D5   the axonometric field
 *   paper      #F7F5F2   drawing ground
 */

export const INK = "#282828";
export const INK_LIGHT = "#8F8B85";
export const PAPER = "#F7F5F2";
export const BLUEPRINT = "#A3C1D5";
export const BLUEPRINT_DEEP = "#7FA3BC";

/** Feet → px. One number controls the scale of the whole plan. */
const PX = 20;
const ft = (n) => n * PX;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/**
 * Every drawing is emitted on a **square** canvas, with the composition centred
 * inside it.
 *
 * That is not an aesthetic choice. macOS QuickLook — the only SVG rasteriser
 * that ships on the machine — renders into a square and crops anything past the
 * shorter edge, anchored top-left. A 1500×1120 drawing silently loses its right
 * 380px. Padding to square here means the composition survives rasterisation,
 * and the SVG the app consumes is identical to the PNG in the example set.
 */
const svg = ({ width, height, children, background = PAPER }) => {
  const size = Math.max(width, height);
  const dx = (size - width) / 2;
  const dy = (size - height) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
  <rect width="${size}" height="${size}" fill="${background}"/>
  <g transform="translate(${dx} ${dy})">
${children}
  </g>
</svg>
`;
};

const text = (x, y, content, opts = {}) => {
  const {
    size = 13,
    fill = INK,
    weight = 400,
    anchor = "start",
    tracking = 0,
    transform = "",
  } = opts;
  return `  <text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${tracking}"${transform ? ` transform="${transform}"` : ""}>${esc(content)}</text>`;
};

// ---------------------------------------------------------------------------
// A. Floor plan — Sheet A-101
// ---------------------------------------------------------------------------

/** Rooms are declared in feet, origin at the building's top-left corner. */
const ROOMS = [
  { x: 0, y: 0, w: 16, h: 14, name: "Primary Bedroom", area: "224 SF" },
  { x: 0, y: 14, w: 16, h: 10, name: "Primary Bath", area: "160 SF" },
  { x: 0, y: 24, w: 16, h: 14, name: "Bedroom 2", area: "224 SF" },
  { x: 16, y: 0, w: 14, h: 12, name: "Kitchen", area: "168 SF", highlight: true },
  { x: 16, y: 12, w: 14, h: 10, name: "Dining", area: "140 SF" },
  { x: 16, y: 22, w: 14, h: 16, name: "Living", area: "224 SF" },
  { x: 30, y: 0, w: 14, h: 12, name: "Bedroom 3", area: "168 SF" },
  { x: 30, y: 12, w: 14, h: 7, name: "Bath 2", area: "98 SF" },
  { x: 30, y: 19, w: 14, h: 10, name: "Bedroom 4", area: "140 SF" },
  { x: 30, y: 29, w: 14, h: 9, name: "Utility / Garage", area: "126 SF" },
];

const BUILDING_W = 44;
const BUILDING_H = 38;

export function floorPlan() {
  const margin = 90;
  const titleBlock = 130;
  const width = ft(BUILDING_W) + margin * 2;
  const height = ft(BUILDING_H) + margin * 2 + titleBlock;
  const ox = margin;
  const oy = margin;

  const parts = [];

  // Exterior wall: a double line, the thick one outside.
  parts.push(
    `  <rect x="${ox}" y="${oy}" width="${ft(BUILDING_W)}" height="${ft(BUILDING_H)}" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>`
  );
  parts.push(
    `  <rect x="${ox + 5}" y="${oy + 5}" width="${ft(BUILDING_W) - 10}" height="${ft(BUILDING_H) - 10}" fill="none" stroke="${INK}" stroke-width="1"/>`
  );

  for (const room of ROOMS) {
    const x = ox + ft(room.x);
    const y = oy + ft(room.y);
    const w = ft(room.w);
    const h = ft(room.h);

    if (room.highlight) {
      // The Kitchen is the record's own subject — tinted, not outlined louder.
      parts.push(
        `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${BLUEPRINT}" fill-opacity="0.22"/>`
      );
    }
    parts.push(
      `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="2"/>`
    );
    parts.push(
      text(x + w / 2, y + h / 2 - 2, room.name.toUpperCase(), {
        size: 11,
        anchor: "middle",
        weight: 500,
        tracking: 0.6,
      })
    );
    parts.push(
      text(x + w / 2, y + h / 2 + 14, room.area, {
        size: 10,
        anchor: "middle",
        fill: INK_LIGHT,
      })
    );
  }

  // Door swings: a quarter arc plus the leaf, drawn on a few interior walls.
  const doors = [
    { x: 16, y: 7, dir: "v" },
    { x: 16, y: 30, dir: "v" },
    { x: 30, y: 6, dir: "v" },
    { x: 30, y: 24, dir: "v" },
    { x: 8, y: 14, dir: "h" },
    { x: 23, y: 12, dir: "h" },
  ];
  for (const door of doors) {
    const x = ox + ft(door.x);
    const y = oy + ft(door.y);
    const r = ft(3);
    if (door.dir === "v") {
      parts.push(
        `  <path d="M ${x} ${y} L ${x} ${y + r}" stroke="${PAPER}" stroke-width="5"/>`,
        `  <path d="M ${x} ${y} L ${x + r} ${y} A ${r} ${r} 0 0 1 ${x} ${y + r}" fill="none" stroke="${INK}" stroke-width="1"/>`
      );
    } else {
      parts.push(
        `  <path d="M ${x} ${y} L ${x + r} ${y}" stroke="${PAPER}" stroke-width="5"/>`,
        `  <path d="M ${x} ${y} L ${x} ${y + r} A ${r} ${r} 0 0 0 ${x + r} ${y}" fill="none" stroke="${INK}" stroke-width="1"/>`
      );
    }
  }

  // Windows: a gap in the exterior wall with a thin sill line.
  const windows = [
    { x: 4, y: 0, w: 6 },
    { x: 20, y: 0, w: 6 },
    { x: 34, y: 0, w: 6 },
    { x: 6, y: BUILDING_H, w: 6 },
    { x: 20, y: BUILDING_H, w: 8 },
  ];
  for (const win of windows) {
    const x = ox + ft(win.x);
    const y = oy + ft(win.y);
    parts.push(
      `  <rect x="${x}" y="${y - 3}" width="${ft(win.w)}" height="6" fill="#FFFFFF"/>`,
      `  <line x1="${x}" y1="${y}" x2="${x + ft(win.w)}" y2="${y}" stroke="${INK}" stroke-width="1"/>`
    );
  }

  // Dimension lines along the top and left edges.
  const dimY = oy - 34;
  parts.push(
    `  <line x1="${ox}" y1="${dimY}" x2="${ox + ft(BUILDING_W)}" y2="${dimY}" stroke="${INK}" stroke-width="1"/>`,
    `  <line x1="${ox}" y1="${dimY - 6}" x2="${ox}" y2="${dimY + 6}" stroke="${INK}" stroke-width="1"/>`,
    `  <line x1="${ox + ft(BUILDING_W)}" y1="${dimY - 6}" x2="${ox + ft(BUILDING_W)}" y2="${dimY + 6}" stroke="${INK}" stroke-width="1"/>`,
    text(ox + ft(BUILDING_W) / 2, dimY - 10, `${BUILDING_W}'-0"`, {
      size: 11,
      anchor: "middle",
    })
  );
  const dimX = ox - 34;
  parts.push(
    `  <line x1="${dimX}" y1="${oy}" x2="${dimX}" y2="${oy + ft(BUILDING_H)}" stroke="${INK}" stroke-width="1"/>`,
    `  <line x1="${dimX - 6}" y1="${oy}" x2="${dimX + 6}" y2="${oy}" stroke="${INK}" stroke-width="1"/>`,
    `  <line x1="${dimX - 6}" y1="${oy + ft(BUILDING_H)}" x2="${dimX + 6}" y2="${oy + ft(BUILDING_H)}" stroke="${INK}" stroke-width="1"/>`,
    text(dimX - 10, oy + ft(BUILDING_H) / 2, `${BUILDING_H}'-0"`, {
      size: 11,
      anchor: "middle",
      transform: `rotate(-90 ${dimX - 10} ${oy + ft(BUILDING_H) / 2})`,
    })
  );

  // North arrow.
  const nx = ox + ft(BUILDING_W) + 40;
  const ny = oy + 30;
  parts.push(
    `  <path d="M ${nx} ${ny - 18} L ${nx + 7} ${ny + 8} L ${nx} ${ny + 2} L ${nx - 7} ${ny + 8} Z" fill="${INK}"/>`,
    text(nx, ny + 26, "N", { size: 12, anchor: "middle", weight: 500 })
  );

  // Title block.
  const tby = oy + ft(BUILDING_H) + 50;
  parts.push(
    `  <line x1="${ox}" y1="${tby}" x2="${width - margin}" y2="${tby}" stroke="${INK}" stroke-width="1"/>`,
    text(ox, tby + 30, "4412 MAPLE RIDGE DRIVE", { size: 20, weight: 500, tracking: -0.4 }),
    text(ox, tby + 50, "Austin, Texas 78704", { size: 13, fill: INK_LIGHT }),
    text(width - margin, tby + 30, "SHEET A-101", {
      size: 20,
      weight: 500,
      anchor: "end",
      tracking: -0.4,
    }),
    text(width - margin, tby + 50, "First floor plan  ·  1/4\" = 1'-0\"  ·  16 APR 1998", {
      size: 12,
      fill: INK_LIGHT,
      anchor: "end",
    }),
    text(ox, tby + 76, "GENERATED SAMPLE — not a genuine construction document", {
      size: 10,
      fill: INK_LIGHT,
      tracking: 0.4,
    })
  );

  return svg({ width, height, children: parts.join("\n") });
}

// ---------------------------------------------------------------------------
// B. Exploded axonometric
// ---------------------------------------------------------------------------

/**
 * Isometric projection, feet → px.
 *
 * `ISO_PX` and `LAYER_GAP` are the only two numbers that control the
 * composition: the first sets how big the building is on the page, the second
 * how far the layers fly apart. Both are in feet-equivalent so the drawing
 * stays in proportion when either changes.
 */
const ISO_PX = 11;
const LAYER_GAP = 9;

const iso = (x, y, z) => ({
  x: (x - y) * Math.cos(Math.PI / 6) * ISO_PX,
  y: ((x + y) * Math.sin(Math.PI / 6) - z) * ISO_PX,
});

const at = (ox, oy, x, y, z) => {
  const p = iso(x, y, z);
  return `${(ox + p.x).toFixed(1)},${(oy + p.y).toFixed(1)}`;
};

/** A slab with two visible side faces, so it reads as a plate rather than an
 *  outline. `x0`/`y0` let the site plane oversail the building footprint. */
const isoSlab = (ox, oy, opts) => {
  const {
    x0 = 0,
    y0 = 0,
    w,
    d,
    z,
    fill = "#FFFFFF",
    stroke = INK,
    strokeWidth = 1.4,
    thickness = 0,
  } = opts;

  const top = [
    at(ox, oy, x0, y0, z),
    at(ox, oy, x0 + w, y0, z),
    at(ox, oy, x0 + w, y0 + d, z),
    at(ox, oy, x0, y0 + d, z),
  ];
  const topFace = `  <polygon points="${top.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
  if (!thickness) return topFace;

  const under = [
    at(ox, oy, x0 + w, y0, z - thickness),
    at(ox, oy, x0 + w, y0 + d, z - thickness),
    at(ox, oy, x0, y0 + d, z - thickness),
  ];
  return [
    `  <polygon points="${top[1]} ${top[2]} ${under[1]} ${under[0]}" fill="${BLUEPRINT_DEEP}" fill-opacity="0.5" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`,
    `  <polygon points="${top[2]} ${top[3]} ${under[2]} ${under[1]}" fill="${BLUEPRINT_DEEP}" fill-opacity="0.3" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`,
    topFace,
  ].join("\n");
};

export function explodedAxonometric() {
  const width = 1500;
  const height = 1120;
  // Origin: the building's model-space (0,0,0). Chosen so the whole stack —
  // including the site plane, which oversails the footprint — clears the
  // headline above and the annotation column on the left.
  const ox = 810;
  const oy = 460;
  const parts = [];

  const layers = [
    { label: "Foundation & site", note: "Boundary survey · 30 MAR 1998" },
    { label: "First floor", note: "Sheet A-101 · 16 APR 1998" },
    { label: "Systems", note: "HVAC · solar · 22 JUL 2019" },
    { label: "Roof", note: "Replacement · 30 MAY 2026" },
  ];

  // Site plane, oversailing the footprint and drawn in the lighter tone so the
  // building stays the subject.
  parts.push(
    isoSlab(ox, oy, {
      x0: -6,
      y0: -5,
      w: BUILDING_W + 12,
      d: BUILDING_H + 11,
      z: -LAYER_GAP,
      fill: "#FFFFFF",
      stroke: INK_LIGHT,
      strokeWidth: 1,
    })
  );
  const drive = [
    at(ox, oy, 46, -5, -LAYER_GAP),
    at(ox, oy, BUILDING_W + 6, -5, -LAYER_GAP),
    at(ox, oy, BUILDING_W + 6, 4, -LAYER_GAP),
    at(ox, oy, 46, 4, -LAYER_GAP),
  ].join(" ");
  parts.push(
    `  <polygon points="${drive}" fill="${INK_LIGHT}" fill-opacity="0.18" stroke="${INK_LIGHT}" stroke-width="1"/>`
  );
  for (const [tx, ty] of [
    [-3, 38],
    [47, 40],
    [-2, 4],
  ]) {
    const p = iso(tx, ty, -LAYER_GAP);
    const cx = (ox + p.x).toFixed(1);
    const base = (oy + p.y).toFixed(1);
    parts.push(
      `  <line x1="${cx}" y1="${base}" x2="${cx}" y2="${(oy + p.y - 22).toFixed(1)}" stroke="${INK_LIGHT}" stroke-width="1"/>`,
      `  <circle cx="${cx}" cy="${(oy + p.y - 30).toFixed(1)}" r="10" fill="none" stroke="${INK_LIGHT}" stroke-width="1"/>`
    );
  }

  layers.forEach((layer, index) => {
    const z = index * LAYER_GAP;
    parts.push(
      isoSlab(ox, oy, {
        w: BUILDING_W,
        d: BUILDING_H,
        z,
        thickness: index === 3 ? 1.6 : 2.2,
      })
    );

    if (index === 1) {
      // The floor plate carries its partitions, so it reads as A-101 in space.
      const walls = [
        [16, 0, 16, 38],
        [30, 0, 30, 38],
        [0, 14, 16, 14],
        [0, 24, 16, 24],
        [16, 12, 30, 12],
        [16, 22, 30, 22],
        [30, 12, 44, 12],
        [30, 19, 44, 19],
        [30, 29, 44, 29],
      ];
      for (const [x1, y1, x2, y2] of walls) {
        parts.push(
          `  <polyline points="${at(ox, oy, x1, y1, z)} ${at(ox, oy, x2, y2, z)}" fill="none" stroke="${INK}" stroke-width="1"/>`
        );
      }
      const kitchen = [
        at(ox, oy, 16, 0, z),
        at(ox, oy, 30, 0, z),
        at(ox, oy, 30, 12, z),
        at(ox, oy, 16, 12, z),
      ].join(" ");
      parts.push(
        `  <polygon points="${kitchen}" fill="${BLUEPRINT_DEEP}" fill-opacity="0.45" stroke="${INK}" stroke-width="1"/>`
      );
    }

    if (index === 2) {
      for (const [x1, y1, x2, y2] of [
        [4, 6, 40, 6],
        [22, 6, 22, 34],
        [22, 20, 40, 20],
      ]) {
        parts.push(
          `  <polyline points="${at(ox, oy, x1, y1, z)} ${at(ox, oy, x2, y2, z)}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 4"/>`
        );
      }
      // Solar array on the systems layer.
      const array = [
        at(ox, oy, 6, 24, z),
        at(ox, oy, 18, 24, z),
        at(ox, oy, 18, 34, z),
        at(ox, oy, 6, 34, z),
      ].join(" ");
      parts.push(
        `  <polygon points="${array}" fill="${INK}" fill-opacity="0.14" stroke="${INK}" stroke-width="1"/>`
      );
    }

    if (index === 3) {
      parts.push(
        `  <polyline points="${at(ox, oy, 0, 19, z)} ${at(ox, oy, 44, 19, z)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`
      );
      for (let s = 4; s < 44; s += 5) {
        parts.push(
          `  <polyline points="${at(ox, oy, s, 0, z)} ${at(ox, oy, s, 38, z)}" fill="none" stroke="${INK_LIGHT}" stroke-width="0.6"/>`
        );
      }
    }

    // Dashed leader from the layer's near-left corner out to the annotation.
    const anchor = iso(0, BUILDING_H, z);
    const ax = ox + anchor.x;
    const ay = oy + anchor.y;
    const labelX = 96;
    parts.push(
      `  <line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${labelX + 24}" y2="${ay.toFixed(1)}" stroke="${INK}" stroke-width="1" stroke-dasharray="4 4"/>`,
      `  <circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="3.5" fill="${INK}"/>`,
      // Hand-struck circle and letter — the bit of warmth that stops the
      // drawing reading as a CAD export.
      `  <circle cx="${labelX}" cy="${(ay - 5).toFixed(1)}" r="15" fill="${BLUEPRINT}" stroke="${INK}" stroke-width="1.6"/>`,
      text(labelX, ay, String.fromCharCode(65 + index), {
        size: 16,
        anchor: "middle",
        weight: 500,
      }),
      text(labelX + 26, ay - 26, layer.label, { size: 15, weight: 500, tracking: -0.2 }),
      text(labelX + 26, ay - 9, layer.note, { size: 11, fill: "#3E4C56" })
    );
  });

  parts.push(
    text(80, 84, "Everything your house has ever been.", {
      size: 34,
      weight: 500,
      tracking: -0.8,
    }),
    text(80, 112, "4412 Maple Ridge Drive · every layer, on the record", {
      size: 14,
      fill: "#3E4C56",
    }),
    text(80, height - 40, "GENERATED SAMPLE — illustrative drawing, not a survey", {
      size: 10,
      fill: "#3E4C56",
      tracking: 0.4,
    })
  );

  return svg({ width, height, children: parts.join("\n"), background: BLUEPRINT });
}

// ---------------------------------------------------------------------------
// C. Kitchen elevation — before and after
// ---------------------------------------------------------------------------

/**
 * The same wall, drawn twice. Keeping one geometry function for both states is
 * what makes the pair line up: a before/after that doesn't share a viewpoint
 * reads as two unrelated photos.
 */
function kitchenElevation({ after }) {
  const width = 1200;
  const height = 800;
  const parts = [];

  const wall = { x: 100, y: 110, w: 1000, h: 520 };
  const counterY = wall.y + 300;

  const cabinetFill = after ? "#FFFFFF" : "#DCD3C4";
  const counterFill = after ? "#3F3F3F" : "#C9BFAE";
  const floorFill = after ? "#C8AE8C" : "#B7A98F";

  parts.push(
    `  <rect x="${wall.x}" y="${wall.y}" width="${wall.w}" height="${wall.h}" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>`,
    // Floor band.
    `  <rect x="${wall.x}" y="${wall.y + wall.h - 70}" width="${wall.w}" height="70" fill="${floorFill}" stroke="${INK}" stroke-width="2"/>`
  );

  // Floor boards, angled the same way in both states.
  for (let x = wall.x + 40; x < wall.x + wall.w; x += 46) {
    parts.push(
      `  <line x1="${x}" y1="${wall.y + wall.h - 70}" x2="${x - 18}" y2="${wall.y + wall.h}" stroke="${INK}" stroke-width="0.8" stroke-opacity="0.4"/>`
    );
  }

  // Upper cabinets — a run of doors, left and right of the window.
  const upperRuns = after
    ? [
        { x: 130, w: 260 },
        { x: 810, w: 260 },
      ]
    : [
        { x: 130, w: 300 },
        { x: 770, w: 300 },
      ];
  for (const run of upperRuns) {
    const doors = Math.round(run.w / 130);
    for (let d = 0; d < doors; d++) {
      const dw = run.w / doors;
      const dx = run.x + d * dw;
      parts.push(
        `  <rect x="${dx}" y="${wall.y + 40}" width="${dw - 6}" height="150" fill="${cabinetFill}" stroke="${INK}" stroke-width="1.6"/>`
      );
      // Handles: a long bar after, a small knob before.
      parts.push(
        after
          ? `  <line x1="${dx + dw - 26}" y1="${wall.y + 150}" x2="${dx + dw - 26}" y2="${wall.y + 178}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
          : `  <circle cx="${dx + dw - 24}" cy="${wall.y + 168}" r="5" fill="none" stroke="${INK}" stroke-width="1.6"/>`
      );
    }
  }

  // Window over the sink — unchanged, which is what anchors the comparison.
  parts.push(
    `  <rect x="${wall.x + 340}" y="${wall.y + 40}" width="${wall.w - 680}" height="190" fill="${BLUEPRINT}" fill-opacity="0.5" stroke="${INK}" stroke-width="2"/>`,
    `  <line x1="${wall.x + wall.w / 2}" y1="${wall.y + 40}" x2="${wall.x + wall.w / 2}" y2="${wall.y + 230}" stroke="${INK}" stroke-width="1.6"/>`,
    `  <line x1="${wall.x + 340}" y1="${wall.y + 135}" x2="${wall.x + wall.w - 340}" y2="${wall.y + 135}" stroke="${INK}" stroke-width="1.6"/>`
  );

  // Counter and base cabinets.
  parts.push(
    `  <rect x="${wall.x + 30}" y="${counterY}" width="${wall.w - 60}" height="${after ? 16 : 12}" fill="${counterFill}" stroke="${INK}" stroke-width="2"/>`,
    `  <rect x="${wall.x + 30}" y="${counterY + (after ? 16 : 12)}" width="${wall.w - 60}" height="${wall.h - 70 - 300 - (after ? 16 : 12)}" fill="${cabinetFill}" stroke="${INK}" stroke-width="2"/>`
  );
  for (let x = wall.x + 30; x < wall.x + wall.w - 90; x += 120) {
    parts.push(
      `  <line x1="${x + 120}" y1="${counterY + (after ? 16 : 12)}" x2="${x + 120}" y2="${wall.y + wall.h - 70}" stroke="${INK}" stroke-width="1.2"/>`
    );
  }

  // Sink under the window.
  parts.push(
    `  <rect x="${wall.x + 430}" y="${counterY - 4}" width="${140}" height="${after ? 24 : 18}" fill="${after ? "#8F8B85" : "#A8A093"}" stroke="${INK}" stroke-width="1.6"/>`,
    `  <path d="M ${wall.x + 500} ${counterY - 10} q 0 -34 30 -34" fill="none" stroke="${INK}" stroke-width="2.4"/>`
  );

  if (after) {
    // The island is the whole point of the remodel.
    parts.push(
      `  <rect x="${wall.x + 300}" y="${wall.y + wall.h - 60}" width="400" height="20" fill="${counterFill}" stroke="${INK}" stroke-width="2"/>`,
      `  <rect x="${wall.x + 330}" y="${wall.y + wall.h - 40}" width="340" height="40" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>`
    );
    // Three pendants over the island.
    for (const px of [wall.x + 400, wall.x + 500, wall.x + 600]) {
      parts.push(
        `  <line x1="${px}" y1="${wall.y + 10}" x2="${px}" y2="${wall.y + 96}" stroke="${INK}" stroke-width="1.4"/>`,
        `  <path d="M ${px - 22} ${wall.y + 128} L ${px + 22} ${wall.y + 128} L ${px + 12} ${wall.y + 96} L ${px - 12} ${wall.y + 96} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.6"/>`
      );
    }
  } else {
    // Dated fluorescent box light and a worn patch on the wall.
    parts.push(
      `  <rect x="${wall.x + 420}" y="${wall.y + 12}" width="180" height="26" fill="#EDEAE5" stroke="${INK}" stroke-width="1.6"/>`,
      `  <path d="M ${wall.x + 120} ${counterY - 60} q 40 -20 90 -6 q 40 12 70 -4" fill="none" stroke="${INK_LIGHT}" stroke-width="1.2"/>`
    );
  }

  const label = after ? "AFTER" : "BEFORE";
  const caption = after
    ? "Kitchen remodel complete · 26 JUN 2024"
    : "Prior to demolition · 04 MAR 2024";

  parts.push(
    text(100, 62, label, { size: 15, weight: 500, tracking: 2 }),
    text(100, height - 90, "4412 Maple Ridge Drive · Kitchen", {
      size: 22,
      weight: 500,
      tracking: -0.4,
    }),
    text(100, height - 64, caption, { size: 13, fill: INK_LIGHT }),
    text(100, height - 28, "GENERATED SAMPLE — illustration, not a photograph", {
      size: 10,
      fill: INK_LIGHT,
      tracking: 0.4,
    })
  );

  return svg({ width, height, children: parts.join("\n") });
}

export const kitchenBefore = () => kitchenElevation({ after: false });
export const kitchenAfter = () => kitchenElevation({ after: true });

// ---------------------------------------------------------------------------
// D. Roof — storm damage
// ---------------------------------------------------------------------------

export function roofStormDamage() {
  const width = 1200;
  const height = 800;
  const parts = [];

  const apexX = 600;
  const apexY = 180;
  const eaveY = 560;
  const left = 140;
  const right = 1060;

  // Two roof planes.
  parts.push(
    `  <polygon points="${left},${eaveY} ${apexX},${apexY} ${apexX},${apexY + 40} ${left},${eaveY + 40}" fill="#EDEAE5" stroke="${INK}" stroke-width="2"/>`,
    `  <polygon points="${right},${eaveY} ${apexX},${apexY} ${apexX},${apexY + 40} ${right},${eaveY + 40}" fill="#F4F4F4" stroke="${INK}" stroke-width="2"/>`
  );

  // Shingle courses following each plane.
  for (let t = 0.08; t < 1; t += 0.09) {
    const lx = left + (apexX - left) * t;
    const ly = eaveY + (apexY - eaveY) * t;
    const rx = right + (apexX - right) * t;
    const ry = eaveY + (apexY - eaveY) * t;
    parts.push(
      `  <line x1="${lx.toFixed(0)}" y1="${ly.toFixed(0)}" x2="${apexX}" y2="${(apexY + (ly - apexY)).toFixed(0)}" stroke="${INK_LIGHT}" stroke-width="0.8"/>`,
      `  <line x1="${rx.toFixed(0)}" y1="${ry.toFixed(0)}" x2="${apexX}" y2="${(apexY + (ry - apexY)).toFixed(0)}" stroke="${INK_LIGHT}" stroke-width="0.8"/>`
    );
  }

  // Ridge.
  parts.push(
    `  <line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${apexY + 40}" stroke="${INK}" stroke-width="2.4"/>`
  );

  // Missing shingles: torn patches with a callout each.
  const damage = [
    { x: 320, y: 430, w: 90, h: 54, tag: "1" },
    { x: 470, y: 330, w: 70, h: 44, tag: "2" },
    { x: 760, y: 470, w: 110, h: 60, tag: "3" },
  ];
  damage.forEach((patch) => {
    parts.push(
      `  <path d="M ${patch.x} ${patch.y} l ${patch.w * 0.4} ${-8} l ${patch.w * 0.3} ${10} l ${patch.w * 0.3} ${-6} l ${-4} ${patch.h} l ${-patch.w * 0.35} ${-6} l ${-patch.w * 0.3} ${8} Z" fill="${BLUEPRINT}" fill-opacity="0.55" stroke="${INK}" stroke-width="1.6"/>`,
      `  <circle cx="${patch.x + patch.w + 40}" cy="${patch.y - 20}" r="15" fill="${PAPER}" stroke="${INK}" stroke-width="1.6"/>`,
      text(patch.x + patch.w + 40, patch.y - 15, patch.tag, {
        size: 15,
        anchor: "middle",
        weight: 500,
      }),
      `  <line x1="${patch.x + patch.w + 26}" y1="${patch.y - 12}" x2="${patch.x + patch.w * 0.6}" y2="${patch.y + 10}" stroke="${INK}" stroke-width="1" stroke-dasharray="4 4"/>`
    );
  });

  parts.push(
    text(140, 90, "Storm damage survey", { size: 30, weight: 500, tracking: -0.6 }),
    text(140, 120, "4412 Maple Ridge Drive · south elevation · 16 MAY 2026", {
      size: 14,
      fill: INK_LIGHT,
    }),
    text(140, height - 96, "1 — Missing shingles, ~14 SF", { size: 13 }),
    text(140, height - 74, "2 — Lifted ridge cap", { size: 13 }),
    text(140, height - 52, "3 — Exposed decking, ~22 SF", { size: 13 }),
    text(140, height - 22, "GENERATED SAMPLE — illustration, not an adjuster's report", {
      size: 10,
      fill: INK_LIGHT,
      tracking: 0.4,
    })
  );

  return svg({ width, height, children: parts.join("\n") });
}
