import React from 'react';
import { View, Text } from 'react-native';

// Unicode directional isolate marks. We wrap a *whole* foreign-script run
// (e.g. a full English sentence embedded in Arabic) with these so the bidi
// algorithm keeps that run's internal order correct WITHOUT letting it be
// reordered word-by-word relative to the surrounding text.
const LRI = '\u2066'; // Left-to-Right Isolate — wraps a Latin run inside RTL text
const RLI = '\u2067'; // Right-to-Left Isolate — wraps an Arabic run inside LTR text
const PDI = '\u2069'; // Pop Directional Isolate — closes either of the above

const ARABIC_CHARS = '\\u0600-\\u06FF\\u0750-\\u077F';

// A run starts/ends on a real letter or digit (or an attached bracket/quote),
// and may contain spaces/punctuation in between — this lets a whole sentence
// like "I played football last week." match as ONE run instead of shattering
// at every space or punctuation mark.
const LATIN_RUN_SRC  = `["'(A-Za-z0-9][A-Za-z0-9 ,.'"!?;:()/_-]*[A-Za-z0-9.!?)'"]|[A-Za-z0-9]`;
const ARABIC_RUN_SRC = `["'(${ARABIC_CHARS}][${ARABIC_CHARS}0-9 ,.'"!?:()/_-]*[${ARABIC_CHARS}0-9.!?)'"]|[${ARABIC_CHARS}]`;

const STRONG_LATIN  = /[A-Za-z]/;
const STRONG_ARABIC = new RegExp(`[${ARABIC_CHARS}]`);

// Strips/normalizes stray Markdown syntax the AI sometimes emits so it never
// shows up as literal symbols (##, -, `code`) to the user.
function stripExtraMarkdown(str) {
  return str
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')   // # / ## headings -> plain text
    .replace(/^\s*[-*]\s+(?!\*)/gm, '• ') // "- item" / "* item" -> "• item"
    .replace(/`([^`]+)`/g, '$1');          // `code` -> code
}

// Removes **bold** markers from a line, returning the plain text plus the
// [start,end) character ranges (in the PLAIN text) that were bold. Doing
// this before run-detection means a bold word in the middle of a sentence
// no longer splits that sentence into separate isolated fragments.
function stripBold(line) {
  let plain = '';
  const boldRanges = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    plain += line.slice(last, m.index);
    const start = plain.length;
    plain += m[1];
    boldRanges.push([start, plain.length]);
    last = re.lastIndex;
  }
  plain += line.slice(last);
  return { plain, boldRanges };
}

function findRuns(str, src) {
  const re = new RegExp(src, 'g');
  const runs = [];
  let m;
  while ((m = re.exec(str))) {
    if (m[0].length === 0) { re.lastIndex++; continue; }
    runs.push([m.index, m.index + m[0].length]);
  }
  return runs;
}

const inRange = (ranges, i) => ranges.some(([s, e]) => i >= s && i < e);

// First-strong-character heuristic — the same rule browsers use for
// dir="auto": whichever script's letter appears first decides the line's
// reading direction. Falls back to the previous line's direction (or the
// bubble default) when a line has no strong-direction letter at all
// (e.g. just "1)" or punctuation).
function detectLineDir(line, fallback) {
  for (const ch of line) {
    if (STRONG_LATIN.test(ch)) return 'ltr';
    if (STRONG_ARABIC.test(ch)) return 'rtl';
  }
  return fallback;
}

function renderLine(line, dir, boldStyle) {
  const { plain, boldRanges } = stripBold(line);
  const foreignSrc = dir === 'rtl' ? LATIN_RUN_SRC : ARABIC_RUN_SRC;
  const isoRanges = findRuns(plain, foreignSrc);

  const cuts = new Set([0, plain.length]);
  boldRanges.forEach(([s, e]) => { cuts.add(s); cuts.add(e); });
  isoRanges.forEach(([s, e]) => { cuts.add(s); cuts.add(e); });
  const points = Array.from(cuts).sort((a, b) => a - b);

  const pieces = [];
  for (let i = 0; i < points.length - 1; i++) {
    const s = points[i], e = points[i + 1];
    if (s === e) continue;
    pieces.push({ text: plain.slice(s, e), bold: inRange(boldRanges, s), iso: inRange(isoRanges, s) });
  }

  const nodes = [];
  let i = 0;
  let key = 0;
  const mark = dir === 'rtl' ? LRI : RLI;
  while (i < pieces.length) {
    if (pieces[i].iso) {
      const group = [];
      while (i < pieces.length && pieces[i].iso) { group.push(pieces[i]); i++; }
      nodes.push(
        <Text key={key++}>
          {mark}
          {group.map((p, k) => (
            <Text key={k} style={p.bold ? boldStyle : null}>{p.text}</Text>
          ))}
          {PDI}
        </Text>
      );
    } else {
      nodes.push(<Text key={key++} style={pieces[i].bold ? boldStyle : null}>{pieces[i].text}</Text>);
      i++;
    }
  }
  return nodes;
}

export default function MessageText({ text, style, boldStyle, defaultDir = 'rtl' }) {
  if (!text) return null;
  const clean = stripExtraMarkdown(String(text));
  const lines = clean.split('\n');

  let lastDir = defaultDir;

  return (
    <View>
      {lines.map((line, idx) => {
        if (line.trim() === '') return <View key={idx} style={{ height: 6 }} />;
        const dir = detectLineDir(line, lastDir);
        lastDir = dir;
        return (
          <Text
            key={idx}
            style={[style, { textAlign: dir === 'rtl' ? 'right' : 'left', writingDirection: dir }]}
          >
            {renderLine(line, dir, boldStyle)}
          </Text>
        );
      })}
    </View>
  );
}
