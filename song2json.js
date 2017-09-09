/*
 * NH ProPresenter Tool: Song2Json
 * 
 * Take a song.txt file and convert it to a json object
 * 
 * song.txt should have the following format
 * 
 * - comments begin with a dash and are ignored
 * #GROUP designates a new slide group with the name 'GROUP'
 * #EV, #EC, #EB English verse, chorus, bridge (numbers at end allowed)
 * #JV, #JC, #JB 日本語　ヴァース、コーラス、ブリッジ（最後に数字を付けてもオッケー）
 * After a group designation, slides are defined as follows:
 * Language 1 / Language 2 interleaved up to 4 lines
 * 
 * Example:
#TITLE
---
Glory To Glory

#EV1
---
Created from dust
土によって創られ
You came and You lived among us
私たちとともに住まわれた

You took on our frame
あなたは人と同じかたちをとり
You walked in our pain
私たちの痛みをともに背負い

#JV
---
人となり　全ての痛みを
Hito to nari subete no itami wo
背負った主が
Seotta Shu ga

栄光へと
Eikou e to
引き上げてくれる
Hiki agete kureru

 * 
 * 
 */

if (process.argv.length == 3)
  console.log(parse(process.argv[2]));

 module.exports = {
  parse: parse
}

function parse(filename) {
  const raw = require('fs').readFileSync(filename, 'utf8');
  let song = { title: '' };

  let curr_group;
  let curr_slide = [];
  let rawParts = raw.split('\n');
  let endIdx = rawParts.length - 1;

  // Parse file into JSON object
  rawParts.forEach((l, i) => {
    let line = l.trim();
    // ’ character throws off the rest of the system
    line = line.replace("’", "'");
    // TODO: replace fake 濁点
    // TODO: replace tabs with spaces

    if (line.startsWith('-')) // ignore all lines starting with -
      return;

    // Start a new slide on new line and end of file
    if (line.trim() == '' || i == endIdx) {
      if (i == endIdx && line.trim() != '')
        curr_slide.push(line);
      if (curr_slide.length) {
        song[curr_group] = song[curr_group] || [];
        song[curr_group].push(curr_slide);
        curr_slide = [];
      }
      return;
    }

    // '#' starts a new slide group
    if (line.startsWith('#'))
      return curr_group = line.slice(1);

    // Song title gets special treatment
    if (curr_group.toLowerCase() == 'title')
      return song.title = line;

    curr_slide.push(line);
  });

  return song;
}