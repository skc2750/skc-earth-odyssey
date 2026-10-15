// SKC original visual module (2026). This file is separate from the upstream
// earth-migration MIT implementation. Procedural geometry/shaders: no borrowed media.
// Artistic auroral curtains inspired by NASA's oxygen-green / nitrogen-blue-purple
// imagery; height, magnetic oval and color placement are exhibition design, not a
// space-weather or atmospheric-emission simulation.
import * as THREE from 'three';

const vertexShader = /* glsl */`
  uniform float uTime, uRadius, uHemisphere, uLayer, uMotionScale, uMotionOffset;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vWorld, vCenter;
  varying float vDay;
  void main(){
    vUv=uv;
    float a=uv.x*6.28318530718, h=uv.y, t=(uTime*uMotionScale+uMotionOffset)*0.28;
    float seed=uHemisphere*1.7, drift=a-t*0.34;
    // A wavering magnetic oval; each height follows a slightly different fold.
    // The geometry is a radial vertical sheet, never a flat torus/circle.
    float wave=0.056*sin(drift*3.0+seed)+0.025*sin(drift*7.0+t*0.53+seed*0.7);
    wave+=0.009*sin(drift*13.0-t*0.37+sin(drift*5.0));
    float latitude=1.115+uLayer*0.012+wave;
    // The upper curtain billows with its lower edge, rather than becoming a
    // disconnected ring. A closely spaced second sheet gives the folds depth.
    latitude+=pow(h,1.3)*(0.031*sin(drift*9.0+t*0.7+h*2.6)+0.013*sin(drift*17.0-t*0.5+h*4.0));
    float longitude=a+0.051*h*sin(drift*5.0-t*0.6+seed)+0.019*h*h*sin(drift*11.0+t*0.7);
    float column=0.56+0.27*sin(drift*4.0-t*0.31+seed)+0.17*sin(drift*9.0+t*0.67);
    float height=(13.5+7.0*column)*(1.0+uLayer*0.045);
    float radius=uRadius+0.85+h*height;
    vec3 p=radius*vec3(cos(latitude)*cos(longitude),uHemisphere*sin(latitude),cos(latitude)*sin(longitude));
    vec4 world=modelMatrix*vec4(p,1.0);
    vWorld=world.xyz;vCenter=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;
    vec3 radial=normalize(mat3(modelMatrix)*p);
    vDay=dot(radial,normalize(uSun));
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;

const fragmentShader = /* glsl */`
  uniform float uTime, uStrength, uGain, uPalette, uLayer, uRadius, uMotionScale, uMotionOffset;
  varying vec2 vUv;
  varying vec3 vWorld, vCenter;
  varying float vDay;
  void main(){
    // Explicit spherical occlusion in addition to depth testing: the far-side
    // curtains cannot shine through the opaque Earth, including post-stack views.
    vec3 origin=cameraPosition-vCenter, ray=vWorld-cameraPosition;
    float distanceToFragment=length(ray);vec3 direction=ray/max(distanceToFragment,0.0001);
    float b=dot(origin,direction),disc=b*b-dot(origin,origin)+uRadius*uRadius;
    if(disc>0.0){float hit=-b-sqrt(disc);if(hit>0.0&&hit<distanceToFragment-0.025)discard;}
    float x=vUv.x*6.28318530718,h=clamp(vUv.y,0.0,1.0),t=(uTime*uMotionScale+uMotionOffset)*0.28;
    float drift=x-t*0.34;
    // Periodic, low-frequency waves carry a continuous luminous body around the
    // oval. Fine filaments modulate this body, never replace it with sharp lines.
    float broad=0.55+0.25*sin(drift*4.0+t*0.42)+0.13*sin(drift*9.0-t*0.6+sin(drift*3.0));
    float fold=0.5+0.5*sin(drift*12.0+1.7*sin(drift*5.0-t*0.65)+h*2.1);
    float threads=0.5+0.5*sin(drift*137.0+2.0*sin(drift*23.0+t)+h*0.9);
    float silk=0.5+0.5*sin(drift*71.0-1.5*sin(drift*11.0-t*0.8)+h*1.7);
    float striation=0.70+0.20*threads+0.10*silk;
    float top=0.62+0.18*sin(drift*6.0+t*0.65);
    // A bell-shaped vertical envelope fades both edges before the sheet ends.
    // Broad veils come and go along the oval instead of drawing a solid band.
    float vertical=smoothstep(0.0,0.24,h)*exp(-pow((h-0.36)/0.31,2.0));
    vertical*=1.0-smoothstep(top,1.0,h);
    float folds=(0.16+0.84*smoothstep(0.05,0.96,broad))*(0.56+0.44*fold);
    folds*=0.77+0.23*sin(drift*5.0-h*4.0+t*0.8);
    float flowing=0.87+0.13*sin(h*6.0-t*2.8+sin(drift*5.0)*1.4);
    float night=1.0-smoothstep(-0.14,0.42,vDay);
    float daylight=0.065+0.935*night;
    // A sheet seen edge-on must not turn into an opaque-looking luminous wire.
    // Derivatives follow the actual deformed curtain, softening fold silhouettes
    // and grazing intersections while keeping face-on luminous veils unchanged.
    vec3 sheetNormal=normalize(cross(dFdx(vWorld),dFdy(vWorld)));
    float faceOn=abs(dot(sheetNormal,direction));
    float grazing=0.08+0.92*smoothstep(0.03,0.24,faceOn);
    float emission=striation*vertical*folds*flowing*daylight*grazing*uStrength*uGain;
    emission*=mix(1.0,0.28,uLayer);
    if(emission<0.0015)discard;
    float upper=smoothstep(0.27+0.04*sin(drift*8.0+t),0.65,h);
    vec3 green=mix(vec3(0.025,1.12,0.20),vec3(0.025,0.85,0.63),smoothstep(0.12,0.40,h));
    green=mix(green,vec3(0.78,0.13,1.40),upper);
    vec3 violet=mix(vec3(0.07,0.95,0.64),vec3(1.03,0.12,1.55),smoothstep(0.12,0.60,h));
    vec3 color=mix(green,violet,uPalette);
    gl_FragColor=vec4(color*emission*2.1,1.0);
  }
