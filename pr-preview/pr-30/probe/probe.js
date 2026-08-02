/*
 * Carve capability probe — issue #2.
 *
 * Answers one question that no amount of reading release notes will settle:
 * can we render with WebGPU *inside* an immersive WebXR session on this device?
 *
 * The critical distinction, and the reason this file exists at all:
 *
 *   navigator.gpu  tells you WebGPU works on the flat 2D browser page.
 *   XRGPUBinding   tells you WebGPU can drive the stereo swapchain of a live
 *                  immersive session.
 *
 * They are different features with different implementation status. Meta shipped
 * "experimental WebGPU" in Quest Browser 146 without naming XRGPUBinding, and the
 * three.js tracking issue says the binding is not implemented on Quest. So this
 * probe checks the two separately and reports them as separate rows, on purpose.
 * If a future reader is tempted to collapse them into one "WebGPU supported?"
 * check: don't. The 2D-page answer is expected to be yes and the in-session
 * answer is expected to be no, and only the second one picks our renderer.
 *
 * Constraints (from the issue): plain HTML + one JS file. No build step, no
 * imports, no dependencies. It must stay loadable as a static file even when the
 * main app is broken, and it must not throw on load in a browser that has neither
 * WebGPU nor WebXR.
 *
 * Every individual check is wrapped so that one throwing cannot abort the rest —
 * an exception message is a *result* here, not a crash.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Result registry
 * ------------------------------------------------------------------ */

/** Status vocabulary. Rendered as glyph + word + colour, never colour alone. */
var STATUS = {
  pass:   { glyph: '✓', word: 'PASS',    cls: 's-pass'   },
  fail:   { glyph: '✗', word: 'FAIL',    cls: 's-fail'   },
  absent: { glyph: '○', word: 'ABSENT',  cls: 's-absent' }, // not a failure: feature simply not present
  error:  { glyph: '⚠', word: 'THREW',   cls: 's-error'  }, // check raised; message is the result
  info:   { glyph: '·', word: 'INFO',    cls: 's-info'   },
  skip:   { glyph: '–', word: 'SKIPPED', cls: 's-skip'   },
  pend:   { glyph: '…', word: 'PENDING', cls: 's-pend'   }
};

var GROUPS = [
  { id: 'env',      title: 'Environment' },
  { id: 'webgpu2d', title: 'WebGPU — outside XR (2D page)' },
  { id: 'webxr2d',  title: 'WebXR — outside XR (2D page)' },
  { id: 'session',  title: 'Inside an immersive-vr session — the part that matters' },
  { id: 'caps',     title: 'Session capabilities' }
];

/*
 * Rows are declared up front so the table (and the exported markdown) always has
 * the same shape, in the same order, whether or not a check has run yet. That is
 * what makes docs/capability-matrix.md a fill-in-the-blanks exercise instead of a
 * transcription exercise, and it means the in-session rows are visibly PENDING
 * rather than silently missing before you put the headset on.
 */
var ROWS = [
  ['env', 'ua',                  'User agent'],
  ['env', 'browser',             'Browser version'],
  ['env', 'platform',            'Platform / OS version'],
  ['env', 'horizonos',           'Horizon OS version'],
  ['env', 'secure',              'Secure context (required for XR)'],
  ['env', 'cores',               'Logical cores'],
  ['env', 'dpr',                 'Device pixel ratio'],

  ['webgpu2d', 'gpu.present',    'navigator.gpu present'],
  ['webgpu2d', 'gpu.format',     'Preferred canvas format'],
  ['webgpu2d', 'gpu.adapter',    'requestAdapter() succeeds'],
  ['webgpu2d', 'gpu.info',       'Adapter info (vendor / architecture / device)'],
  ['webgpu2d', 'gpu.description','Adapter description'],
  ['webgpu2d', 'gpu.features',   'Adapter features'],
  ['webgpu2d', 'gpu.limits',     'Adapter limits'],
  ['webgpu2d', 'gpu.device',     'requestDevice() succeeds'],
  ['webgpu2d', 'gpu.canvas',     'WebGPU render pass on a 2D canvas'],

  ['webxr2d', 'xr.present',      'navigator.xr present'],
  ['webxr2d', 'xr.vr',           'isSessionSupported(immersive-vr)'],
  ['webxr2d', 'xr.ar',           'isSessionSupported(immersive-ar)'],
  ['webxr2d', 'xr.inline',       'isSessionSupported(inline)'],
  ['webxr2d', 'xr.gpubinding',   'window.XRGPUBinding defined (2D page)'],
  ['webxr2d', 'xr.webglbinding', 'window.XRWebGLBinding defined'],
  ['webxr2d', 'xr.hand',         'window.XRHand defined'],

  ['session', 's.session',       'immersive-vr session granted'],
  ['session', 's.features',      'Enabled features'],
  ['session', 's.gpubinding',    'XRGPUBinding defined inside session'],
  ['session', 's.adapter',       'requestAdapter({ xrCompatible: true })'],
  ['session', 's.device',        'requestDevice() for XR use'],
  ['session', 's.binding',       'new XRGPUBinding(session, device)'],
  ['session', 's.gpulayer',      'WebGPU projection layer created'],
  ['session', 's.gpuframe',      'WebGPU layer survives one frame'],
  ['session', 's.gl',            'WebGL2 context, xrCompatible'],
  ['session', 's.gllayer',       'XRWebGLLayer created (fallback path)'],
  ['session', 's.glnative',      'Native framebuffer scale factor'],
  ['session', 's.glsize',        'XRWebGLLayer framebuffer size @ scale 1.0'],
  ['session', 's.glsizenative',  'XRWebGLLayer framebuffer size @ native scale'],
  ['session', 's.glframe',       'XRWebGLLayer survives one frame'],
  ['session', 's.views',         'Views per frame / viewport size'],

  ['caps', 'c.ref.viewer',       'Reference space: viewer'],
  ['caps', 'c.ref.local',        'Reference space: local'],
  ['caps', 'c.ref.localfloor',   'Reference space: local-floor'],
  ['caps', 'c.ref.boundedfloor', 'Reference space: bounded-floor'],
  ['caps', 'c.ref.unbounded',    'Reference space: unbounded'],
  ['caps', 'c.bounds',           'bounded-floor boundsGeometry'],
  ['caps', 'c.rates',            'session.supportedFrameRates'],
  ['caps', 'c.rate',             'Current session.frameRate'],
  ['caps', 'c.hands',            'XRHand on inputSource.hand / joint count'],
  ['caps', 'c.inputs',           'Input sources seen']
];

