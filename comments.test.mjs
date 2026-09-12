import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadComments, moderateComment, COMMENT_COLUMNS } from './src/comments-api.mjs';

function clientWith(results) {
  const calls = [];
  return { calls, from(table) {
    const methods = [['from', table]]; calls.push(methods);
    const result = results.shift();
    const query = new Proxy({}, { get(_, key) {
      if (key === 'then') return Promise.resolve(result).then.bind(Promise.resolve(result));
      return (...args) => { methods.push([key, ...args]); return query; };
    } }); return query;
  } };
}
const comment = { id: 'f034c9ee-1b60-4684-a48f-92c4b357782f', review_version: 2, review_status: 'pending' };
test('inbox fetches safe columns, status-specific notes and accurate totals', async () => {
  const client = clientWith([{data:[comment, {...comment,id:'second'}]}, {count:2}, {count:4}, {count:1}]);
  const data = await loadComments(client, 'pending', 1);
  assert.equal(data.notes.length, 1); assert.equal(data.hasMore, true);
  assert.deepEqual(data.counts, {pending:2,approved:4,denied:1});
  assert.ok(client.calls[0].some(call => call[0] === 'select' && call[1] === COMMENT_COLUMNS));
  assert.ok(!COMMENT_COLUMNS.includes('reader_hash'));
});
test('any failed list or count fails closed', async () => {
  const client = clientWith([{data:[]}, {count:0}, {error:{message:'failed'}}, {count:0}]);
  await assert.rejects(loadComments(client,'pending'), /could not load/);
});
test('approval writes only decision and guards the reviewed version', async () => {
  const client = clientWith([{data:{...comment,review_version:3,review_status:'approved',approved:true}}]);
  await moderateComment(client,comment,'approved');
  assert.deepEqual(client.calls[0].find(c => c[0] === 'update')[1], {review_status:'approved'});
  assert.ok(client.calls[0].some(c => c[0] === 'eq' && c[1] === 'review_version' && c[2] === 2));
});
test('denial requires confirmed private state', async () => {
  await moderateComment(clientWith([{data:{...comment,review_status:'denied',approved:false}}]),comment,'denied');
  await assert.rejects(moderateComment(clientWith([{data:{...comment,review_status:'denied',approved:true}}]),comment,'denied'), /could not be verified/);
});
test('stale decisions and network errors do not report success', async () => {
  await assert.rejects(moderateComment(clientWith([{data:null}]),comment,'approved'), /another session/);
  await assert.rejects(moderateComment(clientWith([{error:{message:'network'}}]),comment,'approved'), /not confirmed/);
});
test('invalid states do not call the database', async () => {
  const client = clientWith([]);
  await assert.rejects(moderateComment(client,comment,'delete'), /approve or deny/);
  await assert.rejects(loadComments(client,'all'), /valid comment view/);
  assert.equal(client.calls.length,0);
});
test('UI remains owner-gated and treats comments as text', () => {
  const ui=readFileSync('src/Comments.jsx','utf8'), app=readFileSync('src/main.jsx','utf8');
  assert.match(ui, /<blockquote>\{comment.message\}<\/blockquote>/);
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML/);
  assert.match(ui, /confirm approval/); assert.match(ui, /confirm denial/);
  assert.match(ui, /refresh\(true\)/);
  assert.match(ui, /if \(next === view\) \{ refresh\(\); return; \}/);
  assert.match(app, /view === "comments" && <Comments/);
  assert.match(app, /data.session\?\.user\?\.id === FOUNDER_ID/);
});
