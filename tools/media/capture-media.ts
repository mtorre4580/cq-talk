/**
 * Captures the README media and the social preview from the production build, in demo mode (no
 * API key, no network): screenshots of the tuner, a call and the QSL card on desktop and phone,
 * the 1200×630 Open Graph image, and a GIF + MP4 of a whole demo QSO.
 * Usage: pnpm build && pnpm media   (the GIF and MP4 need ffmpeg on the PATH)
 */
import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, devices } from '@playwright/test';
import type { Browser, BrowserContextOptions, Page } from '@playwright/test';

const ROOT = join(import.meta.dirname, '..', '..');
const PORT = 4310;
const BASE = `http://localhost:${PORT}/cq-talk/`;
const OUT = join(ROOT, 'docs', 'media');
const OG_IMAGE = join(ROOT, 'apps', 'web', 'public', 'og-image.png');
const DESKTOP = { width: 1280, height: 800 };
const PRESET = /World Cup 2026/;
const HANG_UP = 'Switch off the microphone and end the conversation';

const startPreview = async (): Promise<ChildProcess> => {
  const server = spawn(
    'pnpm',
    [
      'exec',
      'vite',
      'preview',
      '--config',
      'apps/web/vite.config.mts',
      '--port',
      String(PORT),
      '--strictPort',
    ],
    { cwd: ROOT, stdio: 'ignore' },
  );
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(BASE)).ok) return server;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  server.kill();
  throw new Error('vite preview did not start: run `pnpm build` first');
};

/** English UI (the README's language), silent, no service worker. */
const newPage = async (browser: Browser, options: BrowserContextOptions) => {
  // The production CSP blocks the style tag the social preview adds on top of the page
  const context = await browser.newContext({
    serviceWorkers: 'block',
    bypassCSP: true,
    ...options,
  });
  await context.addInitScript(() => {
    localStorage.setItem('cq-talk:locale', 'en');
    localStorage.setItem('cq-talk:sound', 'off');
  });
  return { context, page: await context.newPage() };
};

/**
 * Playwright's clock freezes CSS transitions and animations on their first frame, so still frames
 * switch them off and the split, the rift and the valves show their final state.
 */
const NO_MOTION =
  '*, *::before, *::after { animation: none !important; transition: none !important; }';

const open = async (page: Page, still = false) => {
  await page.goto(BASE);
  if (still) await page.addStyleTag({ content: NO_MOTION });
  await page.evaluate(() => document.fonts.ready);
};

/**
 * Still frames run on Playwright's clock with reduced motion: the valves and the split jump to
 * their final state and the demo QSO advances on demand.
 */
const stills = async (browser: Browser, name: string, options: BrowserContextOptions) => {
  const { context, page } = await newPage(browser, { reducedMotion: 'reduce', ...options });
  await page.clock.install();
  await open(page, true);
  await page.screenshot({ path: join(OUT, `${name}-home.png`) });

  await page.getByRole('button', { name: PRESET }).click();
  // Separate steps: React registers the call clock only after the preset's timeout renders
  await page.clock.runFor(750);
  await page.clock.runFor(12_000);
  await page.screenshot({ path: join(OUT, `${name}-call.png`) });

  await page.getByRole('button', { name: HANG_UP }).click();
  await page.clock.runFor(2300);
  await page.getByRole('article').waitFor();
  await page.screenshot({ path: join(OUT, `${name}-qsl.png`), fullPage: name === 'desktop' });
  await context.close();
  console.log(`✓ ${name} screenshots`);
};

/** 1200×630 social preview: the split call under a title plate. */
const ogImage = async (browser: Browser) => {
  const { context, page } = await newPage(browser, {
    reducedMotion: 'reduce',
    viewport: { width: 1200, height: 630 },
  });
  await page.clock.install();
  await open(page, true);
  await page.getByRole('button', { name: PRESET }).click();
  await page.clock.runFor(750);
  await page.clock.runFor(9000);
  await page.addStyleTag({
    content: `
      footer, .cq-footer { display: none !important; }
      .og-plate { position: fixed; left: 40px; top: 30px; z-index: 10; color: #f1e7cc;
        font-family: 'Special Elite', serif; font-size: 44px; text-shadow: 0 2px 12px #000; }
      .og-plate small { display: block; margin-top: 6px; font-family: 'Oswald', sans-serif;
        font-size: 19px; letter-spacing: .14em; color: #e8e4d8; }`,
  });
  await page.evaluate(() => {
    const plate = document.createElement('div');
    plate.className = 'og-plate';
    plate.innerHTML = 'CQ talk<small>PRACTICE SPOKEN ENGLISH WITH AN AI RADIO OPERATOR</small>';
    document.body.append(plate);
  });
  await page.screenshot({ path: OG_IMAGE });
  await context.close();
  console.log('✓ og-image.png');
};

const ffmpeg = (args: string[]) => {
  const run = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (run.status !== 0) throw new Error(`ffmpeg failed: ${args.join(' ')}`);
};

/** A whole demo QSO in real time: warm-up, the rift, typed lines, the cool-down and the card. */
const demoVideo = async (browser: Browser) => {
  if (spawnSync('ffmpeg', ['-version']).status !== 0) {
    console.warn('! ffmpeg not found: skipping demo.gif and demo.mp4 (brew install ffmpeg)');
    return;
  }
  const size = { width: 1280, height: 720 };
  const videoDir = await mkdtemp(join(tmpdir(), 'cq-talk-media-'));
  const { context, page } = await newPage(browser, {
    viewport: size,
    recordVideo: { dir: videoDir, size },
  });
  const started = Date.now();
  await open(page);
  // Let the valves warm up to standby, then call a weekly frequency
  await page.waitForTimeout(2600);
  await page.getByRole('button', { name: PRESET }).click();
  await page.waitForTimeout(13_000);
  await page.getByRole('button', { name: HANG_UP }).click();
  await page.waitForTimeout(5200);
  await context.close();

  const [video] = await readdir(videoDir);
  if (!video) throw new Error('no video recorded');
  const source = join(videoDir, video);
  // Skip the blank frames before the first paint
  const trim = ['-ss', '0.6', '-t', String((Date.now() - started) / 1000)];
  ffmpeg([
    ...trim,
    '-i',
    source,
    '-vf',
    // 10 fps, 800 px and 96 colors keep the starry, glowing frames under GitHub's 10 MB limit
    'fps=10,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    join(OUT, 'demo.gif'),
  ]);
  ffmpeg([
    ...trim,
    '-i',
    source,
    '-c:v',
    'libx264',
    '-crf',
    '26',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-an',
    join(OUT, 'demo.mp4'),
  ]);
  await rm(videoDir, { recursive: true, force: true });
  console.log('✓ demo.gif and demo.mp4');
};

await mkdir(OUT, { recursive: true });
const server = await startPreview();
const browser = await chromium.launch();
try {
  await stills(browser, 'desktop', { viewport: DESKTOP });
  await stills(browser, 'phone', { ...devices['Pixel 7'], deviceScaleFactor: 2 });
  await ogImage(browser);
  await demoVideo(browser);
} finally {
  await browser.close();
  server.kill();
}
