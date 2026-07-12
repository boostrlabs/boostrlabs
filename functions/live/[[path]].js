export async function onRequest({request,env}){
  const url=new URL(request.url);
  if(url.pathname==='/live' || url.pathname==='/live/'){
    return env.ASSETS.fetch(new Request(new URL('/live/index.html',url.origin),request));
  }
  const slug=url.pathname.split('/').filter(Boolean).slice(1).join('/');
  const viewer=new URL('/live/index.html',url.origin);
  if(slug)viewer.searchParams.set('room',slug);
  return env.ASSETS.fetch(new Request(viewer,request));
}
