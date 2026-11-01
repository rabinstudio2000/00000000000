/* DON.AREZ orbital atmosphere — canvas projection, no external dependencies. */
(()=>{
 const canvas=document.createElement('canvas');canvas.className='ambient-canvas';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let w=0,h=0,dpr=1,frame=0,last=0,clock=0,scroll=0,targetX=0,targetY=0,pointerX=0,pointerY=0,stars=[],dust=[];
 const rnd=(a,b)=>a+Math.random()*(b-a),phi=(1+Math.sqrt(5))/2;
 const vertices=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]];
 const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 const norm=p=>{const m=Math.hypot(...p);return p.map(x=>x/m)};
 const meshPoints=vertices.map(norm),meshEdges=new Set(),addEdge=(a,b)=>meshEdges.add(a<b?`${a},${b}`:`${b},${a}`),midCache=new Map();
 function midpoint(a,b){const key=a<b?`${a},${b}`:`${b},${a}`;if(midCache.has(key))return midCache.get(key);const p=norm(meshPoints[a].map((n,i)=>(n+meshPoints[b][i])/2));const index=meshPoints.push(p)-1;midCache.set(key,index);return index}
 for(const [a,b,c] of faces){const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);for(const [x,y] of [[a,ab],[ab,b],[b,bc],[bc,c],[c,ca],[ca,a],[ab,bc],[bc,ca],[ca,ab]])addEdge(x,y)}
 const edges=[...meshEdges].map(e=>e.split(',').map(Number));
 function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.7);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);let n=w<700?110:230;stars=Array.from({length:n},()=>({x:Math.random(),y:Math.random(),r:rnd(.25,1.1),phase:rnd(0,7),speed:rnd(.2,.8),alpha:rnd(.08,.5)}));dust=Array.from({length:w<700?150:310},()=>({a:rnd(0,Math.PI*2),radius:rnd(2.4,8),y:rnd(-4.5,4.5),size:rnd(.4,1.5),speed:rnd(.04,.17),phase:rnd(0,6)}));if(motion.matches)draw(0)}
 function rot([x,y,z],ax,ay,az=0){let c=Math.cos(ax),s=Math.sin(ax);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(ay);s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(az);s=Math.sin(az);return[x*c-y*s,x*s+y*c,z]}
 function draw(ms){if(!w)return;if(last&&!motion.matches)clock+=Math.min((ms-last)/1000,.05);last=ms;pointerX+=(targetX-pointerX)*.04;pointerY+=(targetY-pointerY)*.04;const progress=Math.min(1,scroll/Math.max(1,document.documentElement.scrollHeight-innerHeight));const scale=Math.min(w,h)*(.095+progress*.012),cx=w*(w<700?.59:.66)+pointerX*26,cy=h*.47+pointerY*18-progress*h*.12,angle=clock*.105+progress*2.3,tilt=.16*Math.sin(clock*.18)+progress*.35;
 ctx.clearRect(0,0,w,h);
 let glow=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.47);glow.addColorStop(0,'rgba(106,79,42,.085)');glow.addColorStop(.45,'rgba(77,58,34,.035)');glow.addColorStop(1,'rgba(20,18,14,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 for(const p of stars){const a=p.alpha*(.65+.35*Math.sin(clock*p.speed+p.phase));ctx.fillStyle=`rgba(233,228,216,${a})`;ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fill()}
 const project=([x,y,z])=>{const perspective=10/(10+z);return[cx+x*scale*perspective,cy+y*scale*perspective,perspective]};
 for(const p of dust){const a=p.a+clock*p.speed*.12+progress*.5, xyz=rot([Math.cos(a)*p.radius,p.y+Math.sin(clock*.14+p.phase)*.13,Math.sin(a)*p.radius*.65],tilt,angle*.3);const [x,y,k]=project(xyz),alpha=Math.max(.02,Math.min(.38,.1*k));ctx.fillStyle=`rgba(201,166,107,${alpha})`;ctx.beginPath();ctx.arc(x,y,p.size*k,0,Math.PI*2);ctx.fill()}
 const rings=[[4.6,1.34,.2,1,.28],[3.4,1.08,-.5,.78,.38],[5.6,1.5,.65,.62,.19],[4.05,1.19,-.16,.35,.12]];
 for(const [radius,ax,az,length,alpha] of rings){ctx.beginPath();for(let i=0;i<=144;i++){const a=i/144*Math.PI*2*length;let p=rot([Math.cos(a)*radius,0,Math.sin(a)*radius],ax,0,az);p=rot(p,tilt,angle);const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=`rgba(201,166,107,${alpha})`;ctx.lineWidth=.8;ctx.stroke();for(let n=0;n<3;n++){let a=(clock*(.055+n*.018)+n*2.1)% (Math.PI*2*length);let p=rot(rot([Math.cos(a)*radius,0,Math.sin(a)*radius],ax,0,az),tilt,angle),[x,y,k]=project(p);ctx.beginPath();ctx.fillStyle=`rgba(235,202,139,${alpha+.17})`;ctx.arc(x,y,1.5*k,0,Math.PI*2);ctx.fill()}}
 function wire(radius,ax,ay,color,alpha){const pts=meshPoints.map(v=>project(rot(v.map(x=>x*radius),ax,ay)));ctx.beginPath();for(const [a,b] of edges){ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1])}ctx.strokeStyle=`rgba(${color},${alpha})`;ctx.lineWidth=.8;ctx.stroke()}
 wire(1.25,clock*.14+tilt,-clock*.25+angle,'201,166,107',.38);wire(1.8,-clock*.07,clock*.09+angle*.5,'233,228,216',.12);
 const core=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*.8);core.addColorStop(0,'rgba(214,173,100,.12)');core.addColorStop(1,'rgba(214,173,100,0)');ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,scale*.8,0,Math.PI*2);ctx.fill();
 if(!motion.matches&&!document.hidden)frame=requestAnimationFrame(draw)}
 addEventListener('resize',resize,{passive:true});addEventListener('scroll',()=>{scroll=scrollY;if(motion.matches)draw(0)},{passive:true});addEventListener('pointermove',e=>{targetX=e.clientX/w-.5;targetY=e.clientY/h-.5},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);last=0}else if(!motion.matches){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)}});motion.addEventListener?.('change',()=>{cancelAnimationFrame(frame);last=0;draw(0)});resize();if(!motion.matches)frame=requestAnimationFrame(draw)
})();
