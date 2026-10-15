// SKC Earth Odyssey — original look development and experience bridge.
// The underlying journey is derived from oxomkbk/earth-migration (MIT).
import { earthPos } from '../beyond/story.js';
const small = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 700;
const query = new URLSearchParams(location.search);
let saved = {};
try { const value=JSON.parse(localStorage.getItem('skc-odyssey-settings') || '{}'); if(value&&typeof value==='object')saved=value; } catch {}
export const SKC_SETTINGS = {
  aurora: Number.isFinite(saved.aurora) ? Math.max(0, Math.min(1, saved.aurora)) : .72,
  palette: saved.palette === 'violet' ? 'violet' : 'emerald',
  grade: saved.grade === 'neutral' ? 'neutral' : 'cinematic',
  quality: ['low','medium','high'].includes(query.get('q')) ? query.get('q') : ['low','medium','high'].includes(saved.quality) ? saved.quality : small ? 'low' : 'medium',
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
};

export function applySKCLook(pipe, renderer) {
  const u = pipe.grade.uniforms, on = SKC_SETTINGS.grade === 'cinematic';
  if (u.uSkcTone) u.uSkcTone.value = on ? 1 : 0;
  if (!on) { u.uContrast.value = 1.02; u.uVig.value = .2; return; }
  // Preserve the chapter's lighting and hue hierarchy. Do not lift empty space grey.
  u.uLift.value.multiplyScalar(.24);
  u.uGamma.value.lerp({x:1.025,y:1.025,z:1.03}, .62);
  u.uGain.value.multiply({x:1.025,y:1.035,z:1.045});
  u.uSat.value = Math.max(.94, Math.min(1.1, u.uSat.value * .48 + .53));
  u.uContrast.value = 1.035; u.uVig.value = small ? .075 : .11; u.uGrain.value = .0025;
  renderer.toneMappingExposure *= 1.09;
  pipe.bloom.strength *= .88; // Keep the filaments and metal edges legible.
  if (SKC_SETTINGS.reducedMotion) pipe.lens.uniforms.uZoom.value = 0;
}

export function installOdyssey({app, Q, earth, Sound, setTier, enterFree, S, THREE, EARTH_R, lifecycle}) {
  const save = () => { try { const {reducedMotion, ...settings} = SKC_SETTINGS; localStorage.setItem('skc-odyssey-settings', JSON.stringify(settings)); } catch {} };
  const setSettings = patch => {
    if (!patch || typeof patch !== 'object') return getState();
    if (Number.isFinite(Number(patch.aurora))) SKC_SETTINGS.aurora = Math.max(0, Math.min(1, Number(patch.aurora)));
    if (['emerald','violet'].includes(patch.palette)) SKC_SETTINGS.palette = patch.palette;
    if (['cinematic','neutral'].includes(patch.grade)) SKC_SETTINGS.grade = patch.grade;
    if (['low','medium','high'].includes(patch.quality)) { SKC_SETTINGS.quality = patch.quality; if (Q.tier !== patch.quality) setTier(patch.quality); }
    earth.skcAurora?.setStrength(SKC_SETTINGS.aurora); earth.skcAurora?.setPalette(SKC_SETTINGS.palette);
    earth.skcAurora?.setReducedMotion?.(SKC_SETTINGS.reducedMotion);
    save(); window.dispatchEvent(new CustomEvent('skc:odyssey-state', {detail:getState()}));
    return getState();
  };
  const getState = () => ({ready:true,version:'SKC Earth Odyssey 1.1',...SKC_SETTINGS,quality:Q.tier,language:document.documentElement.lang.startsWith('zh')?'zh':'en',mode:app.mode,playing:app.playing,time:app.t,visible:!document.hidden,frames:app.skcFrames||0,auroraState:earth.skcAurora?.getState(),audio:Sound.getState?.(),lifecycle:lifecycle.getState()});
  const focusAurora = () => {
    document.getElementById('start').classList.add('gone'); document.getElementById('end').classList.remove('on'); document.getElementById('hud').classList.add('on');
    Sound.start(); app.playing=false; app.ended=false; app.prelude=false; app.t=8; app.freeIgn=null;
    const aspect=innerWidth/Math.max(innerHeight,1),distance=EARTH_R*3.12*Math.max(1,.88/Math.max(.4,aspect));
    enterFree('earth', distance);
    // Derive the t=8 light direction from the same flight path as the film.
    // S may still contain a far-future chapter until the next render frame.
    const pole = new THREE.Vector3(-.22,.97,.10), sun = earthPos(app.t).negate().normalize();
    // A grazing high-latitude view keeps the curtains against the night, with a
    // useful crescent of lit coast and cloud instead of an entirely black globe.
    const dir = sun.multiplyScalar(-.43).addScaledVector(pole, .92).normalize();
    const f=app.free; f.yaw=f.ty=Math.atan2(dir.x,dir.z); f.pitch=f.tp=.80; f.td=f.d;
    if(f.fly) f.fly.dur=SKC_SETTINGS.reducedMotion?0:2600;
    app.lastInput=performance.now(); app.orbitSpeed=SKC_SETTINGS.reducedMotion?0:.018; app.snapEye=true;
    window.dispatchEvent(new CustomEvent('skc:odyssey-state',{detail:getState()}));
    return getState();
  };
  window.skcOdyssey={getState,setSettings,focusAurora};
  window.addEventListener('skc:odyssey-settings',event=>setSettings(event.detail));
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change',e=>{SKC_SETTINGS.reducedMotion=e.matches;earth.skcAurora?.setReducedMotion?.(e.matches);if(e.matches)app.orbitSpeed=0;});
  setSettings(SKC_SETTINGS);
  window.dispatchEvent(new CustomEvent('skc:odyssey-ready',{detail:getState()}));
}
