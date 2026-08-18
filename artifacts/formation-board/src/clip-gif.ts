// Turns a recorded clip into an animated GIF, entirely in the browser.
//
// GIF rather than a video file because a GIF plays inline everywhere a clip is
// likely to be sent — iMessage, WhatsApp, Discord — while WebM, the only format
// MediaRecorder reliably produces, does not play on iPhones at all.
//
// Nothing here is imported by the app up front: App.tsx pulls this module in
// with a dynamic import() the first time someone presses download, so the
// encoder costs nothing to anyone who never uses it.
//
// The board is redrawn onto a <canvas> rather than screenshotted, because the
// real board is DOM and CSS and there is no way to rasterise that without an
// external library. Redrawing also lets the export tween between the recorded
// keyframes at a steady frame rate instead of racing the browser's own
// transitions.

import type { Position } from './pitch-types';

export type GifRosterEntry = {
  id: string;
  /** The role number shown inside the circle. */
  number: number;
  /** The position initials (or the name the user typed) shown underneath. */
  label: string;
};

export type GifFrame = {
  players: Record<string, Position>;
  ball: Position | null;
  opponents: Position[];
  note: string;
};

export type GifPalette = {
  pitch: string;
  line: string;
  player: string;
  playerText: string;
  opponent: string;
};

export type GifOptions = {
  frames: GifFrame[];
  roster: GifRosterEntry[];
  /** Seconds per transition, matching the clip's playback speed. */
  speed: number;
  palette: GifPalette;
  width?: number;
  fps?: number;
};

// The board's own coordinate system: x runs 0-100, y runs 0-122.
const VIEW_W = 100;
const VIEW_H = 122;

// ---------------------------------------------------------------------------
// Bit-level GIF plumbing
// ---------------------------------------------------------------------------

/** LSB-first bit packer, which is the order GIF's LZW stream uses. */
class BitWriter {
  private bytes: number[] = [];
  private current = 0;
  private bits = 0;

  write(code: number, size: number) {
    this.current |= code << this.bits;
    this.bits += size;
    while (this.bits >= 8) {
      this.bytes.push(this.current & 0xff);
      this.current >>= 8;
      this.bits -= 8;
    }
  }

  finish(): number[] {
    if (this.bits > 0) {
      this.bytes.push(this.current & 0xff);
      this.current = 0;
      this.bits = 0;
    }
    return this.bytes;
  }
}

/**
 * Variable-width LZW, as GIF specifies it. The code width grows as the
 * dictionary fills and resets once it is full, and the decoder mirrors that
 * from the stream alone — which is why a clear code has to be emitted at the
 * *old* width before the width is reset.
 */
function lzwCompress(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  const writer = new BitWriter();

  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;
  let dictionary = new Map<number, number>();

  writer.write(clearCode, codeSize);

  if (indices.length === 0) {
    writer.write(endCode, codeSize);
    return writer.finish();
  }

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i += 1) {
    const next = indices[i];
    // Safe as a single key: prefix is at most 4095 and next at most 255.
    const key = (prefix << 8) | next;
    const existing = dictionary.get(key);
    if (existing !== undefined) {
      prefix = existing;
      continue;
    }
    writer.write(prefix, codeSize);
    if (nextCode === 4096) {
      writer.write(clearCode, codeSize);
      dictionary = new Map();
      nextCode = endCode + 1;
      codeSize = minCodeSize + 1;
    } else {
      if (nextCode >= 1 << codeSize) codeSize += 1;
      dictionary.set(key, nextCode);
      nextCode += 1;
    }
    prefix = next;
  }

  writer.write(prefix, codeSize);
  writer.write(endCode, codeSize);
  return writer.finish();
}

