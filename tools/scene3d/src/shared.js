/* shared.js: what the two scenes have in common (the clay one in engine.js, the real-looking one in real.js): the test of
   the device, the names of the parts, the page styles, and the room's light. */
import * as THREE from 'three';
import {ENV_W,ENV_H,ENV_RGBE} from './env.js';

export function ok(){try{const c=document.createElement('canvas');return !!(window.WebGL2RenderingContext&&c.getContext('webgl2'));}catch(e){return false;}}
export const LABEL={adult:'The adult',student:'The student',note:'The sign on the wall',signal:'The signal card',timer:'The timer',papers:'The adult’s papers',sheet:'The student’s work',tokens:'The token board',card:'The request card',item:'The item'};
export const FONT='Inter,system-ui,-apple-system,"Segoe UI",Arial,sans-serif';
let styled=false;
export function style(){if(styled)return;styled=true;const s=document.createElement('style');s.id='nbh-scene3d-css';s.textContent=
'.nbh-scene3d{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#d9e3e1;font-family:'+FONT+';-webkit-user-select:none;user-select:none;touch-action:manipulation}'+
'.nbh-scene3d canvas{display:block;width:100%;height:100%}'+
'.ns3-over{position:absolute;inset:0;pointer-events:none}'+
'.ns3-over .ns-part{position:absolute;box-sizing:border-box;pointer-events:auto;cursor:pointer;border-radius:14px;outline:none;-webkit-tap-highlight-color:transparent}'+
'.ns3-over .ns-part:focus-visible{box-shadow:0 0 0 3px #fff,0 0 0 6px #2f7fa8}'+
'.ns3-over .ns-part.on{box-shadow:0 0 0 3px #fff,0 0 0 6px #E2A93B}'+
'.ns3-over .ns-part.on:focus-visible{box-shadow:0 0 0 3px #fff,0 0 0 6px #E2A93B,0 0 0 9px #2f7fa8}'+
'.ns3-val{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'+
'.ns3-bubble{position:absolute;transform:translate(-50%,-100%);box-sizing:border-box;width:max-content;max-width:46%;background:#fff;border:.16em solid #1D3A52;border-radius:.9em;padding:.4em .8em;font-weight:600;font-size:1em;line-height:1.25;color:#16242e;text-align:center;pointer-events:none}'+
'.ns3-bubble:after{content:"";position:absolute;left:50%;top:100%;margin-left:-.5em;border:.5em solid transparent;border-top-color:#1D3A52}'+
'.ns3-over .ns3-note{left:50%;top:3.2%;transform:translateX(-50%);max-width:62%;min-height:44px;display:flex;align-items:center;background:#fbfaf5;border:.16em solid #1D3A52;border-radius:.6em;padding:.28em .9em;font-weight:700;font-size:.95em;line-height:1.25;color:#1D3A52;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 .12em .3em rgba(22,36,46,.25)}'+
'.ns3-dim{position:absolute;inset:0;background:#16242e;opacity:0;pointer-events:none}';
document.head.appendChild(s);}

/* the light of a real room (Poly Haven "Art Studio", CC0), carried in env.js: red, green, blue and a shared exponent,
   unpacked to half-size numbers, which every device that draws WebGL 2 can smooth (full-size ones cannot be on some tablets) */
export function roomLight(renderer,scene,intensity,turn){
  const bin=atob(ENV_RGBE),n=ENV_W*ENV_H,f=new Uint16Array(n*4),H=x=>THREE.DataUtils.toHalfFloat(Math.min(x,65000)),one=H(1);for(let i=0;i<n;i++){const e=bin.charCodeAt(i*4+3),s=e?Math.pow(2,e-136):0;f[i*4]=H(bin.charCodeAt(i*4)*s);f[i*4+1]=H(bin.charCodeAt(i*4+1)*s);f[i*4+2]=H(bin.charCodeAt(i*4+2)*s);f[i*4+3]=one;}
  const t=new THREE.DataTexture(f,ENV_W,ENV_H,THREE.RGBAFormat,THREE.HalfFloatType);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.LinearSRGBColorSpace;t.magFilter=t.minFilter=THREE.LinearFilter;t.flipY=true;t.needsUpdate=true;
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(t).texture;scene.environmentIntensity=intensity;scene.environmentRotation.y=turn;pm.dispose();t.dispose();}
