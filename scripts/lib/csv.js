'use strict';
/**
 * 极简 CSV 读写：支持双引号包裹、引号转义（""）、字段里的逗号和换行；NA / 空串原样返回字符串
 */
const fs = require('fs');
const zlib = require('zlib');

function parse(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** 读成对象数组（第一行是表头）；.gz 自动解压 */
function readObjects(file) {
  let buf = fs.readFileSync(file);
  if (/\.gz$/.test(file)) buf = zlib.gunzipSync(buf);
  const rows = parse(buf.toString('utf8').replace(/^\uFEFF/, ''));
  const head = rows.shift() || [];
  return rows.map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i] === undefined ? '' : r[i]; });
    return o;
  });
}

function esc(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n#]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * 写 CSV：comments 是文件头的注释行（每行前面加 #，按 SOURCES.md 的约定写许可和来源）
 */
function write(file, columns, rows, comments) {
  const lines = (comments || []).map((c) => '# ' + c);
  lines.push(columns.join(','));
  rows.forEach((r) => lines.push(columns.map((c) => esc(Array.isArray(r) ? r[columns.indexOf(c)] : r[c])).join(',')));
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

/** 读带 # 注释头的 CSV（本仓库自己写出来的文件） */
function readOwn(file) {
  const text = fs.readFileSync(file, 'utf8').split('\n').filter((l) => !/^#/.test(l)).join('\n');
  const rows = parse(text);
  const head = rows.shift() || [];
  return rows.map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i] === undefined ? '' : r[i]; });
    return o;
  });
}

module.exports = { parse, readObjects, write, readOwn };