/** key -> { group, label, status, value, block } */
var results = Object.create(null);
/** ordered list of keys, so dynamically added rows land in a stable place */
var order = [];

(function seed() {
  for (var i = 0; i < ROWS.length; i++) {
    var r = ROWS[i];
    results[r[1]] = { group: r[0], label: r[2], status: 'pend', value: '', block: null };
    order.push(r[1]);
  }
})();

/**
 * Record a result. `value` is a short string for the table; `block` is optional
 * long text (feature lists, limit dumps) shown in a collapsed <details>.
 */
function record(group, key, label, status, value, block) {
  if (!results[key]) {
    results[key] = { group: group, label: label, status: status, value: '', block: null };
    // Insert after the last existing row of the same group so dynamic rows do
    // not jump to the bottom of the table.
    var at = -1;
    for (var i = 0; i < order.length; i++) if (results[order[i]].group === group) at = i;
    order.splice(at + 1, 0, key);
  }
  var row = results[key];
  row.group = group;
  if (label) row.label = label;
  row.status = status;
  row.value = value == null ? '' : String(value);
  row.block = block == null ? null : String(block);
  scheduleRender();
}

function errText(e) {
  if (e == null) return 'unknown error';
  if (e.name && e.message) return e.name + ': ' + e.message;
  if (e.message) return String(e.message);
  return String(e);
}

/**
 * Failure isolation. Runs `fn`, records whatever comes back, and turns any throw
 * or rejection into a THREW row carrying the exception text. Nothing in this
 * probe is allowed to take down the rest of the run.
 *
 * fn may return:
 *   boolean            -> PASS / FAIL
 *   string             -> INFO with that value
 *   { status, value, block }  -> recorded verbatim
 *   undefined          -> INFO with an em dash
 */
async function check(group, key, label, fn) {
  try {
    var out = await fn();
    if (out === undefined || out === null) {
      record(group, key, label, 'info', '—');
    } else if (typeof out === 'boolean') {
      record(group, key, label, out ? 'pass' : 'fail', out ? 'yes' : 'no');
    } else if (typeof out === 'string' || typeof out === 'number') {
      record(group, key, label, 'info', String(out));
    } else {
      record(group, key, label, out.status || 'info', out.value, out.block);
    }
    return out;
  } catch (e) {
    record(group, key, label, 'error', errText(e));
    return null;
  }
}

/** Mark a check skipped because a prerequisite did not hold. */
function skip(group, key, label, why) {
  record(group, key, label, 'skip', why);
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

var tbody, statusEl, btnXR, btnRerun, btnCopy, btnShow, mdPanel, mdOut;
var renderQueued = false;

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  // rAF keeps the table from thrashing while a burst of checks completes.
  // Inside an immersive session the page rAF is throttled, so fall back to a
  // timer — results must still be on screen when the user takes the headset off.
  var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : null;
  var run = function () { renderQueued = false; render(); };
  if (raf) { raf(run); setTimeout(function () { if (renderQueued) run(); }, 250); }
  else setTimeout(run, 0);
}

function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function badge(status) {
  var s = STATUS[status] || STATUS.info;
  var b = el('span', 'badge ' + s.cls);
  b.appendChild(el('span', 'g', s.glyph));
  b.appendChild(document.createTextNode(s.word));
  return b;
}

function render() {
  if (!tbody) return;
  tbody.textContent = '';
  for (var g = 0; g < GROUPS.length; g++) {
    var group = GROUPS[g];
    var head = el('tr', 'group');
    var hc = el('td', null, group.title);
    hc.colSpan = 3;
    head.appendChild(hc);
    tbody.appendChild(head);

    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      var row = results[key];
      if (row.group !== group.id) continue;

      var tr = el('tr');
      tr.appendChild(el('td', 'label', row.label));

      var st = el('td', 'status');
      st.appendChild(badge(row.status));
      tr.appendChild(st);

      var vt = el('td', 'value');
      if (row.value) vt.appendChild(el('span', 'val mono', row.value));
      if (row.block) {
        var d = el('details');
        d.appendChild(el('summary', null, 'details'));
        d.appendChild(el('pre', null, row.block));
        vt.appendChild(d);
      }
      tr.appendChild(vt);
      tbody.appendChild(tr);
    }
  }
}

function setStatus(text, kind) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.className = kind || '';
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

function has(v) { return typeof v !== 'undefined' && v !== null; }

function globalDefined(name) {
  try { return typeof window[name] !== 'undefined'; } catch (e) { return false; }
}

