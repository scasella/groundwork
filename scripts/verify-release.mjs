import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const hosting=JSON.parse(fs.readFileSync(path.join(root,'.openai/hosting.json'),'utf8'));
if(hosting.project_id!==null)throw Error('Public candidate must not contain a configured hosting project');
let files;
try{files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);}catch{throw Error('Run this check in the prepared Git release candidate');}
if(!files.length)throw Error('Stage the intended release files before verification');
const patterns=[/\/(?:Users|home)\/[^\s"']+/,/appgprj_[a-z0-9]+/,/https:\/\/[^\s"']+\.chatgpt\.site/,/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{20,}/,/sk-[A-Za-z0-9]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
const forbidden=/(^|\/)(node_modules|dist|\.checkpoints|\.playwright-mcp|release-private|release-candidate)(\/|$)|(^|\/)\.env(?:\.|$)|\.DS_Store$/;
const problems=[];
for(const file of files){
 if(forbidden.test(file)){problems.push(`${file}: excluded path`);continue;}
 const target=path.join(root,file);if(fs.lstatSync(target).isSymbolicLink()){problems.push(`${file}: symbolic link`);continue;}
 if(/\.(png|jpe?g|webp)$/i.test(file))continue;
 const content=fs.readFileSync(target,'utf8');if(patterns.some(pattern=>pattern.test(content)))problems.push(`${file}: private path, deployment identifier, or credential-like text`);
}
for(const file of ['LICENSE','README.md','package-lock.json','.nvmrc','.github/workflows/ci.yml','SECURITY.md','CONTRIBUTING.md','THIRD_PARTY_NOTICES.md'])if(!files.includes(file))problems.push(`${file}: missing`);
if(problems.length)throw Error(problems.join('\n'));
console.log(`Release content check passed for ${files.length} staged/tracked files. This is a bounded scan, not a secret-detection guarantee.`);
