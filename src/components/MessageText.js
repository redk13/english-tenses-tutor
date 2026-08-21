import React from 'react';
import { Text } from 'react-native';

// Unicode directional isolate marks — wrap English/number runs with these so
// the bidi algorithm keeps them left-to-right internally WITHOUT breaking the
// right-to-left order of the surrounding Arabic sentence (fixes things like
// "(He, She, It)" flipping or landing on the wrong side of Arabic text).
const LRI = '\u2066'; // Left-to-Right Isolate
const PDI = '\u2069'; // Pop Directional Isolate

// Matches a run of Latin letters/digits and the punctuation commonly glued
// to them (spaces, commas, parentheses, quotes, slashes, hyphens, dots...).
const LATIN_RUN = /[A-Za-z0-9][A-Za-z0-9 ,.'"!?;:()/_-]*[A-Za-z0-9.!?)]|[A-Za-z0-9]/g;

function isolateLatinRuns(str) {
  return str.replace(LATIN_RUN, (m) => LRI + m + PDI);
}

// Strips/normalizes stray Markdown syntax the AI sometimes emits so it never
// shows up as literal symbols (##, -, `code`) to the user.
function stripExtraMarkdown(str) {
  return str
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')   // # / ## headings -> plain text
    .replace(/^\s*[-*]\s+(?!\*)/gm, '• ') // "- item" / "* item" -> "• item"
    .replace(/`([^`]+)`/g, '$1');          // `code` -> code
}

// Splits text on **bold** markers into { text, bold } segments.
function parseBold(str) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = regex.exec(str))) {
    if (m.index > last) parts.push({ text: str.slice(last, m.index), bold: false });
    parts.push({ text: m[1], bold: true });
    last = regex.lastIndex;
  }
  if (last < str.length) parts.push({ text: str.slice(last), bold: false });
  return parts.length ? parts : [{ text: str, bold: false }];
}

export default function MessageText({ text, style, boldStyle }) {
  if (!text) return null;
  const clean = stripExtraMarkdown(String(text));
  const segments = parseBold(clean);

  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text key={i} style={seg.bold ? boldStyle : null}>
          {isolateLatinRuns(seg.text)}
        </Text>
      ))}
    </Text>
  );
}