function sortedList(iterable) {
  var out = [];
  try { iterable.forEach(function (v) { out.push(String(v)); }); } catch (e) { /* not iterable */ }
  out.sort();
  return out;
}

function fmtNum(n) {
  if (typeof n !== 'number') return String(n);
  return n >= 1e6 ? n.toLocaleString('en-US') : String(n);
}

/** Resolve on the session's next animation frame, or reject after `ms`. */
function nextFrame(session, ms) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var t = setTimeout(function () {
      if (!done) { done = true; reject(new Error('no XR frame within ' + ms + 'ms')); }
    }, ms || 4000);
    session.requestAnimationFrame(function (time, frame) {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve(frame);
    });
  });
}

/* ------------------------------------------------------------------ *
 * Outside-XR checks
 * ------------------------------------------------------------------ */

function parseBrowserVersion(ua) {
  // Quest Browser reports OculusBrowser/<ver> in addition to Chrome/<ver>; the
  // OculusBrowser number is the one Meta's release notes are keyed on (e.g. 146.0),
  // so prefer it when present.
  var m = /OculusBrowser\/([\d.]+)/.exec(ua);
  if (m) {
    var chrome = /Chrome\/([\d.]+)/.exec(ua);
    return 'OculusBrowser ' + m[1] + (chrome ? ' (Chromium ' + chrome[1] + ')' : '');
  }
  m = /Edg\/([\d.]+)/.exec(ua);       if (m) return 'Edge ' + m[1];
  m = /Chrome\/([\d.]+)/.exec(ua);    if (m) return 'Chrome ' + m[1];
  m = /Firefox\/([\d.]+)/.exec(ua);   if (m) return 'Firefox ' + m[1];
  m = /Version\/([\d.]+).*Safari/.exec(ua); if (m) return 'Safari ' + m[1];
  return 'unrecognised';
}

