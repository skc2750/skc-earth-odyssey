'use strict';
// Integrity, narrow package inventory, local navigation, and real HTTP boundaries.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http');
const ROOT=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
function assert(condition,message){if(!condition)throw Error(message);}
function walk(dir,relative=''){
 const files=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(!relative&&entry.name==='.git'){assert(!entry.isSymbolicLink(),'Git metadata is a symlink');continue;}
  const name=relative+entry.name,absolute=path.join(dir,entry.name);assert(!entry.isSymbolicLink(),'Symlink/junction: '+name);
  assert(!/(^|\/)(\.vercel|\.env(?:\..*)?|node_modules|qa|local-qa|auth|\.auth|credentials)(\/|$)/i.test(name)&&!/^(build|dist)(\/|$)/i.test(name),'Forbidden local file: '+name);
  if(entry.isDirectory())files.push(...walk(absolute,name+'/'));else{assert(entry.isFile(),'Non-regular file: '+name);files.push(name);}
 }return files;
}
function request(port,url,method='GET',headers={}){return new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path:url,method,headers},res=>{const chunks=[];res.on('data',v=>chunks.push(v));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});req.on('error',reject);req.end();});}
(async()=>{
 const snapshot=JSON.parse(fs.readFileSync(path.join(ROOT,'snapshot-manifest.json'),'utf8'));
 assert(snapshot.release==='V3.1'&&snapshot.migrationFileCount===112&&snapshot.migrationFiles.length===112,'Expected V3.1 / 112 migration files');
 assert(/^[A-F0-9]{64}$/.test(snapshot.sourceManifestSha256),'Invalid source manifest SHA256');
 assert(snapshot.supportFiles.length===1&&snapshot.supportFiles[0].path==='assets/skc-logo.png','Unexpected support payload');
 const runtime=[...snapshot.migrationFiles,...snapshot.supportFiles],names=runtime.map(f=>f.path);
 assert(new Set(names).size===113&&snapshot.migrationFiles.every(f=>f.path.startsWith('migration/')),'Duplicate or out-of-scope runtime path');
 for(const f of runtime){assert(!f.path.includes('\\')&&!f.path.split('/').some(s=>!s||s==='.'||s==='..'),'Unsafe snapshot path');const data=fs.readFileSync(path.join(ROOT,f.path));assert(data.length===f.bytes&&sha(data)===f.sha256.toUpperCase(),'Snapshot mismatch: '+f.path);}
 const extras=['.gitattributes','.gitignore','index.html','dimension/index.html','mechanics/index.html','package.json','README.md','LICENSING.md','THIRD_PARTY_NOTICES.md','snapshot-manifest.json','docs/SNAPSHOT.md','scripts/start.cjs','scripts/verify.cjs','licenses/Draco-LICENSE.txt','licenses/fflate-LICENSE.txt'];
 const expected=[...names,...extras].sort(),actual=walk(ROOT).sort();assert(JSON.stringify(actual)===JSON.stringify(expected),'Inventory changed: missing '+expected.filter(f=>!actual.includes(f)).join(', ')+'; extra '+actual.filter(f=>!expected.includes(f)).join(', '));
 const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
 assert(pkg.name==='skc-earth-odyssey'&&pkg.version==='3.1.0'&&pkg.private===true&&pkg.license==='UNLICENSED','Package identity / retained-rights mismatch');
 assert(!Object.keys(pkg.dependencies||{}).length&&!Object.keys(pkg.devDependencies||{}).length,'Unexpected dependencies');
 assert(pkg.scripts.start==='node scripts/start.cjs'&&pkg.scripts.verify==='node scripts/verify.cjs','Unexpected commands');
 let localTargets=0;
 for(const file of actual.filter(f=>f.endsWith('.html'))){const text=fs.readFileSync(path.join(ROOT,file),'utf8');for(const match of text.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)){const value=match[1];if(value.startsWith('#')||/^(?:https?:|data:|mailto:|tel:|\/\/)/i.test(value))continue;const parsed=new URL(value,'http://standalone.invalid/'+file),relative=decodeURIComponent(parsed.pathname).slice(1)+(parsed.pathname.endsWith('/')?'index.html':'');assert(fs.existsSync(path.join(ROOT,relative))&&fs.statSync(path.join(ROOT,relative)).isFile(),'Broken local HTML target: '+file+' -> '+value);localTargets++;}}
 for(const space of ['dimension','mechanics']){const html=fs.readFileSync(path.join(ROOT,space,'index.html'),'utf8');assert(html.includes('0;url=https://simonseow.com/'+space+'/')&&html.includes('href="https://simonseow.com/'+space+'/"'),'Incorrect live-space redirect: '+space);}
 const docs=fs.readFileSync(path.join(ROOT,'docs/SNAPSHOT.md'),'utf8');assert(docs.includes(snapshot.sourceManifestSha256),'Snapshot provenance missing');
 for(const [file,hash] of [['Draco-LICENSE.txt','D3709B0FB4B8A94BBB1D02B8A2E484F258B0D9C5C5A01F940391F3FE662CD1A4'],['fflate-LICENSE.txt','62249119BB7DF6E54300F37A37145C26A6D4420410AAC8881A119C5B427CF751']])assert(sha(fs.readFileSync(path.join(ROOT,'licenses',file)))===hash,'Supplemental license changed: '+file);
 const {createServer}=require('./start.cjs'),server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});let httpChecks=0;
 try{
  const port=server.address().port;
  for(const url of ['/','/migration/','/migration/classic.html','/dimension/','/mechanics/']){const r=await request(port,url);assert(r.status===200&&r.headers['content-type'].startsWith('text/html'),'HTTP page: '+url);httpChecks++;}
  for(const [ext,mime] of [['.wasm','application/wasm'],['.glb','model/gltf-binary'],['.bin','application/octet-stream'],['.woff2','font/woff2'],['.js','text/javascript']]){const file=names.find(f=>f.endsWith(ext)),r=await request(port,'/'+file,'HEAD');assert(r.status===200&&r.headers['content-type'].startsWith(mime)&&!r.body.length&&Number(r.headers['content-length'])===runtime.find(f=>f.path===file).bytes,'MIME/HEAD: '+ext);httpChecks++;}
  for(const url of ['/../package.json','/%2e%2e/package.json','/%2e%2e%2fpackage.json','/migration/%2e%2e/package.json','/migration/%5c..%5cpackage.json','/%00','/%GG','/.env','/.git/config','/package.json','/snapshot-manifest.json','/scripts/start.cjs','/docs/SNAPSHOT.md']){assert((await request(port,url)).status===404,'HTTP guard: '+url);httpChecks++;}
  assert((await request(port,'/','POST')).status===405,'HTTP method guard');httpChecks++;
  const sample=runtime.find(f=>f.path.endsWith('.wasm')),range=await request(port,'/'+sample.path,'GET',{Range:'bytes=0-31'});assert(range.status===206&&range.body.equals(fs.readFileSync(path.join(ROOT,sample.path)).subarray(0,32)),'Byte range response');httpChecks++;
  assert((await request(port,'/'+sample.path,'GET',{Range:'bytes=999999999999-'})).status===416,'Invalid range response');httpChecks++;
 }finally{await new Promise(resolve=>server.close(resolve));}
 const inventory=actual.map(file=>{const data=fs.readFileSync(path.join(ROOT,file));return{path:file,bytes:data.length,sha256:sha(data)};});
 const packageTreeSha256=sha(Buffer.from(inventory.map(f=>f.path+'\0'+f.bytes+'\0'+f.sha256).join('\n')));
 console.log(JSON.stringify({result:'PASS',release:snapshot.release,migrationFiles:112,supportFiles:1,wrapperAndNoticeFiles:extras.length,totalFiles:inventory.length,totalBytes:inventory.reduce((n,f)=>n+f.bytes,0),localHtmlTargets:localTargets,httpChecks,packageTreeSha256},null,2));
})().catch(e=>{console.error('VERIFY FAILED: '+e.message);process.exitCode=1;});
