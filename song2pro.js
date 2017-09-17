// Convert NH Song file to ProPresenter 5 (.pro5) song file
module.exports = {
  generatePro5: generatePro5
}

// Quick and dirty UUID generator courtesy of
// https://gist.github.com/jed/982883
// UUIDs required on all slides and groups or else funky behavior occurs
// especially with arrangements
function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}

const fs        = require('fs');
const path      = require('path');
const cheerio   = require('cheerio');
const song2json = require('./song2json.js');
const pro5tools = require('./pro5tools.js');

const GroupColors = {
  'V': '0.04193827509880066 0.3636893332004547 0.8153283596038818 1',
  'C': '1 0 0 1',
  'B': '0.6000000238418579 0.4000000059604645 0.2000000029802322 1'
}
if (process.argv.length < 3) {
  return console.log("usage: node song2pro.js <template.pro5 file> <song.txt file>");
} else if (process.argv[1] == 'song2pro.js') {
  // Process song.txt file
  let templ = process.argv[2];
  // Generate ProPresenter.pro5 song file
  generatePro5(templ, process.argv[3], null);
}

function generatePro5(templ, songFile, outPath, ext = '') {
  let song = song2json.parse(songFile);
  fs.readFile(templ, (err, data) => {
    let $ = cheerio.load(data, { xmlMode: true });

    // Save copy of Title, English , Japanese, and Group Templates
    let titleSlide = $('[label="title"]').clone();
    let enSlide = $('[label="english"]').clone();
    let jpSlide = $('[label="japanese"]').clone();
    let blankSlide = $('[label="blank"]').clone();
    $('[label="title"]').remove();
    $('[label="english"]').remove();
    $('[label="japanese"]').remove();
    $('[label="blank"]').remove();

    let group = $('RVSlideGrouping').clone();
    $('RVSlideGrouping').remove();

    function makeSlide(origSlide, title = '', lyrics = '', text = '') {
      let newSlide = origSlide.clone();
      let txtElems = newSlide.children('displayElements').children('RVTextElement');

      function swapText(elem, title, lyrics, text) {
        let curr = $(elem).attr('RTFData').fromProPresenter();
        let code = curr.getTemplateCode();
        let newText;
        if (code == 'title')
          newText = title;
        else if (code == 'lyrics')
          newText = lyrics;
        else if (code == 'text')
          newText = text;

        // New lines '\n' aren't recognized so convert them to RTF breaks
        newText = newText.split(/[\n]|\s*\\n\s{0,1}/).map((s)=>s.utfToRTF()).join('\\line');

        curr = curr.replace(code, newText);// newText.utfToRTF();
        $(elem).attr('RTFData', curr.toProPresenter());
      }

      if (txtElems.length > 0)
        swapText(txtElems[0], title, lyrics, text);
      if (txtElems.length > 1)
        swapText(txtElems[1], title, lyrics, text);
      if (txtElems.length > 2)
        swapText(txtElems[2], title, lyrics, text);

      newSlide.attr('name', '');
      newSlide.attr('label', '');
      newSlide.attr('UUID', b()); // slides are uppercase 'UUID'
      return newSlide;
    }

    function makeGroup(groupName) {
      let newGroup = group.clone();
      newGroup.attr('name', groupName);
      newGroup.attr('uuid', b()); // groups are lowercase 'uuid'
      if (groupName.charAt(1) && GroupColors[groupName.charAt(1)])
        newGroup.attr('color', GroupColors[groupName.charAt(1)]);
      return newGroup;
    }

    let groupIdx = 0;

    for (var prop in song) {
      if (prop == 'title') {
        // Add Title slide group
        let newGroup = makeGroup('TITLE');
        let newSlide = makeSlide(titleSlide, song.title);
        newSlide.attr('serialization-array-index', 0)
        newGroup.children('slides').append(newSlide);
        newGroup.attr('serialization-array-index', groupIdx++);
        $('groups').append(newGroup);
      } else if (prop.startsWith('E')) {
        // Add English slide group
        let newGroup = makeGroup(prop);
        let slideIdx = 0;

        song[prop].forEach((slideSet) => {
          let lyrics;
          let text;

          if (slideSet.length > 0)
            lyrics = slideSet[0];
          if (slideSet.length > 1)
            text = slideSet[1];
          if (slideSet.length > 2)
            lyrics += ('\r\n' + slideSet[2]);
          if (slideSet.length > 3)
            text += ('\r\n' + slideSet[3]);

          let newSlide = makeSlide(enSlide, song.title, lyrics, text);
          newSlide.attr('serialization-array-index', slideIdx++);
          newGroup.children('slides').append(newSlide);
        });

        newGroup.attr('serialization-array-index', groupIdx++);
        $('groups').append(newGroup);
      } else if (prop.startsWith('J')) {
        // Add Japanese slide group
        let newGroup = makeGroup(prop);
        let slideIdx = 0;

        song[prop].forEach((slideSet) => {
          let newSlide = makeSlide(jpSlide, song.title, slideSet.join('\r\n'));
          newSlide.attr('serialization-array-index', slideIdx++);
          newGroup.children('slides').append(newSlide);
        });

        newGroup.attr('serialization-array-index', groupIdx++);
        $('groups').append(newGroup);
      }
    }

    // Add Blank Group
    let newGroup = makeGroup('BLANK');
    let newBlank = makeSlide(blankSlide, song.title);
    newBlank.attr('serialization-array-index', 0);
    newGroup.children('slides').append(newBlank);
    newGroup.attr('serialization-array-index', groupIdx++);
    $('groups').append(newGroup);

    // Output the slide
    if (outPath) {
      fs.writeFileSync(path.join(outPath, song.title + ext + '.pro5'), $.xml());
    } else {
      console.log($.xml());
    }
  });
}