async function runOutsideChecks() {
  setStatus('Running 2D-page checks…', 'busy');

  /* --- Environment --- */
  var ua = navigator.userAgent || '';
  record('env', 'ua', null, 'info', ua);
  record('env', 'browser', null, 'info', parseBrowserVersion(ua));

  await check('env', 'platform', null, async function () {
    var uad = navigator.userAgentData;
    if (!uad) {
      var m = /Android[ /]([\d.]+)/.exec(ua) || /Windows NT ([\d.]+)/.exec(ua) ||
              /Mac OS X ([\d_.]+)/.exec(ua);
      return { status: 'info', value: m ? m[0] : 'not exposed (no navigator.userAgentData)' };
    }
    var hi = await uad.getHighEntropyValues(['platformVersion', 'fullVersionList', 'model']);
    var parts = [uad.platform || '?', hi.platformVersion || '?'];
    if (hi.model) parts.push('model ' + hi.model);
    return { status: 'info', value: parts.join(' '), block: JSON.stringify(hi, null, 2) };
  });

  // Horizon OS version is not exposed to web content. Quest Browser's UA carries
  // the Android base version, not the Horizon OS release number, and there is no
  // JS API for it. This row is deliberately a manual-entry row: read it from the
  // headset (Settings > System > Software Update) and type it into the matrix.
  record('env', 'horizonos', null, 'info',
    'not exposed to web content — read from Settings › System › Software Update');

  record('env', 'secure', null, window.isSecureContext ? 'pass' : 'fail',
    (window.isSecureContext ? 'yes' : 'no') + ' (' + location.protocol + '//' + location.host + ')');
  record('env', 'cores', null, 'info', String(navigator.hardwareConcurrency || 'unknown'));
  record('env', 'dpr', null, 'info', String(window.devicePixelRatio || 'unknown'));

  /* --- WebGPU on the 2D page --- */
  var gpuPresent = has(navigator.gpu);
  record('webgpu2d', 'gpu.present', null, gpuPresent ? 'pass' : 'absent',
    gpuPresent ? 'yes' : 'navigator.gpu is undefined');

  if (!gpuPresent) {
    ['gpu.format', 'gpu.adapter', 'gpu.info', 'gpu.description', 'gpu.features',
     'gpu.limits', 'gpu.device', 'gpu.canvas'].forEach(function (k) {
      skip('webgpu2d', k, null, 'no navigator.gpu');
    });
  } else {
    await check('webgpu2d', 'gpu.format', null, function () {
      return navigator.gpu.getPreferredCanvasFormat();
    });

    var adapter = null;
    await check('webgpu2d', 'gpu.adapter', null, async function () {
      adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) adapter = await navigator.gpu.requestAdapter();
      return adapter
        ? { status: 'pass', value: 'adapter returned' }
        : { status: 'fail', value: 'requestAdapter() resolved to null — WebGPU API present but no ' +
                                   'usable adapter (blocklisted driver, or software rendering disabled)' };
    });

    if (!adapter) {
      ['gpu.info', 'gpu.description', 'gpu.features', 'gpu.limits', 'gpu.device', 'gpu.canvas']
        .forEach(function (k) { skip('webgpu2d', k, null, 'no adapter'); });
    } else {
      var info = null;
      await check('webgpu2d', 'gpu.info', null, async function () {
        // adapter.info is the current spec; requestAdapterInfo() is the older
        // shape still shipping in some builds. Try both before giving up.
        info = adapter.info || null;
        if (!info && typeof adapter.requestAdapterInfo === 'function') {
          info = await adapter.requestAdapterInfo();
        }
        if (!info) return { status: 'absent', value: 'adapter info unavailable' };
        var v = [info.vendor || '?', info.architecture || '?', info.device || '?'].join(' / ');
        var dump = {};
        for (var own in info) { var val = info[own]; if (typeof val !== 'function') dump[own] = val; }
        // GPUAdapterInfo exposes its fields as prototype getters, so the for..in
        // above can come back empty. Pull the known ones explicitly.
        ['vendor', 'architecture', 'device', 'description', 'subgroupMinSize', 'subgroupMaxSize',
         'isFallbackAdapter'].forEach(function (name) {
          try { if (info[name] !== undefined) dump[name] = info[name]; } catch (e) { /* ignore */ }
        });
        return { status: 'info', value: v, block: JSON.stringify(dump, null, 2) };
      });

      record('webgpu2d', 'gpu.description', null, 'info',
        (info && info.description) ? info.description : '(empty — often redacted for privacy)');

      await check('webgpu2d', 'gpu.features', null, function () {
        var f = sortedList(adapter.features);
        return { status: 'info', value: f.length + ' features', block: f.join('\n') };
      });

      await check('webgpu2d', 'gpu.limits', null, function () {
        var lim = adapter.limits, keys = [], k;
        for (k in lim) keys.push(k);
        // GPUSupportedLimits exposes limits as prototype getters, so for..in over
        // the instance can come back empty. Walk the prototype chain too.
        if (!keys.length) {
          var proto = Object.getPrototypeOf(lim);
          while (proto && proto !== Object.prototype) {
            Object.getOwnPropertyNames(proto).forEach(function (n) {
              if (n !== 'constructor' && keys.indexOf(n) === -1) keys.push(n);
            });
            proto = Object.getPrototypeOf(proto);
          }
        }
        keys.sort();
        var lines = keys.map(function (n) {
          var v; try { v = lim[n]; } catch (e) { v = 'unreadable'; }
          return n + ': ' + fmtNum(v);
        });
        var head = [];
        ['maxTextureDimension2D', 'maxBufferSize', 'maxStorageBufferBindingSize',
         'maxComputeWorkgroupSizeX'].forEach(function (n) {
          try { if (lim[n] !== undefined) head.push(n.replace(/^max/, '') + ' ' + fmtNum(lim[n])); }
          catch (e) { /* ignore */ }
        });
        return { status: 'info', value: keys.length + ' limits' + (head.length ? ' — ' + head.join(', ') : ''),
                 block: lines.join('\n') };
      });

      var device = null;
      await check('webgpu2d', 'gpu.device', null, async function () {
        device = await adapter.requestDevice();
        return !!device;
      });

      if (!device) {
        skip('webgpu2d', 'gpu.canvas', null, 'no device');
      } else {
        // Presence of the API is not proof it renders. One clear pass on an
        // offscreen-ish canvas is the cheapest end-to-end proof available.
        await check('webgpu2d', 'gpu.canvas', null, async function () {
          var canvas = document.createElement('canvas');
          canvas.width = 64; canvas.height = 64;
          var ctx = canvas.getContext('webgpu');
          if (!ctx) return { status: 'fail', value: 'canvas.getContext("webgpu") returned null' };
          var format = navigator.gpu.getPreferredCanvasFormat();
          ctx.configure({ device: device, format: format, alphaMode: 'opaque' });
          var enc = device.createCommandEncoder();
          var pass = enc.beginRenderPass({
            colorAttachments: [{
              view: ctx.getCurrentTexture().createView(),
              clearValue: { r: 0.1, g: 0.2, b: 0.3, a: 1 },
              loadOp: 'clear', storeOp: 'store'
            }]
          });
          pass.end();
          device.queue.submit([enc.finish()]);
          if (device.queue.onSubmittedWorkDone) await device.queue.onSubmittedWorkDone();
          return { status: 'pass', value: 'cleared a ' + canvas.width + '×' + canvas.height +
                                          ' ' + format + ' surface' };
        });
      }
    }
  }

  /* --- WebXR on the 2D page --- */
  var xrPresent = has(navigator.xr);
  record('webxr2d', 'xr.present', null, xrPresent ? 'pass' : 'absent',
    xrPresent ? 'yes' : 'navigator.xr is undefined');

  var vrSupported = false;
  if (!xrPresent) {
    ['xr.vr', 'xr.ar', 'xr.inline'].forEach(function (k) {
      skip('webxr2d', k, null, 'no navigator.xr');
    });
  } else {
    var modes = [['xr.vr', 'immersive-vr'], ['xr.ar', 'immersive-ar'], ['xr.inline', 'inline']];
    for (var i = 0; i < modes.length; i++) {
      var modeKey = modes[i][0], modeName = modes[i][1];
      var out = await check('webxr2d', modeKey, null, (function (m) {
        return async function () {
          var supported = await navigator.xr.isSessionSupported(m);
          // "not supported" is an absence, not a failure — desktop Chrome has no
          // immersive-ar and that is the expected, correct answer there.
          return supported
            ? { status: 'pass', value: 'supported' }
            : { status: 'absent', value: 'not supported' };
        };
      })(modeName));
      if (modeKey === 'xr.vr') vrSupported = !!(out && out.status === 'pass');
    }
  }

  // Constructor-presence checks. XRGPUBinding here is a *necessary but not
  // sufficient* signal — the constructor can exist and still refuse a real
  // session, which is why it is re-checked and actually exercised in-session below.
  record('webxr2d', 'xr.gpubinding', null,
    globalDefined('XRGPUBinding') ? 'pass' : 'absent',
    globalDefined('XRGPUBinding') ? 'yes' : 'window.XRGPUBinding is undefined');
  record('webxr2d', 'xr.webglbinding', null,
    globalDefined('XRWebGLBinding') ? 'pass' : 'absent',
    globalDefined('XRWebGLBinding') ? 'yes' : 'window.XRWebGLBinding is undefined');
  record('webxr2d', 'xr.hand', null,
    globalDefined('XRHand') ? 'pass' : 'absent',
    globalDefined('XRHand') ? 'yes' : 'window.XRHand is undefined');

  if (btnXR) {
    btnXR.disabled = !vrSupported;
    btnXR.textContent = vrSupported
      ? 'Enter VR & run in-session checks'
      : 'immersive-vr not available on this device';
  }

  setStatus(vrSupported
    ? '2D checks done. Put the headset on and press "Enter VR" — it runs for about 12 seconds, ' +
      'hold your hands up in view, then it exits by itself and fills in the rest of the table.'
    : '2D checks done. No immersive-vr on this device, so the in-session rows stay PENDING. ' +
      'Run this same page on a Quest 3 to fill them in.',
    vrSupported ? '' : 'bad');
}

