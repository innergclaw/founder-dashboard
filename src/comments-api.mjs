export const COMMENT_COLUMNS = 'id,slug,message,approved,created_at,review_status,reviewed_at,review_version';
export const COMMENT_STATES = ['pending', 'approved', 'denied'];

export async function loadComments(client, state, limit = 25) {
  if (!COMMENT_STATES.includes(state)) throw new Error('choose a valid comment view.');
  const [notes, ...totals] = await Promise.all([
    client.from('innerg_read_feedback').select(COMMENT_COLUMNS).eq('review_status', state)
      .order('created_at', { ascending: false }).order('id').limit(limit + 1),
    ...COMMENT_STATES.map(value => client.from('innerg_read_feedback').select('id', { count: 'exact', head: true }).eq('review_status', value)),
  ]);
  if ([notes, ...totals].some(result => result.error)) throw new Error('comments could not load. check your connection and try again.');
  return { notes: (notes.data || []).slice(0, limit), hasMore: (notes.data || []).length > limit,
    counts: Object.fromEntries(COMMENT_STATES.map((value, i) => [value, totals[i].count || 0])) };
}

export async function moderateComment(client, comment, decision) {
  if (!['approved', 'denied'].includes(decision)) throw new Error('choose approve or deny.');
  const { data, error } = await client.from('innerg_read_feedback').update({ review_status: decision })
    .eq('id', comment.id).eq('review_version', comment.review_version).select(COMMENT_COLUMNS).maybeSingle();
  if (error) throw new Error('the decision was not confirmed. refresh the inbox before trying again.');
  if (!data) throw new Error('this comment changed in another session. refresh the inbox before deciding.');
  if (data.review_status !== decision || data.approved !== (decision === 'approved')) throw new Error('the decision could not be verified. refresh the inbox.');
  return data;
}
