import { useEffect, useState } from 'react';
import type { Market } from './live';
import type { Language } from './i18n';

type PublicComment = {
  id: string; body: string; createdAt: string;
  parentCommentID?: string | null; reactionCount?: number;
  profile?: {name?: string; pseudonym?: string; profileImage?: string};
};

const PAGE_SIZE = 30;

export function MarketComments({market,language}:{market:Market;language:Language}) {
  const [comments,setComments]=useState<PublicComment[]>([]);
  const [offset,setOffset]=useState(0);
  const [sort,setSort]=useState<'newest'|'oldest'>('newest');
  const [loading,setLoading]=useState(false);
  const [hasMore,setHasMore]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{setComments([]);setOffset(0);setHasMore(true);setError('');},[market.eventId,sort]);
  useEffect(()=>{
    if(!/^\d+$/.test(market.eventId))return;
    const controller=new AbortController();
    const url=new URL('https://gamma-api.polymarket.com/comments');
    url.searchParams.set('parent_entity_type','Event');
    url.searchParams.set('parent_entity_id',market.eventId);
    url.searchParams.set('limit',String(PAGE_SIZE));
    url.searchParams.set('offset',String(offset));
    url.searchParams.set('order','createdAt');
    url.searchParams.set('ascending',String(sort==='oldest'));
    setLoading(true);
    fetch(url,{signal:controller.signal}).then(response=>{if(!response.ok)throw new Error(`Comments unavailable (${response.status})`);return response.json();}).then((data:unknown)=>{
      if(!Array.isArray(data))throw new Error('Invalid comments response');
      const next=data.filter(item=>typeof item?.body==='string'&&item.body.trim()) as PublicComment[];
      setComments(previous=>offset===0?next:[...previous,...next.filter(item=>!previous.some(old=>old.id===item.id))]);
      setHasMore(data.length===PAGE_SIZE && offset<180);setError('');
    }).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Comments unavailable');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[market.eventId,offset,sort]);

  return <section className="atlas-market-comments" dir="ltr">
    <style>{`
      .atlas-market-comments{max-width:1160px;margin:40px auto;padding:0 24px 55px;color:#F4F6FA;font:13px 'DM Sans',Inter,system-ui,sans-serif}
      .atlas-comments-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #26303a;padding-bottom:13px}
      .atlas-comments-heading h2{margin:0;font-size:20px;font-weight:750;letter-spacing:-.3px}
      .atlas-comments-heading span{color:#91a0b3;font-size:12px}
      .atlas-comments-controls{display:flex;align-items:center;gap:18px;padding:12px 0 5px}
      .atlas-comments-controls button{color:#98A5B5;padding:8px 2px;border:0;border-bottom:2px solid transparent;background:transparent;font:600 12px inherit;cursor:pointer}
      .atlas-comments-controls button.active{color:#1463ff;border-bottom-color:#1463ff}.atlas-comments-controls button:hover{color:#EAA343}
      .atlas-comment{display:flex;gap:12px;padding:18px 0;border-bottom:1px solid #1d252e;max-width:760px}
      .atlas-comment-avatar{width:33px;height:33px;flex:none;border-radius:50%;object-fit:cover;background:#263442}
      .atlas-comment-avatar-fallback{display:grid;place-items:center;color:#A4B5C8;font-weight:800}
      .atlas-comment-copy{flex:1;min-width:0}.atlas-comment-author{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
      .atlas-comment-author strong{font-size:12px}.atlas-comment-author time{color:#7f8fa4;font-size:11px}
      .atlas-comment-copy p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;margin:7px 0 5px;color:#DCE4EF;font-size:13px}
      .atlas-comment-reactions{font-size:11px;color:#7f8fa4}
      .atlas-comments-load{border:1px solid #29313D;background:#15191F;color:#E6EEFA;border-radius:8px;padding:11px 18px;margin-top:20px;cursor:pointer}
      .atlas-comments-load:hover{border-color:#1463ff}.atlas-comments-note{color:#8292a7;font-size:11px;line-height:1.6;margin:10px 0}
      @media(max-width:700px){.atlas-market-comments{padding:0 15px 40px;margin-top:25px}.atlas-comment{gap:9px}}
    `}</style>
    <div className="atlas-comments-heading"><h2>Community comments <span>({comments.length}{hasMore?'+':''})</span></h2><span>Public discussion for this market</span></div>
    <div className="atlas-comments-controls"><button className={sort==='newest'?'active':''} onClick={()=>setSort('newest')}>Newest</button><button className={sort==='oldest'?'active':''} onClick={()=>setSort('oldest')}>Oldest</button></div>
    {comments.map(comment=><article className="atlas-comment" key={comment.id}>
      {comment.profile?.profileImage?<img className="atlas-comment-avatar" src={comment.profile.profileImage} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<div className="atlas-comment-avatar atlas-comment-avatar-fallback">●</div>}
      <div className="atlas-comment-copy"><div className="atlas-comment-author"><strong>{comment.profile?.name||comment.profile?.pseudonym||'Market participant'}</strong><time dateTime={comment.createdAt}>{Number.isFinite(Date.parse(comment.createdAt))?new Date(comment.createdAt).toLocaleString(language,{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</time></div><p>{comment.body}</p><span className="atlas-comment-reactions">{typeof comment.reactionCount==='number'?`♡ ${comment.reactionCount} reactions`:'Community discussion'}</span></div>
    </article>)}
    {loading&&<p className="atlas-comments-note">Loading real comments…</p>}
    {error&&<p className="atlas-comments-note">{error} · Please try again later.</p>}
    {!loading&&!error&&comments.length===0&&<p className="atlas-comments-note">No public comments are available for this market yet.</p>}
    {!loading&&hasMore&&comments.length>0&&<button className="atlas-comments-load" onClick={()=>setOffset(current=>current+PAGE_SIZE)}>Load more comments ↓</button>}
    <p className="atlas-comments-note">Community discussions are provided for market context. Posting and trading are not connected in this preview.</p>
  </section>;
}
