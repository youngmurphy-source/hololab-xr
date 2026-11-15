import { App } from './app';

window.addEventListener('error', (e) => {
  console.error('[HoloLab Global Error]', e);
  let b = document.getElementById('debug-error-banner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'debug-error-banner';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:#ffffff;padding:16px;z-index:999999;font-family:monospace;font-size:13px;white-space:pre-wrap;border-bottom:3px solid #fecaca;';
    document.body.appendChild(b);
  }
  b.textContent = `[HoloLab Error] ${e.message}\n${e.error?.stack || ''}`;
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[HoloLab Unhandled Rejection]', e);
  let b = document.getElementById('debug-error-banner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'debug-error-banner';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:#ffffff;padding:16px;z-index:999999;font-family:monospace;font-size:13px;white-space:pre-wrap;border-bottom:3px solid #fecaca;';
    document.body.appendChild(b);
  }
  b.textContent = `[HoloLab Rejection] ${e.reason?.message || e.reason}\n${e.reason?.stack || ''}`;
});

document.documentElement.lang = 'en';

// Dev only: `?emulate` installs a Meta Quest 3 emulator so VR can be tested without a headset.
async function start() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('emulate')) {
    const { XRDevice, metaQuest3 } = await import('iwer');
    const { DevUI } = await import('@iwer/devui');
    const device = new XRDevice(metaQuest3);
    device.installRuntime({ forceInstall: true });
    device.installDevUI(DevUI);
    (window as unknown as { xrDevice: unknown }).xrDevice = device;
  }
  const app = new App(document.getElementById('app')!);
  if (import.meta.env.DEV) (await import('./dev')).installDevHelpers(app);
}

void start();
