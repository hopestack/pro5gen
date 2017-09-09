// A Collection of tools to work with ProPresenter 5 slide files

const jconv     = require('jconv');

// Convert ProPresenter base64 encoded RTF strings
// to utf8 strings for easier access
function fromProPresenter(text) {
  return (new Buffer(text.toString(), 'base64')).toString('utf8');
}

// Convert utf8 RTF string back to base64 to use
// in ProPresenter RTFData field
function toProPresenter(text) {
  return (new Buffer(text.toString())).toString('base64');
}

// Text must be in RTF format to work in ProPresenter
// escape all UTF8 characters to \'xx format (PP uses SJIS)
// - alphanumerics don't need escaping but doesn't hurt either
function utfToRTF(text) {
  return "\\'" + 
    jconv
    .convert(text.toString(), 'UTF8', 'SJIS') // return SJIS buffer
    .toString('hex')               // as hex string
    .match(/.{2}/g)                // append escape \' code to every byte
    .join("\\'")
}

// We embed "template codes" in the .pro5 file
// to signify what the text box is used for: title, lyrics, text
function getTemplateCode(text) {
  return text.toString().split(' ').pop().slice(0, -1);
}

// He broke our chains. But I still prefer them on my functions.
String.prototype.fromProPresenter = function() { return fromProPresenter(this) };
String.prototype.toProPresenter   = function() { return toProPresenter(this) };
String.prototype.getTemplateCode  = function() { return getTemplateCode(this) };
String.prototype.utfToRTF         = function() { return utfToRTF(this) };
exports.fromProPresenter  = fromProPresenter;
exports.toProPresenter    = toProPresenter;
exports.getTemplateCode   = getTemplateCode;
exports.utfToRTF          = utfToRTF;