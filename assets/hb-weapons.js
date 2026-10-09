/* hb-weapons.js: throwables (molotov/grenade/C4/brick), GTA-SA style weapon wheel (hold Tab), top-right HUD.
   Classic script, loaded in <head>. Needs window.__hbCtx (game) and window.__hbWeapons (actors chunk). */
(function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, '') : './assets/';
  var T = null; // three.js module (same instance as the game)
  import(BASE + 'three-DoD3b_mB.js').then(function (m) { T = m; }).catch(function (e) { console.warn('[hb-weapons] three', e); });
  var C = function () { return window.__hbCtx; };
  var OD = function () { return (window.__hbWeapons && window.__hbWeapons.Od) || {}; };
  var now = function () { return performance.now() / 1000; };
  var rnd = Math.random;

  /* ===================================================== icons (silhouettes) ===================================================== */
  var I = {
    fists: '<rect x="30" y="16" width="38" height="22" rx="8"/><rect x="26" y="20" width="10" height="14" rx="4"/><path d="M38 16v-5a3 3 0 0 1 6 0v5M46 16v-6a3 3 0 0 1 6 0v6M54 16v-5a3 3 0 0 1 6 0v5"/>',
    knuckles: '<circle cx="30" cy="25" r="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="45" cy="25" r="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="60" cy="25" r="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="75" cy="25" r="8" fill="none" stroke="currentColor" stroke-width="4"/><rect x="24" y="32" width="58" height="5"/>',
    knife: '<path d="M14 30 L66 18 Q72 20 70 26 L24 36Z"/><rect x="66" y="22" width="22" height="9" rx="3" transform="rotate(-12 77 26)"/>',
    machete: '<path d="M10 33 L70 14 Q76 14 74 20 L72 24 L16 38Z"/><rect x="72" y="18" width="20" height="9" rx="3" transform="rotate(-14 82 22)"/>',
    crowbar: '<path d="M12 40 L70 14 Q80 8 88 14 L84 20 Q80 18 76 22 L18 46Z"/>',
    golf: '<rect x="10" y="22" width="68" height="3" rx="1.5" transform="rotate(-8 44 24)"/><path d="M74 14 L90 12 L92 20 L78 24Z"/>',
    bat: '<path d="M8 30 L60 22 Q86 18 90 22 Q92 26 88 28 Q70 34 8 34Z"/>',
    baseball: '<path d="M6 28 L56 22 Q84 17 92 21 Q95 26 90 29 Q70 34 6 33Z"/>',
    pistol: '<rect x="22" y="14" width="58" height="12" rx="2"/><path d="M26 26 L44 26 L40 46 L28 46Z"/><rect x="44" y="26" width="12" height="3"/>',
    revolver: '<rect x="20" y="14" width="64" height="8" rx="2"/><circle cx="36" cy="22" r="9"/><path d="M20 22 L42 22 L36 46 L22 46Z"/><rect x="82" y="12" width="4" height="4"/>',
    micro: '<rect x="22" y="14" width="56" height="14" rx="2"/><rect x="78" y="17" width="12" height="5"/><rect x="42" y="28" width="10" height="20" rx="1"/><path d="M26 28 L36 28 L32 44 L24 44Z"/>',
    sawnoff: '<rect x="30" y="14" width="60" height="5" rx="2"/><rect x="30" y="21" width="60" height="5" rx="2"/><path d="M14 22 L34 16 L34 28 L24 40 L10 40Z"/>',
    smg: '<rect x="16" y="14" width="66" height="13" rx="2"/><rect x="82" y="17" width="10" height="5"/><rect x="40" y="27" width="9" height="20"/><path d="M22 27 L32 27 L29 42 L20 42Z"/><rect x="4" y="16" width="14" height="4"/>',
    ak: '<rect x="30" y="16" width="44" height="9" rx="2"/><rect x="74" y="18" width="20" height="4"/><path d="M4 18 L30 16 L30 30 L8 32Z"/><path d="M46 25 L58 25 Q62 36 54 46 L46 44Q50 36 46 25Z"/><path d="M34 25 L40 25 L38 36 L32 36Z"/>',
    sniper: '<rect x="28" y="22" width="64" height="5" rx="2"/><rect x="40" y="10" width="30" height="7" rx="3"/><rect x="48" y="17" width="3" height="5"/><rect x="58" y="17" width="3" height="5"/><path d="M4 22 L30 20 L30 34 L8 36Z"/><rect x="40" y="27" width="9" height="12"/>',
    molotov: '<path d="M44 20 L56 20 L56 30 Q66 34 66 46 L34 46 Q34 34 44 30Z"/><path d="M50 4 Q58 12 52 18 Q46 12 50 4Z" fill="#ff7a1a"/><rect x="46" y="16" width="8" height="6"/>',
    grenade: '<ellipse cx="50" cy="31" rx="17" ry="18"/><rect x="43" y="8" width="14" height="8"/><path d="M57 10 L78 14 L76 19 L56 15Z"/><circle cx="74" cy="24" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>',
    c4: '<rect x="20" y="16" width="60" height="26" rx="3"/><rect x="34" y="8" width="22" height="9"/><circle cx="66" cy="12" r="3" fill="#ff3b2a"/><path d="M26 16 v26M74 16 v26" stroke="#000" stroke-opacity=".35" stroke-width="3"/>',
    brick: '<rect x="18" y="14" width="64" height="26" rx="2"/><rect x="26" y="20" width="14" height="6" fill="#000" fill-opacity=".25"/>'
  };
  function icon(id) { return '<svg viewBox="0 0 100 50" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' + (I[id] || I.fists) + '</svg>'; }
  window.__hbWeapons = window.__hbWeapons || {};
  window.__hbWeapons.icon = icon;

  /* ===================================================== throwables ===================================================== */
  var WH = window.__hbWH = {};
  var pending = null, projs = [], fires = [], charges = [], lastT = 0, V3 = null;
  var hit = null, dhit = null, seg = null;

  function ensure() {
    if (!T || V3) return !!T;
    V3 = T.ar;
    return true;
  }
  function mkHit() { return { distance: 0, point: new V3(), normal: new V3(), tag: '', body: null }; }

  /* three.js alias map from handoff: Mesh=Dt, BoxGeometry=h, SphereGeometry=Rn, MeshLambertMaterial=At, Vector3=ar, Group=X, PointLight=Gt */
  function K() { return { Mesh: T.Dt, Box: T.h, Sph: T.Rn, Lam: T.At, V3: T.ar, Group: T.X }; }

  function buildMesh(id) {
    var k = K(), g = new k.Group();
    function add(geo, col, x, y, z) { var m = new k.Mesh(geo, new k.Lam({ color: col })); m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; }
    if (id === 'molotov') { add(new k.Box(.07, .07, .2), 0x2b7a38); add(new k.Box(.03, .03, .1), 0xe9e3cf, 0, 0, -.15); add(new k.Sph(.035, 6, 6), 0xff8f1f, 0, 0, -.22); }
    else if (id === 'grenade') { add(new k.Sph(.065, 10, 8), 0x4c5b2d); add(new k.Box(.03, .03, .05), 0x9aa0a6, 0, .07, 0); }
    else if (id === 'c4') { add(new k.Box(.2, .06, .13), 0xcbb98a); add(new k.Box(.05, .03, .05), 0xff2a1a, .05, .045, 0); }
    else { add(new k.Box(.2, .07, .1), 0xa3472f); }
    return g;
  }

  function rig(p) { // hand position
    var v = new V3();
    try { var b = p.model.rig.bones[18]; b.getWorldPosition(v); if (!isFinite(v.x) || v.distanceToSquared(p.position) > 9) throw 0; } catch (e) { v.set(p.position.x + Math.sin(p.heading) * .4, p.position.y + 1.35, p.position.z - Math.cos(p.heading) * .4); }
    return v;
  }

  WH.melee = function (c) {
    var p = c.p, id = p.wid, d = OD()[id];
    if (!d || !d.thrown) return false;
    if (!ensure()) return true;
    if (id === 'c4' && (p.ammo.c4 || 0) <= 0) { detonate(); return true; }
    if ((p.ammo[id] || 0) <= 0) { return true; }
    if (pending || now() < (c.__tcool || 0)) return true;
    c.__tcool = now() + .6;
    pending = { id: id, t: now() };
    p.anim.play('batFore'); c.swingKind = 'batFore'; c.comboWindow = .5;
    try { C().audio.play('punch_whoosh', { x: p.position.x, y: p.position.y + 1.2, z: p.position.z, rate: .9, volume: .6 }); } catch (e) { }
    setTimeout(function () { if (pending) launch(c); }, 420);
    return true;
  };
  WH.hit = function (c, e) {
    var d = OD()[c.p.wid];
    if (!d || !d.thrown) return false;
    if (pending) launch(c);
    return true;
  };

  function launch(c) {
    var p = c.p, ctx = C(), id = pending && pending.id; pending = null;
    if (!id || (p.ammo[id] || 0) <= 0 || !ensure()) return;
    var o = rig(p); wlog('launch', o.x, o.y, o.z);
    try { c.computeAim(false); } catch (e) { }
    var dir = new V3().subVectors(c.aimPoint, o);
    if (dir.lengthSq() < 1) dir.set(Math.sin(p.heading), .2, -Math.cos(p.heading));
    var dist = dir.length(); if (!isFinite(dist)) { dir.set(Math.sin(p.heading), .2, -Math.cos(p.heading)); dist = 12; } dir.normalize();
    var sp = id === 'brick' ? 18 : id === 'c4' ? 9 : 15;
    sp = Math.min(sp, Math.max(id === 'brick' ? 12 : 11, dist * 1.4));
    var v = dir.clone().multiplyScalar(sp); v.y += id === 'c4' ? 2 : 3.2;
    var mesh = buildMesh(id); mesh.position.copy(o); ctx.scene.add(mesh);
    projs.push({ id: id, pos: o.clone(), vel: v, mesh: mesh, fuse: id === 'grenade' ? 2.2 : 99, age: 0, stuck: false, bounces: 0 });
    p.ammo[id]--;
    if (id === 'c4') { /* keep owning even at 0: needed for detonate */ }
    else if (p.ammo[id] <= 0) {
      var ow = c.owned, ix = ow.indexOf(id); if (ix >= 0) ow.splice(ix, 1);
      p.switchWeapon('fists');
    }
    try { ctx.events.emit('player:weapon', { weapon: p.wid, ammo: p.ammo[p.wid] }); } catch (e) { }
    if (id !== 'brick') crime(p.position, 2);
    if (!lastT) { lastT = now(); loop(); }
  }

  function crime(pos, sev) {
    try { var ctx = C(); ctx.events.emit('crime', { type: 'shooting', pos: pos.clone ? pos.clone() : pos, severity: sev }); } catch (e) { }
  }

  function bodiesNear(x, z, r) { var arr = [], n = C().dynamics.query(x, z, r, arr); return arr.slice(0, n); }

  function explode(x, y, z, R, scale, selfDmg) {
    var ctx = C(), p = ctx.player;
    try { ctx.vehicles._fx.explosion(x, y, z, scale, 3355443); } catch (e) { console.warn('[hb] fx', e); } wlog('explode', x, y, z);
    try { ctx.audio.play('explosion', { x: x, y: y + 1, z: z }); } catch (e) { }
    try { ctx.peds.panic(x, z, 45); ctx.traffic.panic(x, z, 45); } catch (e) { }
    var bs = bodiesNear(x, z, R);
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i]; if (!b.active) continue;
      var dx = b.x - x, dz = b.z - z, d = Math.hypot(dx, dz), f = 1 - Math.min(1, d / R);
      if (f <= 0) continue;
      var dirv = new V3(dx / (d || 1), .35, dz / (d || 1)).normalize();
      if (b === p.body) {
        try { p.damage({ amount: Math.round(12 + 70 * f * f), source: 'explosion', dir: dirv }); } catch (e) { }
        continue;
      }
      var amt = 40 + 260 * f * f;
      try { p.combat.applyDamage(b, amt, new V3(b.x, b.y + 1, b.z), dirv, 'bat', 0); b.onImpact && b.owner !== 'vehicles' && b.onImpact(dirv.x * 900 * f * Math.min(4, (b.mass || 80) / 80), dirv.z * 900 * f * Math.min(4, (b.mass || 80) / 80), p.body); } catch (e) { }
    }
    try { var dd = Math.hypot(p.position.x - x, p.position.z - z); ctx.cameraRig.shake(Math.max(.1, Math.min(1, 1.2 - dd / 50))); ctx.input.rumble(Math.max(0, Math.min(1, 1 - dd / 45)), 350); } catch (e) { }
    try { var pl = ctx.police; if ((pl.level || 0) < 2) pl.setLevel(2); } catch (e) { }
    crime(new V3(x, y, z), 3);
  }

  function wlog(k, x, y, z) { (WH.log = WH.log || []).push([k, +now().toFixed(2), +x.toFixed(1), +y.toFixed(1), +z.toFixed(1)]); if (WH.log.length > 40) WH.log.shift(); }
  function ignite(x, y, z) {
    wlog('ignite', x, y, z);
    fires.push({ x: x, y: y, z: z, r: 2.8, t: 9, tick: 0 });
    crime(new V3(x, y, z), 2);
    try { C().audio.play('explosion', { x: x, y: y + 1, z: z, volume: .35, rate: 1.6 }); } catch (e) { }
    try { var pl = C().police; if ((pl.level || 0) < 1) pl.setLevel(1); } catch (e) { }
  }

  function detonate() {
    if (!charges.length) return;
    var cs = charges.splice(0);
    for (var i = 0; i < cs.length; i++) { try { cs[i].mesh.removeFromParent(); } catch (e) { } explode(cs[i].pos.x, cs[i].pos.y, cs[i].pos.z, 11, 1.25); }
    var p = C().player, c = p.combat;
    if ((p.ammo.c4 || 0) <= 0) { var ix = c.owned.indexOf('c4'); if (ix >= 0) c.owned.splice(ix, 1); if (p.wid === 'c4') p.switchWeapon('fists'); }
  }
  window.__hbDetonate = detonate;

  function projStep(q, dt) {
    var ctx = C(), p = ctx.player, plan = ctx.plan;
    q.age += dt;
    if (q.stuck) { return; }
    q.vel.y -= 18 * dt;
    var from = q.pos.clone(), mv = q.vel.clone().multiplyScalar(dt), len = mv.length();
    if (len < 1e-5) return;
    var dir = mv.clone().divideScalar(len);
    // bodies
    var hb = null; dhit = dhit || mkHit();
    try { hb = ctx.dynamics.raycast(from, dir, len + .1, p.body, dhit); } catch (e) { }
    if (hb && q.age > .05) {
      q.pos.copy(dhit.point);
      if (q.id === 'brick') { try { p.combat.applyDamage(hb, 22, dhit.point, dir, 'bat', 80); } catch (e) { } }
      impact(q, dhit.normal, true);
      return;
    }
    hit = hit || mkHit();
    var sh = null;
    try { sh = ctx.statics.raycast(from, dir, len + .05, hit); } catch (e) { }
    var np = from.clone().add(mv), gh = -1e9;
    try { gh = plan.groundHeight(np.x, np.z); } catch (e) { }
    var n = null;
    if (sh) { np.copy(hit.point).addScaledVector(dir, -.03); n = hit.normal.clone(); if (n.lengthSq() < .1) n.set(0, 1, 0); }
    else if (np.y < gh + .06) { np.y = gh + .06; n = new V3(0, 1, 0); }
    q.pos.copy(np);
    if (n) {
      if (q.id === 'grenade') {
        var vn = q.vel.dot(n); q.vel.addScaledVector(n, -1.55 * vn).multiplyScalar(.7); q.bounces++;
        if (q.vel.length() < 1.2) q.vel.set(0, 0, 0);
      } else impact(q, n, false);
    }
  }

  function impact(q, n, onBody) {
    var ctx = C();
    if (q.id === 'molotov') { ignite(q.pos.x, q.pos.y, q.pos.z); kill(q); }
    else if (q.id === 'brick') { try { ctx.audio.play('bullet_impact', { x: q.pos.x, y: q.pos.y, z: q.pos.z, volume: .6, rate: .7 }); } catch (e) { } kill(q); }
    else if (q.id === 'c4') {
      q.stuck = true; q.vel.set(0, 0, 0);
      if (n) q.mesh.lookAt(q.pos.x + n.x, q.pos.y + n.y, q.pos.z + n.z);
      charges.push({ pos: q.pos.clone(), mesh: q.mesh }); q.keep = true;
      var ix = projs.indexOf(q); if (ix >= 0) projs.splice(ix, 1);
    } else if (q.id === 'grenade') { q.vel.set(0, 0, 0); }
  }
  function kill(q) { try { q.mesh.removeFromParent(); } catch (e) { } var ix = projs.indexOf(q); if (ix >= 0) projs.splice(ix, 1); }

  function fireStep(f, dt) {
    var ctx = C(), fx;
    try { fx = ctx.vehicles._fx; } catch (e) { return; } if (!fx) return;
    f.t -= dt; f.tick -= dt;
    var n = Math.ceil(dt * 60 * (f.t > 1 ? 1 : f.t) * 2.2);
    for (var i = 0; i < Math.min(n, 12); i++) {
      var a = rnd() * 6.283, rr = Math.sqrt(rnd()) * f.r;
      try {
        fx.glowParticle(0, f.x + Math.cos(a) * rr, f.y + .15, f.z + Math.sin(a) * rr, (rnd() - .5) * .6, 1.4 + rnd() * 2.2, (rnd() - .5) * .6, .5 + rnd() * .4, 1.0, .55 + rnd() * .5, 1, .42 + rnd() * .25, .08, .8);
        if (rnd() < .25) fx.smokePuff(f.x + Math.cos(a) * rr, f.y + 1, f.z + Math.sin(a) * rr, 0, 1.5, 0, 1.5, 4, 2.4, .1, .1, .1, .55);
      } catch (e) { }
    }
    if (f.tick <= 0) {
      f.tick = .4;
      var p = ctx.player, bs = bodiesNear(f.x, f.z, f.r + 1);
      for (var j = 0; j < bs.length; j++) {
        var b = bs[j]; if (!b.active) continue;
        var d = Math.hypot(b.x - f.x, b.z - f.z); if (d > f.r + (b.radius || 0)) continue;
        if (b === p.body) { try { p.damage({ amount: 5, source: 'explosion', dir: new V3(0, 0, 0) }); } catch (e) { } continue; }
        try { p.combat.applyDamage(b, b.kind === 'vehicle' ? 6 : 9, new V3(b.x, b.y + 1, b.z), new V3(b.x - f.x, .2, b.z - f.z).normalize(), 'bat', 0); } catch (e) { }
      }
    }
  }

  function loop() {
    var ctx = C(), t = now(), dt = Math.min(.05, t - lastT); lastT = t;
    if (ctx && !ctx.paused && ensure()) {
      dt *= (ctx.timeScale || 1);
      for (var i = projs.length - 1; i >= 0; i--) {
        var q = projs[i];
        try { projStep(q, dt); } catch (e) { console.warn('[hb] proj', e); kill(q); continue; }
        if (!projs.includes(q)) continue;
        q.mesh.position.copy(q.pos);
        if (!q.stuck) { q.mesh.rotation.x += dt * 9; q.mesh.rotation.z += dt * 5; }
        if (q.id === 'grenade') { q.fuse -= dt; if (q.fuse <= 0) { explode(q.pos.x, q.pos.y, q.pos.z, 9.5, 1.05); kill(q); } }
        else if (q.age > 12) kill(q);
      }
      for (var j = fires.length - 1; j >= 0; j--) { fireStep(fires[j], dt); if (fires[j].t <= 0) fires.splice(j, 1); }
    }
    if (projs.length || fires.length || charges.length) requestAnimationFrame(loop); else lastT = 0;
  }
  // charges exist => keep loop alive not needed; but also detonate on R when holding / owning C4
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyR' && charges.length && !e.repeat) { var ctx = C(); try { if (ctx && ctx.player.wid === 'c4') detonate(); } catch (x) { } }
  }, true);
  WH.state = function () { return { projs: projs.length, fires: fires.length, charges: charges.length }; };

  /* ===================================================== weapon wheel ===================================================== */
  var css = document.createElement('style');
  css.textContent = [
    '#hbwheel{position:fixed;inset:0;z-index:60;display:none;pointer-events:none;font-family:"Bahnschrift","DIN Condensed","Roboto Condensed","Arial Narrow",system-ui,sans-serif;color:#f4f1ea}',
    '#hbwheel.on{display:block}',
    '#hbwheel .dim{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,.15) 0,rgba(0,0,0,.62) 70%)}',
    '#hbwheel .ring{position:absolute;left:50%;top:50%;width:0;height:0}',
    '#hbwheel .slot{position:absolute;width:96px;height:62px;margin:-31px 0 0 -48px;border-radius:10px;background:rgba(14,15,19,.82);border:2px solid rgba(255,255,255,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:transform .08s,border-color .08s,background .08s}',
    '#hbwheel .slot svg{width:66px;height:32px;color:#d8d5cc}',
    '#hbwheel .slot b{font-size:10px;white-space:nowrap;letter-spacing:.12em;text-transform:uppercase;color:#bdb9ae;margin-top:2px;font-weight:700}',
    '#hbwheel .slot i{position:absolute;right:6px;top:3px;font-style:normal;font-size:11px;color:#ffb27a}',
    '#hbwheel .slot.cur{border-color:#ff4d00}',
    '#hbwheel .slot.sel{transform:scale(1.22);border-color:#fff;background:rgba(255,77,0,.82)}',
    '#hbwheel .slot.sel svg,#hbwheel .slot.sel b{color:#fff}',
    '#hbwheel .centre{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;width:230px}',
    '#hbwheel .centre h2{margin:0;font-size:30px;letter-spacing:.08em;text-transform:uppercase}',
    '#hbwheel .centre p{margin:4px 0 0;font-size:13px;color:#cfcabf;letter-spacing:.04em}',
    '#hbwheel .centre small{display:block;margin-top:6px;font-size:12px;color:#ff9a60;letter-spacing:.14em}',
    '#hbwheel .dot{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px;border-radius:50%;background:#ff4d00;box-shadow:0 0 0 2px #000}',
    /* top-right HUD */
    '.hud-tr{min-width:230px;padding:9px 14px 11px 18px;border-radius:8px 0 0 8px;background:linear-gradient(90deg,rgba(10,11,14,0),rgba(10,11,14,.78) 35%);border-right:3px solid #ff4d00;font-family:"Bahnschrift","DIN Condensed","Roboto Condensed","Arial Narrow",system-ui,sans-serif;gap:.25em !important}',
    '.hud-tr .tr-clock{order:1;letter-spacing:.06em}',
    '.hud-tr .tr-money{order:2}',
    '.hud-tr .tr-deltas{order:3}',
    '.hud-tr .hb-bars{order:4}',
    '.hud-tr .tr-wanted{order:5}',
    '.hud-tr .hb-wpn{order:6}',
    '.hud-tr .tr-weapon{display:none !important}',
    '.hb-bars{display:flex;flex-direction:column;gap:5px;align-items:flex-end;width:210px;margin-top:3px}',
    '.hb-bar{display:flex;align-items:center;gap:7px;width:100%}',
    '.hb-bar span{font-size:11px;letter-spacing:.14em;color:#c9c5ba;width:20px;text-align:left;font-weight:700}',
    '.hb-bar .t{flex:1;height:9px;background:rgba(255,255,255,.14);border-radius:2px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)}',
    '.hb-bar .t i{display:block;height:100%;width:100%;transform-origin:0 50%;transition:transform .15s}',
    '.hb-bar.hp .t i{background:linear-gradient(90deg,#2fbf5b,#8be36a)}',
    '.hb-bar.hp.low .t i{background:linear-gradient(90deg,#d6261c,#ff6a4a);animation:hbp .7s infinite alternate}',
    '.hb-bar.ar .t i{background:linear-gradient(90deg,#4f86c6,#9fc4ee)}',
    '.hb-bar em{font-style:normal;font-size:12px;width:26px;text-align:right;color:#f4f1ea;font-variant-numeric:tabular-nums}',
    '@keyframes hbp{to{opacity:.55}}',
    '.hb-wpn{display:flex;align-items:center;gap:9px;margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,.16);width:210px;justify-content:flex-end;cursor:pointer;pointer-events:auto}',
    '.hb-wpn svg{width:52px;height:26px;color:#f4f1ea}',
    '.hb-wpn .tx{display:flex;flex-direction:column;align-items:flex-end;line-height:1.05}',
    '.hb-wpn .nm{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c9c5ba;font-weight:700}',
    '.hb-wpn .am{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums}',
    '.hb-wpn .am small{font-size:12px;color:#a9a59a;font-weight:600}',
    '.hb-wpn.rl .am{color:#ffb27a}'
  ].join('\n');
  document.head.appendChild(css);

  var wheel, ring, centreH, centreP, centreS, dotEl, slots = [], wOpen = false, wSticky = false, vx = 0, vy = 0, sel = -1, list = [], holdT = null, tabDown = false, tabT0 = 0, savedTS = 1;

  function mkWheel() {
    wheel = document.createElement('div'); wheel.id = 'hbwheel';
    wheel.innerHTML = '<div class="dim"></div><div class="ring"></div><div class="centre"><h2></h2><p></p><small></small></div><div class="dot"></div>';
    document.body.appendChild(wheel);
    ring = wheel.querySelector('.ring'); centreH = wheel.querySelector('h2'); centreP = wheel.querySelector('p'); centreS = wheel.querySelector('small'); dotEl = wheel.querySelector('.dot');
  }
  function ammoText(id) {
    var p = C().player, d = OD()[id]; if (!d) return '';
    if (d.thrown) return '×' + (p.ammo[id] || 0);
    if (d.melee) return '';
    return (p.combat.mag[id] || 0) + '/' + (p.ammo[id] || 0);
  }
  function openWheel(sticky) {
    var ctx = C(); if (!ctx || wOpen) return;
    var p = ctx.player; if (!p || p.st !== 'foot' || p.combat.owned.length < 2) return;
    if (!wheel) mkWheel();
    list = p.combat.owned.slice(); var N = list.length;
    ring.innerHTML = ''; slots = [];
    var Rx = Math.min(430, innerWidth * .43), Ry = Math.min(285, innerHeight * .39), per = 2 * Math.PI * Math.sqrt((Rx * Rx + Ry * Ry) / 2) / N, sc = Math.min(1, per / 104, Rx / 330); ring.style.transform = 'scale(' + sc.toFixed(3) + ')'; Rx /= sc; Ry /= sc;
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + i / N * Math.PI * 2, id = list[i], d = OD()[id] || {};
      var el = document.createElement('div'); el.className = 'slot' + (id === p.wid ? ' cur' : '');
      el.style.left = Math.cos(a) * Rx + 'px'; el.style.top = Math.sin(a) * Ry + 'px';
      el.innerHTML = icon(id) + '<b>' + ((d.name && d.name.en) || id) + '</b><i>' + ammoText(id) + '</i>';
      (function (ix) { el.addEventListener('click', function (ev) { if (wSticky) { sel = ix; closeWheel(true); ev.stopPropagation(); } }); })(i);
      ring.appendChild(el); slots.push({ el: el, a: a });
    }
    sel = list.indexOf(p.wid); vx = vy = 0; wSticky = !!sticky; wOpen = true; wheel.classList.add('on'); wheel.style.pointerEvents = sticky ? 'auto' : 'none';
    setSel(sel);
    try { savedTS = ctx.timeScale || 1; ctx.timeScale = .2; } catch (e) { }
    if (sticky && document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { }
  }
  function setSel(ix) {
    sel = ix;
    for (var i = 0; i < slots.length; i++) slots[i].el.classList.toggle('sel', i === ix);
    var id = list[ix], d = OD()[id]; if (!d) return;
    centreH.textContent = (d.name && d.name.en) || id; centreP.textContent = d.note || ''; centreS.textContent = ammoText(id) ? 'AMMO ' + ammoText(id) : '';
  }
  function updateSel() {
    var N = slots.length; if (!N) return;
    var m = Math.hypot(vx, vy); if (m < 28) { dotEl.style.transform = 'translate(' + vx + 'px,' + vy + 'px)'; return; }
    var a = Math.atan2(vy, vx), best = 0, bd = 9;
    for (var i = 0; i < N; i++) { var dd = Math.abs(Math.atan2(Math.sin(a - slots[i].a), Math.cos(a - slots[i].a))); if (dd < bd) { bd = dd; best = i; } }
    if (best !== sel) setSel(best);
    dotEl.style.transform = 'translate(' + vx + 'px,' + vy + 'px)';
  }
  function closeWheel(apply) {
    if (!wOpen) return; wOpen = false; wSticky = false; wheel.classList.remove('on'); wheel.style.pointerEvents = 'none';
    var ctx = C(); try { ctx.timeScale = savedTS || 1; } catch (e) { }
    if (apply && sel >= 0 && list[sel]) { try { ctx.player.switchWeapon(list[sel]); } catch (e) { } }
  }
  window.__hbWheel = { open: openWheel, close: closeWheel, isOpen: function () { return wOpen; } };

  window.addEventListener('keydown', function (e) {
    if (e.code !== 'Tab') return;
    var ctx = C(); if (!ctx || !ctx.player || !document.getElementById('hbwheel') && !ctx.player.combat) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat || tabDown) return;
    tabDown = true; tabT0 = now();
    clearTimeout(holdT); holdT = setTimeout(function () { if (tabDown) openWheel(false); }, 220);
  }, true);
  window.addEventListener('keyup', function (e) {
    if (e.code !== 'Tab') return;
    var ctx = C(); e.preventDefault(); e.stopImmediatePropagation();
    if (!tabDown) return; tabDown = false; clearTimeout(holdT);
    if (wOpen) closeWheel(true);
    else if (now() - tabT0 < .45) { try { var p = ctx.player; if (p.st === 'foot' || p.st === 'climb') p.combat.cycle(1); } catch (x) { } }
  }, true);
  window.addEventListener('blur', function () { tabDown = false; if (wOpen) closeWheel(false); });
  ['mousemove', 'pointermove'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!wOpen) return;
      e.stopImmediatePropagation();
      if (ev !== 'mousemove') return;
      if (document.pointerLockElement) { vx += e.movementX; vy += e.movementY; var m = Math.hypot(vx, vy), L = 170; if (m > L) { vx *= L / m; vy *= L / m; } }
      else { vx = e.clientX - innerWidth / 2; vy = (e.clientY - innerHeight / 2); var m2 = Math.hypot(vx, vy); if (m2 > 170) { vx *= 170 / m2; vy *= 170 / m2; } }
      updateSel();
    }, true);
  });
  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'wheel', 'click', 'touchstart', 'touchend', 'contextmenu'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!wOpen) return;
      if (wSticky && (ev === 'click')) { if (e.target && e.target.closest && e.target.closest('.slot')) return; closeWheel(false); e.stopImmediatePropagation(); return; }
      if (wSticky && e.target && e.target.closest && e.target.closest('.slot')) return;
      if (ev === 'mousedown' && !wSticky) { closeWheel(true); }
      e.stopImmediatePropagation(); e.preventDefault();
    }, true);
  });

  /* ===================================================== top-right HUD ===================================================== */
  var hudInit = false, hpEl, hpI, hpN, arEl, arI, arN, wpEl, wpIc, wpNm, wpAm, lastId = '', lastTxt = '';
  function initHud() {
    var tr = document.querySelector('.hud-tr'); if (!tr) return false;
    var bars = document.createElement('div'); bars.className = 'hb-bars';
    bars.innerHTML = '<div class="hb-bar hp"><span>HP</span><div class="t"><i></i></div><em>100</em></div><div class="hb-bar ar"><span>AR</span><div class="t"><i></i></div><em>0</em></div>';
    tr.appendChild(bars);
    hpEl = bars.querySelector('.hp'); hpI = hpEl.querySelector('i'); hpN = hpEl.querySelector('em');
    arEl = bars.querySelector('.ar'); arI = arEl.querySelector('i'); arN = arEl.querySelector('em');
    wpEl = document.createElement('div'); wpEl.className = 'hb-wpn';
    wpEl.innerHTML = '<div class="tx"><span class="nm"></span><span class="am"></span></div><span class="ic"></span>';
    tr.appendChild(wpEl);
    wpIc = wpEl.querySelector('.ic'); wpNm = wpEl.querySelector('.nm'); wpAm = wpEl.querySelector('.am');
    wpEl.addEventListener('click', function (e) { e.stopPropagation(); if (wOpen) closeWheel(false); else openWheel(true); });
    wpEl.addEventListener('touchend', function (e) { e.preventDefault(); e.stopPropagation(); if (wOpen) closeWheel(false); else openWheel(true); }, { passive: false });
    return true;
  }
  function hudTick() {
    var ctx = C();
    if (ctx && ctx.player && ctx.player.combat) {
      if (!hudInit) hudInit = initHud();
      if (hudInit) {
        var p = ctx.player, hp = Math.max(0, p.health), mx = p.maxHealth || 100, ar = Math.max(0, p.armor || 0);
        hpI.style.transform = 'scaleX(' + Math.min(1, hp / mx).toFixed(3) + ')'; hpN.textContent = Math.round(hp); hpEl.classList.toggle('low', hp / mx < .3);
        arI.style.transform = 'scaleX(' + Math.min(1, ar / 100).toFixed(3) + ')'; arN.textContent = Math.round(ar);
        var id = p.wid, d = OD()[id] || {};
        if (id !== lastId) { lastId = id; wpIc.innerHTML = icon(id); wpNm.textContent = (d.name && d.name.en) || id; }
        var txt = '';
        if (d.thrown) txt = '×' + (p.ammo[id] || 0) + (id === 'c4' && charges.length ? ' <small>(' + charges.length + ' set)</small>' : '');
        else if (!d.melee) txt = (p.combat.mag[id] || 0) + ' <small>/ ' + (p.ammo[id] || 0) + '</small>';
        if (txt !== lastTxt) { lastTxt = txt; wpAm.innerHTML = txt; }
        wpEl.classList.toggle('rl', (p.reloading || 0) > 0);
        wpEl.style.display = (p.st === 'vehicle') ? 'none' : '';
      }
    }
    requestAnimationFrame(hudTick);
  }
  requestAnimationFrame(hudTick);
})();
