export async function onRequest(){
  return new Response(JSON.stringify({ok:true,build:'boostr-live-fix-v2',commit_hint:'444f791',generated_at:'2026-07-12T05:05:00Z'}),{
    status:200,
    headers:{'content-type':'application/json; charset=UTF-8','cache-control':'no-store'}
  });
}