/* ------------------------------------------------------------------ *
 * In-session checks — the reason this probe exists
 * ------------------------------------------------------------------ */

var SESSION_BUDGET_MS = 12000;   // hard cap on time spent in the headset
var HAND_POLL_MS = 5000;         // how long to watch for tracked hands

async function runSessionChecks(session) {
  var t0 = Date.now();
  var timeLeft = function () { return SESSION_BUDGET_MS - (Date.now() - t0); };

  record('session', 's.session', null, 'pass', 'yes (mode immersive-vr)');

  await check('session', 's.features', null, function () {
    var f = session.enabledFeatures ? Array.prototype.slice.call(session.enabledFeatures) : null;
    if (!f) return { status: 'absent', value: 'session.enabledFeatures not reported' };
    return { status: 'info', value: f.join(', '), block: f.join('\n') };
  });

  /* --- Reference spaces --- */
  var refSpaces = [
    ['c.ref.viewer', 'viewer'], ['c.ref.local', 'local'],
    ['c.ref.localfloor', 'local-floor'], ['c.ref.boundedfloor', 'bounded-floor'],
    ['c.ref.unbounded', 'unbounded']
  ];
  var boundedSpace = null, localFloorSpace = null;
  for (var i = 0; i < refSpaces.length; i++) {
    var key = refSpaces[i][0], type = refSpaces[i][1];
    /* jshint loopfunc:true */
    await check('caps', key, null, (function (k, t) {
      return async function () {
        var space;
        try {
          space = await session.requestReferenceSpace(t);
        } catch (e) {
          // A reference space the runtime does not offer rejects with
          // NotSupportedError. That is an absence, not a malfunction — Quest has
          // no 'unbounded', and reporting it as an error would be misleading.
          if (e && e.name === 'NotSupportedError') {
            return { status: 'absent', value: 'not supported (' + errText(e) + ')' };
          }
          throw e;
        }
        if (t === 'bounded-floor') boundedSpace = space;
        if (t === 'local-floor') localFloorSpace = space;
        return { status: 'pass', value: 'granted' };
      };
    })(key, type));
  }

  await check('caps', 'c.bounds', null, function () {
    if (!boundedSpace) return { status: 'skip', value: 'bounded-floor not granted' };
    var pts = boundedSpace.boundsGeometry;
    if (!pts) return { status: 'absent', value: 'boundsGeometry undefined' };
    var lines = pts.map(function (p) { return p.x.toFixed(3) + ', ' + p.z.toFixed(3); });
    return { status: 'pass', value: pts.length + ' boundary points', block: lines.join('\n') };
  });

  /* --- Frame rates --- */
  await check('caps', 'c.rates', null, function () {
    var r = session.supportedFrameRates;
    if (!r) return { status: 'absent', value: 'session.supportedFrameRates undefined' };
    var list = Array.prototype.slice.call(r);
    return { status: 'pass', value: list.join(', ') + ' Hz' };
  });
  await check('caps', 'c.rate', null, function () {
    return has(session.frameRate)
      ? { status: 'info', value: session.frameRate + ' Hz' }
      : { status: 'absent', value: 'session.frameRate undefined' };
  });

  /* ================================================================
   * THE MEASUREMENT: WebGPU inside the session.
   *
   * Checked here, separately from navigator.gpu above, because these are two
   * different implementations. A device can have a fully working WebGPU stack on
   * the 2D page and still have no path from a GPUDevice to the compositor's
   * stereo swapchain. Collapsing these rows would destroy the only information
   * this probe was written to obtain.
   * ================================================================ */

  var gpuBindingPresent = globalDefined('XRGPUBinding');
  record('session', 's.gpubinding', null, gpuBindingPresent ? 'pass' : 'absent',
    gpuBindingPresent
      ? 'yes'
      : 'window.XRGPUBinding is undefined inside the session → no WebGPU stereo path');

  var xrAdapter = null, xrDevice = null, binding = null, gpuLayer = null;

  await check('session', 's.adapter', null, async function () {
    if (!has(navigator.gpu)) return { status: 'skip', value: 'no navigator.gpu' };
    // NOTE: `xrCompatible` is defined by the WebXR/WebGPU Binding module as a
    // member of GPURequestAdapterOptions. WebIDL silently drops unknown dictionary
    // members, so on a UA without the module this call succeeds *while ignoring
    // the flag*. A PASS here therefore does not prove XR compatibility — only
    // s.binding / s.gpuframe below can do that. Reported honestly as such.
    xrAdapter = await navigator.gpu.requestAdapter({ xrCompatible: true });
    if (!xrAdapter) return { status: 'fail', value: 'requestAdapter returned null' };
    return { status: 'pass',
             value: 'adapter returned' + (gpuBindingPresent ? '' : ' (flag likely ignored: no XRGPUBinding)') };
  });

  await check('session', 's.device', null, async function () {
    if (!xrAdapter) return { status: 'skip', value: 'no adapter' };
    // Some drafts also accept xrCompatible on the device descriptor; harmless to
    // pass, ignored where unknown.
    xrDevice = await xrAdapter.requestDevice({ xrCompatible: true });
    return { status: 'pass', value: 'device created' };
  });

  await check('session', 's.binding', null, function () {
    if (!gpuBindingPresent) return { status: 'absent', value: 'XRGPUBinding undefined' };
    if (!xrDevice) return { status: 'skip', value: 'no GPUDevice' };
    binding = new window.XRGPUBinding(session, xrDevice);
    return { status: 'pass', value: 'constructed' };
  });

  await check('session', 's.gpulayer', null, async function () {
    if (!binding) return { status: 'skip', value: 'no XRGPUBinding' };
    var format = binding.getPreferredColorFormat
      ? binding.getPreferredColorFormat()
      : navigator.gpu.getPreferredCanvasFormat();
    gpuLayer = binding.createProjectionLayer({ colorFormat: format });
    await session.updateRenderState({ layers: [gpuLayer] });
    return { status: 'pass', value: 'projection layer, colorFormat ' + format +
             ', ' + gpuLayer.textureWidth + '×' + gpuLayer.textureHeight };
  });

  await check('session', 's.gpuframe', null, async function () {
    if (!gpuLayer) return { status: 'skip', value: 'no WebGPU projection layer' };
    var frame = await nextFrame(session, Math.min(4000, Math.max(1000, timeLeft())));
    var pose = frame.getViewerPose(localFloorSpace || await session.requestReferenceSpace('local'));
    if (!pose) return { status: 'fail', value: 'no viewer pose on first frame' };
    var enc = xrDevice.createCommandEncoder();
    var painted = 0;
    for (var v = 0; v < pose.views.length; v++) {
      var sub = binding.getViewSubImage(gpuLayer, pose.views[v]);
      var view = sub.getViewDescriptor
        ? sub.colorTexture.createView(sub.getViewDescriptor())
        : sub.colorTexture.createView();
      var pass = enc.beginRenderPass({
        colorAttachments: [{
          view: view,
          clearValue: { r: 0.05, g: 0.12, b: 0.2, a: 1 },
          loadOp: 'clear', storeOp: 'store'
        }]
      });
      pass.end();
      painted++;
    }
    xrDevice.queue.submit([enc.finish()]);
    return { status: 'pass', value: 'cleared ' + painted + ' view(s) through the WebGPU swapchain' };
  });

  // Drop the WebGPU layer before testing the WebGL path; renderState.layers wins
  // over baseLayer when it is non-empty.
  if (gpuLayer) {
    try { await session.updateRenderState({ layers: [] }); } catch (e) { /* leave it */ }
  }

  /* --- Fallback path: classic XRWebGLLayer. This is the path we expect to ship. --- */
  var gl = null, glLayer = null, nativeScale = null;

  await check('session', 's.gl', null, async function () {
    var canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl2', { xrCompatible: true, antialias: true, alpha: false });
    if (!gl) return { status: 'fail', value: 'webgl2 context unavailable' };
    // xrCompatible in the context attributes can be ignored; makeXRCompatible()
    // is the authoritative request and may migrate the context to the XR device.
    // Reported separately from context creation so a failure here is legible
    // rather than looking like WebGL2 itself being missing.
    var compat = 'not requested';
    if (gl.makeXRCompatible) {
      try { await gl.makeXRCompatible(); compat = 'makeXRCompatible() ok'; }
      catch (e) { compat = 'makeXRCompatible() failed: ' + errText(e); }
    }
    var dbg = gl.getExtension('WEBGL_debug_renderer_info');
    var renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return {
      status: compat.indexOf('failed') === -1 ? 'pass' : 'fail',
      value: String(renderer) + ' — ' + compat,
      block: 'GL_VERSION: ' + gl.getParameter(gl.VERSION) +
             '\nGL_VENDOR: ' + gl.getParameter(gl.VENDOR) +
             '\nGLSL: ' + gl.getParameter(gl.SHADING_LANGUAGE_VERSION) +
             '\nMAX_TEXTURE_SIZE: ' + gl.getParameter(gl.MAX_TEXTURE_SIZE) +
             '\nMAX_SAMPLES: ' + gl.getParameter(gl.MAX_SAMPLES)
    };
  });

  await check('session', 's.glnative', null, function () {
    if (!globalDefined('XRWebGLLayer')) return { status: 'absent', value: 'XRWebGLLayer undefined' };
    if (!window.XRWebGLLayer.getNativeFramebufferScaleFactor) {
      return { status: 'absent', value: 'getNativeFramebufferScaleFactor undefined' };
    }
    nativeScale = window.XRWebGLLayer.getNativeFramebufferScaleFactor(session);
    return { status: 'pass', value: String(nativeScale) +
             ' (1.0 = the scale the UA hands you by default)' };
  });

  await check('session', 's.glsize', null, function () {
    if (!gl) return { status: 'skip', value: 'no WebGL2 context' };
    var l = new window.XRWebGLLayer(session, gl, { framebufferScaleFactor: 1.0 });
    return { status: 'pass', value: l.framebufferWidth + '×' + l.framebufferHeight +
             ' (antialias ' + l.antialias + ', ignoreDepthValues ' + l.ignoreDepthValues + ')' };
  });

  await check('session', 's.gllayer', null, async function () {
    if (!gl) return { status: 'skip', value: 'no WebGL2 context' };
    var scale = nativeScale || 1.0;
    glLayer = new window.XRWebGLLayer(session, gl, { framebufferScaleFactor: scale });
    await session.updateRenderState({ baseLayer: glLayer });
    return { status: 'pass', value: 'bound as baseLayer at scale ' + scale };
  });

  await check('session', 's.glsizenative', null, function () {
    if (!glLayer) return { status: 'skip', value: 'no XRWebGLLayer' };
    return { status: 'info', value: glLayer.framebufferWidth + '×' + glLayer.framebufferHeight +
             ' @ scale ' + (nativeScale || 1.0) };
  });

  var refSpace = localFloorSpace;
  if (!refSpace) {
    try { refSpace = await session.requestReferenceSpace('local'); }
    catch (e) { try { refSpace = await session.requestReferenceSpace('viewer'); } catch (e2) { refSpace = null; } }
  }

  await check('session', 's.glframe', null, async function () {
    if (!glLayer || !gl) return { status: 'skip', value: 'no XRWebGLLayer' };
    var frame = await nextFrame(session, Math.min(4000, Math.max(1000, timeLeft())));
    var pose = refSpace ? frame.getViewerPose(refSpace) : null;
    if (!pose) return { status: 'fail', value: 'no viewer pose on first frame' };
    gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
    gl.clearColor(0.04, 0.08, 0.13, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var vps = [];
    for (var v = 0; v < pose.views.length; v++) {
      var vp = glLayer.getViewport(pose.views[v]);
      gl.viewport(vp.x, vp.y, vp.width, vp.height);
      vps.push(pose.views[v].eye + ' ' + vp.width + '×' + vp.height);
    }
    record('session', 's.views', null, 'pass',
      pose.views.length + ' view(s): ' + vps.join(', '));
    return { status: 'pass', value: 'rendered a cleared frame in stereo' };
  });

  if (results['s.views'].status === 'pend') {
    skip('session', 's.views', null, 'no frame rendered');
  }

  /* --- Hands and input sources: poll frames until the budget runs out. --- */
  await check('caps', 'c.hands', null, async function () {
    var deadline = Date.now() + Math.min(HAND_POLL_MS, Math.max(500, timeLeft() - 1000));
    var best = null, seen = {};
    while (Date.now() < deadline) {
      var frame;
      try { frame = await nextFrame(session, 1000); }
      catch (e) { break; }
      var sources = session.inputSources || [];
      for (var i = 0; i < sources.length; i++) {
        var src = sources[i];
        var desc = (src.handedness || '?') + ' ' + (src.targetRayMode || '?') +
                   (src.profiles && src.profiles.length ? ' [' + src.profiles.join(', ') + ']' : '');
        seen[desc] = true;
        if (src.hand) {
          var count = src.hand.size;
          if (typeof count !== 'number') {
            // XRHand is Map-like; if .size is missing, count the iterable.
            count = 0;
            try { src.hand.forEach(function () { count++; }); } catch (e2) { count = -1; }
          }
          var jointNames = [];
          try {
            src.hand.forEach(function (joint, name) { jointNames.push(String(name)); });
          } catch (e3) { /* ignore */ }
          // Sample one joint to prove poses actually resolve, not just that the
          // XRHand object exists.
          var posed = 'unknown';
          try {
            var wrist = src.hand.get('wrist');
            var jp = (wrist && refSpace) ? frame.getJointPose(wrist, refSpace) : null;
            posed = jp ? ('wrist radius ' + jp.radius.toFixed(4) + 'm') : 'no wrist joint pose';
          } catch (e4) { posed = 'getJointPose threw: ' + errText(e4); }
          best = {
            status: 'pass',
            value: src.handedness + ' hand, ' + count + ' joints, ' + posed,
            block: jointNames.sort().join('\n')
          };
        }
      }
      if (best) break;
    }
    record('caps', 'c.inputs', null, Object.keys(seen).length ? 'info' : 'absent',
      Object.keys(seen).length ? Object.keys(seen).join(' | ') : 'no input sources reported');
    if (best) return best;
    return { status: 'absent',
             value: 'no inputSource.hand seen in ' + Math.round(HAND_POLL_MS / 1000) +
                    's — hand tracking off, or hands were not in view' };
  });
}

/* ------------------------------------------------------------------ *
 * Session lifecycle
 * ------------------------------------------------------------------ */

var activeSession = null;

async function enterXR() {
  if (activeSession) return;
  if (!navigator.xr) { setStatus('No navigator.xr on this browser.', 'bad'); return; }
  btnXR.disabled = true;
  setStatus('Requesting immersive-vr session…', 'busy');

  var session;
  try {
    // requestSession must be reached from the click without an intervening await,
    // or the user-activation is consumed and the request is rejected.
    session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'unbounded', 'hand-tracking', 'layers']
    });
  } catch (e) {
    record('session', 's.session', null, 'error', errText(e));
    setStatus('Session request failed: ' + errText(e), 'bad');
    btnXR.disabled = false;
    return;
  }

  activeSession = session;
  var finished = false;
  var finish = function (why) {
    if (finished) return;
    finished = true;
    activeSession = null;
    btnXR.disabled = false;
    setStatus('In-session checks complete (' + why + '). Table filled in below — ' +
              'use "Copy as markdown" to paste into docs/capability-matrix.md.');
    scheduleRender();
  };
  session.addEventListener('end', function () { finish('session ended'); });

  // Watchdog: whatever happens, we are not leaving anyone stuck in a black void.
  var watchdog = setTimeout(function () {
    try { session.end(); } catch (e) { /* already gone */ }
  }, SESSION_BUDGET_MS + 3000);

  setStatus('In VR — running in-session checks. Hold your hands up in front of you. ' +
            'This exits automatically.', 'busy');

  try {
    await runSessionChecks(session);
  } catch (e) {
    // Should be unreachable: every check is individually wrapped. Belt and braces.
    record('session', 's.session', null, 'error', 'session run aborted: ' + errText(e));
  } finally {
    clearTimeout(watchdog);
    try { await session.end(); } catch (e) { /* already ended */ }
    finish('done');
  }
}

