(()=>{var a={};a.id=612,a.ids=[612],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},1630:a=>{"use strict";a.exports=require("http")},1645:a=>{"use strict";a.exports=require("net")},1820:a=>{"use strict";a.exports=require("os")},3033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3383:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>J,patchFetch:()=>I,routeModule:()=>E,serverHooks:()=>H,workAsyncStorage:()=>F,workUnitAsyncStorage:()=>G});var d={};c.r(d),c.d(d,{POST:()=>D,runtime:()=>B});var e=c(5736),f=c(9117),g=c(4044),h=c(6945),i=c(2324),j=c(261),k=c(4290),l=c(5328),m=c(8928),n=c(6595),o=c(3421),p=c(7679),q=c(1681),r=c(3446),s=c(6439),t=c(1356),u=c(7598),v=c.n(u),w=c(9507),x=c(7143),y=c(7377),z=c(6147),A=c(8828);let B="nodejs",C=w.Ikc({name:w.YjP().min(2).max(80).trim(),email:w.YjP().email().max(255).trim(),password:w.YjP().min(8).max(128)});async function D(a){try{let b=C.parse(await a.json());if(await x.db.user.findUnique({where:{email:b.email}}))return(0,y.F)("FORBIDDEN","Email j\xe1 cadastrado",409);let c=await (0,z.Er)(b.password),d=await x.db.user.create({data:{name:b.name,email:b.email,passwordHash:c,verified:!1}}),e=v().randomBytes(32).toString("hex"),f=new Date(Date.now()+864e5);await x.db.verificationToken.create({data:{userId:d.id,token:e,expiresAt:f}});let g=`https://starfinweb.netlify.app/verify-email?token=${e}`;await (0,A.sj)({to:d.email,subject:"Bem-vindo! Confirme seu email - Starfin",html:(0,A.bX)(d.name,g)});let h=(0,z.No)({userId:d.id,role:d.role});return(0,y.h)({token:h,user:{id:d.id,name:d.name,email:d.email,role:d.role,verified:d.verified,createdAt:d.createdAt.toISOString()}},201)}catch(a){if(a instanceof w.GaX)return(0,y.F)("INVALID_INPUT","Entrada inv\xe1lida",400,a.flatten());return(0,y.F)("INTERNAL_ERROR","Erro interno",500)}}let E=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/auth/register/route",pathname:"/api/auth/register",filename:"route",bundlePath:"app/api/auth/register/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\alanl\\Downloads\\Marketplace\\app\\api\\auth\\register\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:F,workUnitAsyncStorage:G,serverHooks:H}=E;function I(){return(0,g.patchFetch)({workAsyncStorage:F,workUnitAsyncStorage:G})}async function J(a,b,c){var d;let e="/api/auth/register/route";"/index"===e&&(e="/");let g=await E.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,D=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[D]||y.routes[C]);if(F&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||E.isDev||x||(G="/index"===(G=C)?"/":G);let H=!0===E.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>E.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>E.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await E.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await E.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.U)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await E.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},3873:a=>{"use strict";a.exports=require("path")},4075:a=>{"use strict";a.exports=require("zlib")},4631:a=>{"use strict";a.exports=require("tls")},4735:a=>{"use strict";a.exports=require("events")},4870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4985:a=>{"use strict";a.exports=require("dns")},5511:a=>{"use strict";a.exports=require("crypto")},5591:a=>{"use strict";a.exports=require("https")},6147:(a,b,c)=>{"use strict";c.d(b,{BE:()=>l,Er:()=>k,JR:()=>n,No:()=>m,ZT:()=>o});var d=c(7028),e=c(8318),f=c.n(e),g=c(9507),h=c(7143);let i=process.env.JWT_SECRET??"",j=g.Ikc({sub:g.YjP(),role:g.k5n(["user","admin"]).default("user"),iat:g.aig().optional(),exp:g.aig().optional()});async function k(a){return d.Ay.hash(a,12)}async function l(a,b){return d.Ay.compare(a,b)}function m(a){if(!i)throw Error("JWT_SECRET is not configured");return f().sign({sub:a.userId,role:a.role??"user"},i,{expiresIn:"30d"})}async function n(a){let b=function(a){if(!a)return null;let[b,c]=a.split(" ");return"Bearer"===b&&c?c:null}(a);if(!b)return null;let c=function(a){try{if(!i)return null;let b=f().verify(a,i);return j.parse(b)}catch{return null}}(b);if(!c)return null;let d=await h.db.user.findUnique({where:{id:c.sub}});return d?{user:d,role:d.role}:null}async function o(a){let b=await n(a);return b&&"admin"===b.role?b:null}},6330:a=>{"use strict";a.exports=require("@prisma/client")},6439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},6487:()=>{},7143:(a,b,c)=>{"use strict";c.d(b,{db:()=>e});var d=c(6330);let e=globalThis.__prisma__??new d.PrismaClient({log:["error","warn"]})},7377:(a,b,c)=>{"use strict";c.d(b,{F:()=>f,h:()=>e});var d=c(641);function e(a,b){return d.NextResponse.json(a,"number"==typeof b?{status:b}:b)}function f(a,b,c,e){let f="number"==typeof c?c:c?.status,g="number"==typeof c?{status:c}:c??{};return d.NextResponse.json({error:{code:a,message:b,status:f??500,details:e??null}},g)}},7598:a=>{"use strict";a.exports=require("node:crypto")},7910:a=>{"use strict";a.exports=require("stream")},8335:()=>{},8354:a=>{"use strict";a.exports=require("util")},8828:(a,b,c)=>{"use strict";c.d(b,{bX:()=>h,cK:()=>i,sj:()=>g,tk:()=>j});let d=c(2731).createTransport({host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT||"587"),secure:"true"===process.env.SMTP_SECURE,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),e=process.env.SMTP_FROM||'"Starfin Plugins" <noreply@starfinplugins.com>',f=a=>`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starfin Plugins</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #13131a; border: 1px solid #7b2cbf33; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #7b2cbf 0%, #3c096c 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800;">Starfin<span style="color: #c77dff;">Plugins</span></h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${a}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #0b0b0f; border-top: 1px solid #7b2cbf22;">
              <p style="margin: 0; color: #666666; font-size: 14px;">&copy; 2026 Starfin Plugins. Todos os direitos reservados.</p>
              <div style="margin-top: 15px;">
                <a href="https://starfinweb.netlify.app" style="color: #c77dff; text-decoration: none; font-size: 12px; margin: 0 10px;">Website</a>
                <a href="#" style="color: #c77dff; text-decoration: none; font-size: 12px; margin: 0 10px;">Discord</a>
                <a href="#" style="color: #c77dff; text-decoration: none; font-size: 12px; margin: 0 10px;">Suporte</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;async function g(a){try{let b=await d.sendMail({from:e,to:a.to,subject:a.subject,html:a.html});return console.log("Email sent: %s",b.messageId),{success:!0,messageId:b.messageId}}catch(a){return console.error("Error sending email:",a),{success:!1,error:a}}}function h(a,b){return f(`
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Ol\xe1, ${a}!</h2>
    <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Obrigado por se juntar \xe0 <strong>Starfin Plugins</strong>. Estamos felizes em ter voc\xea conosco! 
      Para ativar sua conta e liberar o acesso aos seus plugins, clique no bot\xe3o abaixo para confirmar seu email:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${b}" style="background: linear-gradient(to right, #7b2cbf, #9d4edd); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(123, 44, 191, 0.4);">
            Ativar Minha Conta
          </a>
        </td>
      </tr>
    </table>
    <p style="color: #666666; font-size: 14px; margin-top: 40px; text-align: center;">
      Se o bot\xe3o n\xe3o funcionar, copie este link: <br>
      <span style="color: #7b2cbf;">${b}</span>
    </p>
  `)}function i(a,b){return f(`
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Recuperar Senha</h2>
    <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Ol\xe1 ${a}, recebemos uma solicita\xe7\xe3o para redefinir a senha da sua conta. 
      Se voc\xea n\xe3o solicitou isso, pode ignorar este email com seguran\xe7a. O link abaixo \xe9 v\xe1lido por 1 hora.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${b}" style="background-color: #1a1a22; border: 1px solid #7b2cbf; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </td>
      </tr>
    </table>
  `)}function j(a,b,c,d){return f(`
    <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 10px;">Obrigado pela compra!</h2>
    <p style="color: #a0a0a8; font-size: 14px; margin-bottom: 30px;">Pedido #${b.slice(-6).toUpperCase()}</p>
    
    <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Produto adquirido</p>
      <h3 style="color: #ffffff; font-size: 20px; margin: 0 0 20px 0;">${c}</h3>
      
      <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Sua Chave de Licen\xe7a</p>
      <div style="background-color: #0b0b0f; border: 1px dashed #7b2cbf; border-radius: 8px; padding: 15px; text-align: center;">
        <code style="color: #ffffff; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${d}</code>
      </div>
    </div>

    <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Sua licen\xe7a j\xe1 est\xe1 ativa e vinculada \xe0 sua conta. Voc\xea j\xe1 pode configurar o plugin em seu servidor Minecraft!
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="https://starfinweb.netlify.app/account" style="background: linear-gradient(to right, #7b2cbf, #9d4edd); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
            Acessar Meus Plugins
          </a>
        </td>
      </tr>
    </table>
  `)}},9021:a=>{"use strict";a.exports=require("fs")},9121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},9294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},9428:a=>{"use strict";a.exports=require("buffer")},9551:a=>{"use strict";a.exports=require("url")},9646:a=>{"use strict";a.exports=require("child_process")}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[964,507,477,112],()=>b(b.s=3383));module.exports=c})();