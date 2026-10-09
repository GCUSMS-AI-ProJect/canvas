import {spawnSync} from 'node:child_process';
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const result=spawnSync(process.execPath,[root+'node_modules/vite/bin/vite.js','build'],{cwd:root,stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
cpSync(root+'public',root+'dist/draw',{recursive:true});
mkdirSync(root+'dist/draw/fonts',{recursive:true});
cpSync(root+'node_modules/@excalidraw/excalidraw/dist/prod/fonts',root+'dist/draw/fonts',{recursive:true});
const license=readFileSync(root+'EXCALIDRAW-LICENSE.txt','utf8');
cpSync(root+'EXCALIDRAW-LICENSE.txt',root+'dist/draw/EXCALIDRAW-LICENSE.txt');
writeFileSync(root+'dist/draw/THIRD-PARTY-NOTICES.txt',
  'Third-party components used by WorkStudio Draw.\n\n'+
  ['@excalidraw/excalidraw','react','react-dom','@dagrejs/dagre'].map(name=>
    name+'\n'+(name==='@excalidraw/excalidraw'?license:readFileSync(root+'node_modules/'+name+'/LICENSE','utf8'))).join('\n\n')+
  '\n\nNoto Serif SC: SIL Open Font License 1.1; see fonts/OFL.txt.\n');
console.log('Built portable site in dist/. Open /draw/ on your server.');
