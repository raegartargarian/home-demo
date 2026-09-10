/**
 * Builds the landing hero's film and its two stills from the one 720p master.
 *
 * Two things drive every choice here.
 *
 * **The master is 1280x720 and the hero is full-bleed.** Left alone, the
 * browser upscales it with a bilinear filter and the result is mush — siding
 * lines, window mullions and porch columns all lose their edges. Upscaling
 * ahead of time with lanczos and baking in a light unsharp pass is visibly
 * sharper at 1:1, and it costs only file size:
 *
 *   master, as committed              1280x720   2,630,863
 *   lanczos + unsharp, crf 28         1920x1080  3,722,208
 *   lanczos + unsharp, crf 32         1920x1080  2,332,327   <- shipped
 *
 * crf 32 keeps the sharpening intact and lands under the master it replaces.
 * This adds no detail that was not there; it just stops the browser throwing
 * away the detail that was.
 *
 * **The clip is a build sequence, not a loop.** Seven seconds of blueprint →
 * slab → framing → cladding → finished house at dusk. Looping it makes the
 * house un-build itself every seven seconds, forever, behind the headline. So
 * the hero plays it once and holds on the last frame, which is also why there
 * are two stills rather than one:
 *
 *   house-demo-open.jpg     frame 0, the blueprint. The video's `poster`, so
 *                           the first paint matches where playback begins.
 *   house-demo-poster.jpg   the last frame, the finished house. What someone
 *                           who asked for reduced motion sees instead of the
 *                           film — the end of the story rather than the start
 *                           of it — and a far better ground for white type.
 *                           The hero also fades to it when the film stops, so
 *                           the picture that holds the fold for the rest of
 *                           the visit is this still rather than the weakest
 *                           frame of a crf 32 encode.
 *
 * The master is the source of truth, is never overwritten, and is never
 * imported, so Vite does not ship it. Run with `npm run hero:media`; ffmpeg is
 * checked before use and the run is skipped with a warning rather than failing,
 * matching `generateExampleMedia.mjs`.
 */
import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const VIDEO_DIR = join(process.cwd(), "src/assets/video");
const MASTER = join(VIDEO_DIR, "house-demo.mp4");

/** 1.5x with a real filter, then a light edge pass. Order matters. */
const UPSCALE = "scale=1920:1080:flags=lanczos,unsharp=5:5:0.9:5:5:0.0";

/** Shared across both cuts: quality-targeted, and cheap to start playing. */
const H264 = [
  "-c:v",
  "libx264",
  "-preset",
  "veryslow",
  "-pix_fmt",
  "yuv420p",
  // Without this the moov atom lands at the end of the file and playback waits
  // for the whole download — the one thing an above-the-fold film cannot do.
  "-movflags",
  "+faststart",
  // Silent and decorative. Dropping the track is also what lets it autoplay
  // without racing the `muted` attribute.
  "-an",
];

const CUTS = [
  { name: "house-demo-desktop.mp4", crf: "32", filter: UPSCALE },
  // No upscale for phones: at this size the master already has more detail than
  // the screen, and the film is a decorative background on a metered
  // connection.
  { name: "house-demo-mobile.mp4", crf: "28", filter: "scale=854:-2" },
];

const STILLS = [
  { name: "house-demo-open.jpg", at: "0", q: "4" },
  // The last frame, and it has to be exactly that.
  //
  // This one picture does three jobs: it is what someone who asked for reduced
  // motion sees instead of the film, it is what the hero fades to when the
  // film stops, and it is therefore the only frame on this page that stays on
  // screen for the whole visit. Taken a shade early — it used to come from
  // 6.8s — it is a different picture from the one the film ends on (SSIM 0.51
  // against it: the sun is still moving), so the swap at the end read as a cut
  // rather than as the same frame sharpening.
  //
  // `-sseof` with `-update` overwrites one file across the last half second,
  // which leaves the final frame in it whatever the clip's length — a fixed
  // timestamp would go stale the moment the master is recut. And q 2 rather
  // than 4, because a frame that is on screen for a whole session is the last
  // place to save 60 KB.
  { name: "house-demo-poster.jpg", tail: true, q: "2" },
];

const has = async (bin) => {
  try {
    await run("which", [bin]);
    return true;
  } catch {
    return false;
  }
};

const kb = (path) => `${Math.round(statSync(path).size / 1024)} KB`;

async function main() {
  if (!(await has("ffmpeg"))) {
    console.warn("! ffmpeg unavailable — skipping hero encodes");
    return;
  }
  if (!existsSync(MASTER)) {
    console.warn(`! ${MASTER} missing — nothing to derive from`);
    return;
  }

  console.log(`master  house-demo.mp4 (${kb(MASTER)})`);

  for (const { name, crf, filter } of CUTS) {
    const out = join(VIDEO_DIR, name);
    await run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      MASTER,
      "-vf",
      filter,
      ...H264,
      "-crf",
      crf,
      out,
    ]);
    console.log(`cut     ${name} (${kb(out)})`);
  }

  // Both stills come through the same upscale as the desktop cut, so a still
  // and the frame it stands in for are the same picture.
  for (const { name, at, tail, q } of STILLS) {
    const out = join(VIDEO_DIR, name);
    await run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      ...(tail ? ["-sseof", "-0.5"] : ["-ss", at]),
      "-i",
      MASTER,
      ...(tail ? ["-update", "1"] : ["-frames:v", "1"]),
      "-vf",
      UPSCALE,
      "-q:v",
      q,
      out,
    ]);
    console.log(`still   ${name} (${kb(out)})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