`;

function sheetGeometry(segments,rows){
  const positions=new Float32Array((segments+1)*(rows+1)*3),uvs=new Float32Array((segments+1)*(rows+1)*2),indices=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=segments;x++){
    const i=y*(segments+1)+x;positions.set([x/segments,y/rows,0],i*3);uvs.set([x/segments,y/rows],i*2);
    if(x<segments&&y<rows){const a=i,b=i+1,c=i+segments+1,d=c+1;indices.push(a,c,b,b,c,d);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);
  // The vertex shader moves the parameter sheet onto a sphere; its CPU bounds
  // must cover the Earth-space result rather than the tiny parameter rectangle.
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),125);return geometry;
}

export function createSKCAurora({U,Q={},radius=100}){
  const group=new THREE.Group();group.name='SKC / dual polar auroral curtains';
  group.rotation.z=THREE.MathUtils.degToRad(8.8);group.rotation.y=-1.12;
  const low=Q.tier==='low',segments=low?144:Q.tier==='ultra'?448:Q.tier==='high'?384:320,rows=low?16:Q.tier==='ultra'?32:Q.tier==='high'?28:24;
  const geometry=sheetGeometry(segments,rows),materials=[],sheets=[];
  const strength={value:.72},gain={value:1},palette={value:0};
  const motionScale={value:1},motionOffset={value:0};
  const motionMedia=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  let requestedMotionScale=1,forcedReducedMotion=false,disposed=false;
  let paletteName='emerald',cameraDistance=0,activeLayers=0;
  function syncMotion(){
    const reduced=forcedReducedMotion||!!motionMedia?.matches;
    const next=Math.min(requestedMotionScale,reduced ? .18 : 1);
    // Preserve the current wave phase when preferences change; no animation
    // clock, event timer, geometry rebuild, or extra render loop is introduced.
    const now=Number(U.uTime.value)||0;
    motionOffset.value+=now*(motionScale.value-next);motionScale.value=next;
  }
  syncMotion();motionMedia?.addEventListener?.('change',syncMotion);
  for(const hemisphere of[-1,1])for(let layer=0;layer<(low?1:2);layer++){
    const material=new THREE.ShaderMaterial({
      name:`SKC auroral curtain ${hemisphere>0?'north':'south'} ${layer}`,
      uniforms:{uTime:U.uTime,uSun:U.uSunW,uRadius:{value:radius},uHemisphere:{value:hemisphere},uLayer:{value:layer},uStrength:strength,uGain:gain,uPalette:palette,uMotionScale:motionScale,uMotionOffset:motionOffset},
      vertexShader,fragmentShader,extensions:{derivatives:true},transparent:true,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    });
    const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.frustumCulled=false;mesh.renderOrder=5;mesh.userData.skcLayer=layer;group.add(mesh);sheets.push(mesh);materials.push(material);
  }
  function update(camera){
    if(disposed)return;
    cameraDistance=camera.position.length();
    const distanceFade=1-THREE.MathUtils.smoothstep(cameraDistance,radius*16,radius*48);
    const storyBoost=.78+.22*THREE.MathUtils.clamp(Number(U.uAurora?.value)||0,0,1);
    gain.value=distanceFade*storyBoost;
    group.visible=strength.value>.001&&gain.value>.002;activeLayers=0;
    for(const mesh of sheets){mesh.visible=group.visible&&(mesh.userData.skcLayer===0||(Q.tier!=='low'&&cameraDistance<radius*8.5));if(mesh.visible)activeLayers++;}
  }
  const api={group,update,
    setStrength(value){strength.value=THREE.MathUtils.clamp(Number(value)||0,0,1);if(strength.value<=.001){group.visible=false;activeLayers=0;}return api.getState();},
    setPalette(value){paletteName=value==='violet'?'violet':'emerald';palette.value=paletteName==='violet'?1:0;return api.getState();},
    setMotionScale(value){requestedMotionScale=THREE.MathUtils.clamp(Number(value)||0,0,1);syncMotion();return api.getState();},
    setReducedMotion(value){forcedReducedMotion=!!value;syncMotion();return api.getState();},
    getState(){return{strength:strength.value,palette:paletteName,visible:group.visible,time:U.uTime.value,cameraDistance,activeLayers,hemispheres:2,segments,rows,triangles:segments*rows*2*activeLayers,daylightAttenuation:true,earthOcclusion:true,motionScale:motionScale.value,requestedMotionScale,reducedMotion:forcedReducedMotion||!!motionMedia?.matches,motionPhase:U.uTime.value*motionScale.value+motionOffset.value,style:'broad soft dual-color curtains',source:'SKC original procedural aurora',artisticScale:true};},
    dispose(){disposed=true;motionMedia?.removeEventListener?.('change',syncMotion);group.removeFromParent();geometry.dispose();for(const material of materials)material.dispose();}
  };
  return api;
}
