/* eslint-disable no-console */
'use strict';
// usage node join ./src1.json ./src2.json ./target.json

const fs = require('fs');
const files = process.argv.slice(2);
const path = require('path');
console.log(files);
if (files.length < 3) {
  console.log('need at least 2 files: src1 src2 target to be merged');
  console.log('to merge files use node join ./src1.json ./src2.json ./src3.json ... ./output.json')
  return;
}

const target = files.splice(files.length-1, 1)[0];
const result = files.reduce((previous, current) => {
  const resolvedPath = path.resolve(process.cwd(), current);
  const contents = require(resolvedPath);
  return previous.concat(contents);
}, []);

console.log(JSON.stringify(result));

const targetPath = path.resolve(process.cwd(), target);
fs.writeFileSync(targetPath, JSON.stringify(result));

