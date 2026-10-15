'use strict';
// Zero-dependency, loopback-only static server. No install/build/login required.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(ROOT,'snapshot-manifest.json'),'utf8'));
const PUBLIC=new Set([...snapshot.migrationFiles,...snapshot.supportFiles].map(f=>f.path).concat(['index.html','dimension/index.html','mechanics/index.html']));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.wasm':'application/wasm','.bin':'application/octet-stream','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.woff2':'font/woff2','.woff':'font/woff','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.hdr':'application/octet-stream','.exr':'application/octet-stream','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
function publicPath(url){
 let decoded;try{decoded=decodeURIComponent(String(url||'/').split('?')[0]);}catch{return null;}
 if(!decoded.startsWith('/')||/[\\\0:]/.test(decoded))return null;
 const parts=decoded.split('/').filter(Boolean);
 if(parts.some(s=>s==='.'||s==='..'||s.startsWith('.')))return null;
 let relative=parts.join('/');if(decoded.endsWith('/')||!relative)relative+=(relative?'/':'')+'index.html';
 if(!PUBLIC.has(relative))return null;
 const absolute=path.resolve(ROOT,relative);if(!absolute.startsWith(ROOT+path.sep))return null;
 // Refuse symlinks/junctions, including a parent directory swapped after startup.
 let current=ROOT;for(const part of relative.split('/')){current=path.join(current,part);try{if(fs.lstatSync(current).isSymbolicLink())return null;}catch{return null;}}
 return absolute;
}
function createServer(){return http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end('Method not allowed');}
 const file=publicPath(req.url);if(!file){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
 let stat;try{stat=fs.statSync(file);if(!stat.isFile())throw Error();}catch{res.writeHead(404);return res.end('Not found');}
 let start=0,end=stat.size-1,status=200;
 if(req.headers.range){
  const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);let invalid=!m||(!m[1]&&!m[2]);
  if(!invalid){if(m[1]){start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;}else{start=Math.max(0,stat.size-Number(m[2]));}invalid=!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size;}
  if(invalid){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}status=206;
 }
 const headers={'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':Math.max(0,end-start+1),'Cache-Control':'no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
 if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
 res.writeHead(status,headers);if(req.method==='HEAD')return res.end();
 const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
});}
if(require.main===module){
 const flag=process.argv.find(v=>v.startsWith('--port='));const value=flag?flag.slice(7):process.env.PORT||'4320';const port=Number(value);
 if(!Number.isInteger(port)||port<0||port>65535){console.error('PORT must be an integer between 0 and 65535.');process.exitCode=1;}
 else{const server=createServer();server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port is in use. Choose PORT or --port=4321.':e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`SKC Earth Odyssey V3.1 · http://127.0.0.1:${server.address().port}/`));}
}
module.exports={createServer,publicPath,MIME};
