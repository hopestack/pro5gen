if (process.argv.length < 4)
  return console.log("usage: node dir2pro.js <input dir> <output dir> <template.pro5 file> <extension>");

const fs = require('fs');
const path = require('path');
const song2pro = require('./song2pro.js');

let in_dir  = process.argv[2];
let out_dir = process.argv[3];
let templ   = process.argv[4];
let ext     = process.argv[5] || '';

let files = fs.readdirSync(in_dir);

files.forEach(n=>{
  if(n.endsWith('.txt')) {
    let inFile = path.join(in_dir, n);
    console.log('Processing', templ, inFile);
    song2pro.generatePro5(templ, inFile, out_dir, ext);
  }
});