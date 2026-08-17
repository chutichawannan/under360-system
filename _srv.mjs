import http from 'http';import fs from 'fs';import path from 'path';
const root=process.cwd();
http.createServer((q,s)=>{const p=path.join(root,decodeURIComponent(q.url.split('?')[0]));
fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);return s.end('nf');}s.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html; charset=utf-8':'text/plain'});s.end(d);});}).listen(4637,()=>console.log('up 4637'));
