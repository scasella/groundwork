// Identity is trusted only when this Worker is behind the Sites dispatcher.
// Leave the runtime flag unset on generic/self-hosted deployments.
export function accountResponse(request,env={}) {
  if(new URL(request.url).pathname!=='/api/session')return null;
  if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
  const available=env.GROUNDWORK_CHATGPT_AUTH==='enabled';
  const id=request.headers.get('oai-authenticated-user-id');
  const email=request.headers.get('oai-authenticated-user-email');
  const user=available&&id?.trim()&&email?.trim()?{id}:null;
  return Response.json({available,user},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie, oai-authenticated-user-id, oai-authenticated-user-email','X-Content-Type-Options':'nosniff'}});
}