/** GIF carries payloads in length-prefixed blocks of at most 255 bytes. */
function pushSubBlocks(out: number[], data: number[]) {
  for (let offset = 0; offset < data.length; offset += 255) {
    const chunk = data.slice(offset, offset + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0);
}

function pushShort(out: number[], value: number) {
  out.push(value & 0xff, (value >> 8) & 0xff);
}

// ---------------------------------------------------------------------------
// Colour quantisation
// ---------------------------------------------------------------------------

/**
 * Builds a 256-colour table from the frames themselves rather than a
 * hand-picked palette, so the export tracks whatever the board's theme is.
 * The design is flat, so the most common colours cover nearly every pixel
 * exactly; only anti-aliased edges get snapped to a neighbour.
 */
function buildPalette(frames: ImageData[]): { table: number[]; lookup: Map<number, number> } {
  const counts = new Map<number, number>();
  for (const frame of frames) {
    const { data } = frame;
    for (let i = 0; i < data.length; i += 4) {
      const packed = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      counts.set(packed, (counts.get(packed) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256);
  const colors = ranked.map(([packed]) => packed);
  while (colors.length < 2) colors.push(0);

  const table: number[] = [];
  for (const packed of colors) {
    table.push((packed >> 16) & 0xff, (packed >> 8) & 0xff, packed & 0xff);
  }
  // A GIF colour table must be a power of two in length.
  let size = 2;
  while (size < colors.length) size *= 2;
  while (table.length < size * 3) table.push(0);

  const lookup = new Map<number, number>();
  colors.forEach((packed, index) => lookup.set(packed, index));
  return { table, lookup };
}

/** Nearest colour by squared distance, memoised — the cache does the work,
 *  since a flat design only ever produces a few thousand distinct pixels. */
function makeMatcher(table: number[], lookup: Map<number, number>) {
  const cache = new Map(lookup);
  const entries = table.length / 3;
  return (packed: number): number => {
    const hit = cache.get(packed);
    if (hit !== undefined) return hit;
    const r = (packed >> 16) & 0xff;
    const g = (packed >> 8) & 0xff;
    const b = packed & 0xff;
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < entries; i += 1) {
      const dr = r - table[i * 3];
      const dg = g - table[i * 3 + 1];
      const db = b - table[i * 3 + 2];
      const distance = dr * dr + dg * dg + db * db;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    cache.set(packed, best);
    return best;
  };
}

// ---------------------------------------------------------------------------
// Drawing the board
// ---------------------------------------------------------------------------

type BoardState = {
  players: { label: string; number: number; position: Position }[];
  ball: Position | null;
  opponents: Position[];
  note: string;
};

function drawBoard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: BoardState,
  palette: GifPalette,
) {
  const scale = width / VIEW_W;
  const toX = (x: number) => x * scale;
  const toY = (y: number) => y * scale;

  // Pitch surface, with the same faint vertical mowing stripes as the board.
  ctx.fillStyle = palette.pitch;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  const stripe = width / 10;
  for (let i = 0; i < 10; i += 2) ctx.fillRect(i * stripe, 0, stripe, height);

  ctx.strokeStyle = palette.line;
  ctx.fillStyle = palette.line;
  ctx.lineWidth = Math.max(1, 0.42 * scale);

  const strokeRect = (x: number, y: number, w: number, h: number) =>
    ctx.strokeRect(toX(x), toY(y), toX(w), toY(h));

  strokeRect(1, 1, 98, 120);
  ctx.beginPath();
  ctx.moveTo(toX(1), toY(61));
  ctx.lineTo(toX(99), toY(61));
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(toX(50), toY(61), toX(9.15), 0, Math.PI * 2);
  ctx.stroke();

  const dot = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(toX(x), toY(y), Math.max(1, toX(0.7)), 0, Math.PI * 2);
    ctx.fill();
  };
  dot(50, 61);
  dot(50, 12);
  dot(50, 110);

  strokeRect(17, 1, 66, 18);
  strokeRect(31, 1, 38, 7);
  strokeRect(17, 103, 66, 18);
  strokeRect(31, 114, 38, 7);

  // The D at the edge of each penalty area.
  ctx.beginPath();
  ctx.arc(toX(50), toY(12), toX(12), 0.28 * Math.PI, 0.72 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(toX(50), toY(110), toX(12), 1.28 * Math.PI, 1.72 * Math.PI);
  ctx.stroke();

  // Opponents sit under the team so a marked player stays readable.
  for (const opponent of state.opponents) {
    ctx.beginPath();
    ctx.arc(toX(opponent.x), toY(opponent.y), width * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = palette.opponent;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 248, 221, 0.65)';
    ctx.lineWidth = Math.max(1, width * 0.006);
    ctx.stroke();
  }

  const radius = width * 0.036;
  for (const player of state.players) {
    const cx = toX(player.position.x);
    const cy = toY(player.position.y);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = palette.player;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 248, 221, 0.96)';
    ctx.lineWidth = Math.max(1, width * 0.007);
    ctx.stroke();

    ctx.fillStyle = palette.playerText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(radius * 0.95)}px "Courier New", monospace`;
    ctx.fillText(String(player.number), cx, cy + radius * 0.04);

    if (player.label) {
      ctx.font = `bold ${Math.round(radius * 0.62)}px "Courier New", monospace`;
      ctx.fillStyle = '#fff8dd';
      ctx.textBaseline = 'top';
      ctx.fillText(player.label, cx, cy + radius * 1.25);
    }
  }

  if (state.ball) {
    const bx = toX(state.ball.x);
    const by = toY(state.ball.y);
    const ballRadius = width * 0.023;
    ctx.beginPath();
    ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = Math.max(1, width * 0.004);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by - ballRadius * 0.06, ballRadius * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    ctx.fill();
  }

  if (state.note) {
    const fontSize = Math.max(9, Math.round(width * 0.042));
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const padding = fontSize * 0.6;
    const text = ctx.measureText(state.note);
    const barHeight = fontSize + padding * 1.4;
    const barWidth = Math.min(width - 8, text.width + padding * 2);
    const barX = (width - barWidth) / 2;
    const barY = height - barHeight - width * 0.03;
    ctx.fillStyle = 'rgba(16, 32, 24, 0.82)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff8dd';
    ctx.fillText(state.note, width / 2, barY + barHeight / 2, barWidth - padding);
  }
}

// ---------------------------------------------------------------------------
// Tweening and assembly
// ---------------------------------------------------------------------------

/** Matches the CSS ease-in-out the live board animates with. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const lerpPoint = (from: Position, to: Position, t: number): Position => ({
  x: lerp(from.x, to.x, t),
  y: lerp(from.y, to.y, t),
});

function stateAt(from: GifFrame, to: GifFrame, t: number, roster: GifRosterEntry[]): BoardState {
  const players = roster.flatMap((entry) => {
    const start = from.players[entry.id];
    const end = to.players[entry.id];
    const position = start && end ? lerpPoint(start, end, t) : (end ?? start);
    if (!position) return [];
    return [{ label: entry.label, number: entry.number, position }];
  });

  // A ball that only exists on one side of the transition is snapped rather
  // than flown in from nowhere.
  const ball =
    from.ball && to.ball ? lerpPoint(from.ball, to.ball, t) : (to.ball ?? from.ball ?? null);

  // Opponents are matched up by index; any extra ones simply appear at the
  // target frame instead of sliding in from an arbitrary spot.
  const opponents = to.opponents.map((end, index) => {
    const start = from.opponents[index];
    return start ? lerpPoint(start, end, t) : end;
  });

  return { players, ball, opponents, note: to.note };
}

export async function renderClipGif(options: GifOptions): Promise<Blob> {
  const { frames, roster, speed, palette } = options;
  if (frames.length < 2) throw new Error('A clip needs at least two frames.');

  const width = options.width ?? 300;
  const height = Math.round((width * VIEW_H) / VIEW_W);
  const fps = options.fps ?? 10;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get a drawing context.');

  const perTransition = Math.max(2, Math.round(fps * speed));
  const delay = Math.max(2, Math.round(100 / fps)); // GIF delays are in 1/100 s
  const holdFrames = Math.max(1, Math.round(fps * 0.55));

  const shots: ImageData[] = [];
  const delays: number[] = [];

  const shoot = (state: BoardState, frameDelay: number) => {
    drawBoard(ctx, width, height, state, palette);
    shots.push(ctx.getImageData(0, 0, width, height));
    delays.push(frameDelay);
  };

  // Open on the first frame so the starting shape is readable.
  shoot(stateAt(frames[0], frames[0], 0, roster), delay * holdFrames);

  for (let i = 0; i < frames.length - 1; i += 1) {
    for (let step = 1; step <= perTransition; step += 1) {
      shoot(stateAt(frames[i], frames[i + 1], ease(step / perTransition), roster), delay);
    }
    // Rest on each keyframe so the eye can catch up.
    if (i < frames.length - 2) {
      shoot(stateAt(frames[i + 1], frames[i + 1], 1, roster), delay * 2);
    }
  }

  // Hold the closing frame before the loop restarts.
  const last = frames[frames.length - 1];
  shoot(stateAt(last, last, 1, roster), delay * holdFrames * 2);

  const { table, lookup } = buildPalette(shots);
  const match = makeMatcher(table, lookup);

  const out: number[] = [];
  // Header and logical screen descriptor.
  for (const ch of 'GIF89a') out.push(ch.charCodeAt(0));
  pushShort(out, width);
  pushShort(out, height);
  const tableEntries = table.length / 3;
  let bits = 1;
  while (1 << (bits + 1) <= tableEntries && bits < 8) bits += 1;
  out.push(0xf0 | (bits - 1), 0, 0);
  out.push(...table);

  // Netscape extension: loop forever.
  out.push(0x21, 0xff, 0x0b);
  for (const ch of 'NETSCAPE2.0') out.push(ch.charCodeAt(0));
  out.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const indexed = shots.map((shot) => {
    const pixels = new Uint8Array(width * height);
    const { data } = shot;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      pixels[p] = match((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    }
    return pixels;
  });

  let previous: Uint8Array | null = null;
  let carriedDelay = 0;

  for (let f = 0; f < indexed.length; f += 1) {
    const pixels = indexed[f];
    let left = 0;
    let top = 0;
    let right = width - 1;
    let bottom = height - 1;

    if (previous) {
      // Only the changed rectangle is stored, with each frame left in place
      // for the next to paint over. Most of the pitch never moves, so this
      // is the difference between a bloated GIF and a small one.
      left = width;
      top = height;
      right = -1;
      bottom = -1;
      for (let y = 0; y < height; y += 1) {
        const row = y * width;
        for (let x = 0; x < width; x += 1) {
          if (pixels[row + x] !== previous[row + x]) {
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }
      }
      if (right < left) {
        // Nothing moved: fold this frame's time into the one before it.
        carriedDelay += delays[f];
        continue;
      }
    }

    const rectWidth = right - left + 1;
    const rectHeight = bottom - top + 1;
    const region = new Uint8Array(rectWidth * rectHeight);
    for (let y = 0; y < rectHeight; y += 1) {
      for (let x = 0; x < rectWidth; x += 1) {
        region[y * rectWidth + x] = pixels[(top + y) * width + left + x];
      }
    }

    // Graphic control extension: disposal 1 (leave in place), no transparency.
    out.push(0x21, 0xf9, 0x04, 0x04);
    pushShort(out, delays[f] + carriedDelay);
    out.push(0, 0);
    carriedDelay = 0;

    out.push(0x2c);
    pushShort(out, left);
    pushShort(out, top);
    pushShort(out, rectWidth);
    pushShort(out, rectHeight);
    out.push(0);

    const minCodeSize = 8;
    out.push(minCodeSize);
    pushSubBlocks(out, lzwCompress(region, minCodeSize));

    previous = pixels;
  }

  out.push(0x3b);
  return new Blob([new Uint8Array(out)], { type: 'image/gif' });
}