/* ------------------------------------------------------------------ *
 * Markdown export
 * ------------------------------------------------------------------ */

function mdEscape(s) {
  return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * The one-line answer the parent issue asks for: which backend should the app
 * default to inside immersive sessions? Derived, not guessed.
 */
function recommendation() {
  var frame = results['s.gpuframe'], layer = results['s.gpulayer'], bind = results['s.binding'];
  if (frame.status === 'pass') {
    return 'WebGPU works inside an immersive session on this device — a WebGPU projection ' +
           'layer rendered a frame. Default to the WebGPU backend in immersive sessions.';
  }
  if (bind.status === 'pend') {
    return 'Not determined — the in-session checks have not been run on this device yet.';
  }
  if (bind.status === 'absent' || layer.status === 'absent') {
    return 'XRGPUBinding is absent, so there is no WebGPU path to the stereo swapchain. ' +
           'Default to WebGL2 (XRWebGLLayer) in immersive sessions — this is the shipping ' +
           'path, not temporary scaffolding. navigator.gpu on the 2D page does not change this.';
  }
  return 'XRGPUBinding exists but did not produce a frame (see the s.gpulayer / s.gpuframe rows). ' +
         'Default to WebGL2 (XRWebGLLayer) in immersive sessions until that is resolved.';
}

function toMarkdown() {
  var now = new Date();
  var date = now.toISOString().slice(0, 10);
  var lines = [];
  lines.push('### Carve capability probe — ' + date);
  lines.push('');
  lines.push('- **Run at:** ' + now.toISOString());
  lines.push('- **Browser:** ' + results['browser'].value);
  lines.push('- **User agent:** `' + results['ua'].value + '`');
  lines.push('- **Horizon OS:** _fill in from Settings › System › Software Update_');
  lines.push('- **Recommendation:** ' + recommendation());
  lines.push('');
  lines.push('| Check | Result | Value |');
  lines.push('|---|---|---|');

  var blocks = [];
  for (var g = 0; g < GROUPS.length; g++) {
    var group = GROUPS[g];
    lines.push('| **' + group.title + '** | | |');
    for (var i = 0; i < order.length; i++) {
      var key = order[i], row = results[key];
      if (row.group !== group.id) continue;
      var s = STATUS[row.status] || STATUS.info;
      lines.push('| ' + mdEscape(row.label) + ' | ' + s.glyph + ' ' + s.word + ' | ' +
                 (row.value ? '`' + mdEscape(row.value) + '`' : '') + ' |');
      if (row.block) blocks.push({ label: row.label, block: row.block });
    }
  }

  if (blocks.length) {
    lines.push('');
    for (var b = 0; b < blocks.length; b++) {
      lines.push('<details><summary>' + blocks[b].label + '</summary>');
      lines.push('');
      lines.push('```');
      lines.push(blocks[b].block);
      lines.push('```');
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
  }
  return lines.join('\n');
}

async function copyMarkdown() {
  var md = toMarkdown();
  mdOut.value = md;
  mdPanel.classList.remove('hidden');
  try {
    // Clipboard writes are frequently blocked in the Quest browser; the textarea
    // below is the fallback you can always select by hand.
    await navigator.clipboard.writeText(md);
    setStatus('Markdown copied to the clipboard. It is also in the box below.');
  } catch (e) {
    mdOut.focus();
    try { mdOut.select(); } catch (e2) { /* ignore */ }
    setStatus('Clipboard blocked (' + errText(e) + ') — the markdown is selected in the box ' +
              'below; copy it manually.', 'bad');
  }
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

function boot() {
  tbody    = document.getElementById('tbody');
  statusEl = document.getElementById('status');
  btnXR    = document.getElementById('btnXR');
  btnRerun = document.getElementById('btnRerun');
  btnCopy  = document.getElementById('btnCopy');
  btnShow  = document.getElementById('btnShow');
  mdPanel  = document.getElementById('mdPanel');
  mdOut    = document.getElementById('mdOut');

  render();

  btnXR.addEventListener('click', function () { enterXR(); });
  btnRerun.addEventListener('click', function () {
    runOutsideChecks().catch(function (e) { setStatus('Probe error: ' + errText(e), 'bad'); });
  });
  btnCopy.addEventListener('click', function () { copyMarkdown(); });
  btnShow.addEventListener('click', function () {
    if (mdPanel.classList.contains('hidden')) {
      mdOut.value = toMarkdown();
      mdPanel.classList.remove('hidden');
      btnShow.textContent = 'Hide markdown';
    } else {
      mdPanel.classList.add('hidden');
      btnShow.textContent = 'Show markdown';
    }
  });

  // A browser with neither WebGPU nor WebXR must land on a legible page, not a
  // stack trace: runOutsideChecks handles absence, and this catches anything else.
  runOutsideChecks().catch(function (e) {
    setStatus('Probe error: ' + errText(e), 'bad');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
