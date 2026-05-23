/* ================================================================
   CHAPTER 4 — INTERACTIVE APPLICATION DEMOS (Computer Vision / CNN)
   6 demos — ENHANCED v2 with scanning animations, bounding boxes,
   heatmaps, and real-time detection simulations
   ================================================================ */
(function(){
'use strict';
const CE=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const rand=(a,b)=>Math.random()*(b-a)+a;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const colors={teal:'#00d4aa',cyan:'#0ea5e9',amber:'#f59e0b',purple:'#a855f7',red:'#ef4444',green:'#22c55e',text:'rgba(255,255,255,.75)',muted:'rgba(255,255,255,.4)',border:'rgba(255,255,255,.08)'};
function openOverlay(title,icon,buildFn){let ov=document.querySelector('.app-demo-overlay');if(!ov){ov=CE('div','app-demo-overlay');document.body.appendChild(ov);}ov.innerHTML='';const hdr=CE('div','app-demo-overlay__header');const ttl=CE('div','app-demo-overlay__title');ttl.innerHTML='<i class="fa-solid '+icon+'"></i> '+title;const cb=CE('button','app-demo-overlay__close');cb.innerHTML='<i class="fa-solid fa-xmark"></i> Close';cb.onclick=()=>{ov.classList.remove('active');if(ov._raf)cancelAnimationFrame(ov._raf);};hdr.append(ttl,cb);const body=CE('div','app-demo-overlay__body');const mp=CE('div','app-demo-panel app-demo-panel--main');const sp=CE('div','app-demo-panel app-demo-panel--side');body.append(mp,sp);ov.append(hdr,body);const cw=CE('div','app-demo-canvas-wrap');const canvas=document.createElement('canvas');cw.appendChild(canvas);mp.appendChild(cw);const ca=CE('div','app-demo-controls');mp.appendChild(ca);requestAnimationFrame(()=>{ov.classList.add('active');canvas.width=cw.clientWidth||700;canvas.height=cw.clientHeight||400;buildFn({canvas,ctx:canvas.getContext('2d'),W:canvas.width,H:canvas.height,mainPanel:mp,sidePanel:sp,ctrlArea:ca,cWrap:cw,overlay:ov});});document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){ov.classList.remove('active');if(ov._raf)cancelAnimationFrame(ov._raf);document.removeEventListener('keydown',esc);}});}
function addSlider(p,l,mn,mx,v,st,cb){const r=CE('div','app-demo-slider-row');r.innerHTML='<label>'+l+'</label><input type="range" min="'+mn+'" max="'+mx+'" value="'+v+'" step="'+(st||1)+'"><span class="val">'+v+'</span>';const i=r.querySelector('input'),s=r.querySelector('.val');i.addEventListener('input',()=>{s.textContent=(+i.value).toFixed(st<1?2:0);cb(+i.value);});p.appendChild(r);return i;}
function addBtn(p,l,c,cb){const b=CE('button','app-demo-btn'+(c?' app-demo-btn--'+c:''));b.innerHTML=l;b.onclick=cb;p.appendChild(b);return b;}
function addInfo(p,h){const d=CE('div','app-demo-info');d.innerHTML=h;p.appendChild(d);return d;}
function addMetrics(p,items){const g=CE('div','app-demo-metrics');const els={};items.forEach(it=>{const m=CE('div','app-demo-metric');m.innerHTML='<div class="app-demo-metric__value">'+it.val+'</div><div class="app-demo-metric__label">'+it.label+'</div>';g.appendChild(m);els[it.id]=m.querySelector('.app-demo-metric__value');});p.appendChild(g);return els;}
function addLog(p){const log=CE('div','app-demo-log');log.innerHTML='<span class="log-info">[SYS]</span> Ready.\n';p.appendChild(log);return{el:log,add(m,t='info'){const s=document.createElement('span');s.className='log-'+t;s.textContent='['+t.toUpperCase()+']';log.appendChild(s);log.appendChild(document.createTextNode(' '+m+'\n'));log.scrollTop=log.scrollHeight;},clear(){log.innerHTML='';}};}
function addTabs(p,tabs,cb){const w=CE('div','app-demo-tabs');tabs.forEach((t,i)=>{const b=CE('button','app-demo-tab'+(i===0?' active':''));b.textContent=t;b.onclick=()=>{w.querySelectorAll('.app-demo-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');cb(i);};w.appendChild(b);});p.appendChild(w);}
function drawGlow(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'40');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function makeParticles(n,W,H,color){return Array.from({length:n},()=>({x:rand(0,W),y:rand(0,H),vx:rand(-0.3,0.3),vy:rand(-0.3,0.3),r:rand(1,2.5),life:rand(0.3,1),color}));}
function drawParticles(ctx,P,W,H){P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=0.003;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;if(p.life<=0){p.x=rand(0,W);p.y=rand(0,H);p.life=1;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color+Math.floor(p.life*30).toString(16).padStart(2,'0');ctx.fill();});}

/* ================================================================
   DEMO 1: CRACK DETECTOR (CNN) — animated scanning beam
   ================================================================ */
function buildCrackDetector(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-magnifying-glass"></i> CNN Crack Detector'}));
    addInfo(sp,'<strong>CNN</strong> scans a concrete surface for cracks. Watch the scanning beam sweep across the image and detect crack patterns in real-time with confidence scores.');
    const met=addMetrics(sp,[{id:'total',val:'0',label:'Cracks Found'},{id:'severity',val:'—',label:'Max Severity'},{id:'area',val:'—',label:'Crack Area %'},{id:'conf',val:'—',label:'Avg Confidence'},{id:'fps',val:'30',label:'FPS'},{id:'status',val:'Idle',label:'Status'}]);
    const log=addLog(sp);
    let scanX=-1,scanning=false,threshold=0.5;
    let cracks=[],detections=[],particles=makeParticles(8,W,H,colors.red);

    function genCracks(){
        cracks=[];
        for(let i=0;i<8;i++){const x=rand(30,W-30);const y=rand(30,H-30);const len=rand(30,120);const angle=rand(-0.5,0.5);const width=rand(1,4);const severity=width>3?'Severe':width>2?'Moderate':'Hairline';cracks.push({x,y,len,angle,width,severity,conf:rand(0.6,0.99)});}
        log.add('Generated '+cracks.length+' synthetic crack patterns','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        // Concrete texture
        ctx.fillStyle='#3a3a3a';ctx.fillRect(0,0,W,H);
        for(let i=0;i<200;i++){ctx.fillStyle='rgba('+(rand(40,70))+','+(rand(40,70))+','+(rand(40,70))+',0.3)';ctx.fillRect(rand(0,W),rand(0,H),rand(2,8),rand(2,8));}
        drawParticles(ctx,particles,W,H);

        // Draw cracks
        cracks.forEach(cr=>{ctx.strokeStyle='rgba(30,30,30,0.9)';ctx.lineWidth=cr.width;ctx.beginPath();
            ctx.moveTo(cr.x,cr.y);const endX=cr.x+cr.len*Math.cos(cr.angle);const endY=cr.y+cr.len*Math.sin(cr.angle);
            // Jagged line
            for(let t=0.1;t<=1;t+=0.1){const px=lerp(cr.x,endX,t)+rand(-3,3);const py=lerp(cr.y,endY,t)+rand(-2,2);ctx.lineTo(px,py);}ctx.stroke();
            // Shadow
            ctx.strokeStyle='rgba(20,20,20,0.3)';ctx.lineWidth=cr.width+2;ctx.beginPath();ctx.moveTo(cr.x+1,cr.y+1);ctx.lineTo(endX+1,endY+1);ctx.stroke();
        });

        // Scanning beam
        if(scanning&&scanX<W){
            scanX+=3;
            // Scan line
            ctx.strokeStyle=colors.teal+'80';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(scanX,0);ctx.lineTo(scanX,H);ctx.stroke();
            // Glow behind scan
            const g=ctx.createLinearGradient(scanX-30,0,scanX,0);g.addColorStop(0,'rgba(0,212,170,0)');g.addColorStop(1,'rgba(0,212,170,0.15)');ctx.fillStyle=g;ctx.fillRect(scanX-30,0,30,H);
            // Check for crack detections
            cracks.forEach(cr=>{if(Math.abs(cr.x-scanX)<5&&cr.conf>=threshold&&!detections.find(d=>d.crack===cr)){detections.push({crack:cr,x:cr.x,y:cr.y,opacity:0});met.total.textContent=detections.length;log.add('Crack detected at ('+cr.x.toFixed(0)+','+cr.y.toFixed(0)+') — '+cr.severity+' ['+Math.round(cr.conf*100)+'%]','ok');}});
            met.status.textContent='Scanning...';met.status.style.color=colors.teal;
            if(scanX>=W){scanning=false;met.status.textContent='Complete';met.status.style.color=colors.green;
                const sevCounts={Severe:0,Moderate:0,Hairline:0};detections.forEach(d=>sevCounts[d.crack.severity]++);
                met.severity.textContent=sevCounts.Severe>0?'Severe':sevCounts.Moderate>0?'Moderate':'Hairline';
                met.severity.style.color=sevCounts.Severe>0?colors.red:sevCounts.Moderate>0?colors.amber:colors.teal;
                met.area.textContent=(detections.length*0.8).toFixed(1)+'%';
                met.conf.textContent=(detections.reduce((s,d)=>s+d.crack.conf,0)/Math.max(1,detections.length)*100).toFixed(0)+'%';
                log.add('Scan complete: '+detections.length+' cracks detected','ok');}
        }
        // Detection bounding boxes
        detections.forEach(det=>{det.opacity=Math.min(1,det.opacity+0.05);const cr=det.crack;const bx=cr.x-15;const by=cr.y-15;const bw=cr.len+30;const bh=30;
            ctx.strokeStyle=cr.severity==='Severe'?colors.red:cr.severity==='Moderate'?colors.amber:colors.teal;ctx.lineWidth=2;ctx.globalAlpha=det.opacity;ctx.strokeRect(bx,by,bw,bh);
            // Label
            ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(bx,by-18,90,16);ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';ctx.fillText(cr.severity+' '+Math.round(cr.conf*100)+'%',bx+3,by-6);ctx.globalAlpha=1;
        });
        // Scanned region tint
        if(scanX>0){ctx.fillStyle='rgba(0,212,170,0.03)';ctx.fillRect(0,0,scanX,H);}
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Confidence Threshold',0.3,0.95,0.5,0.05,v=>{threshold=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> New Surface','',()=>{genCracks();detections=[];scanX=-1;scanning=false;met.total.textContent='0';met.status.textContent='Idle';});
    addBtn(br,'<i class="fa-solid fa-play"></i> Start Scan','accent',()=>{scanX=0;scanning=true;detections=[];met.total.textContent='0';log.add('Starting CNN inference scan...','info');});
    addBtn(br,'<i class="fa-solid fa-forward"></i> Instant Scan','',()=>{scanX=W;scanning=false;detections=[];cracks.forEach(cr=>{if(cr.conf>=threshold)detections.push({crack:cr,x:cr.x,y:cr.y,opacity:1});});met.total.textContent=detections.length;met.status.textContent='Complete';});
    ca.appendChild(br);
    addTabs(sp,['CNN Model','Crack Types','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Convolutional Neural Network</strong><br><br>Architecture: ResNet-50 backbone<br>Input: 224×224 image patches<br>Output: crack/no-crack + bbox regression<br><br>Scanning beam simulates sliding window inference.<br>Green = detected, sized by severity.<br>Confidence threshold filters false positives.',
        '<strong>Crack Classification</strong><br><br>• <strong style="color:'+colors.teal+'">Hairline:</strong> <0.1mm, cosmetic only<br>• <strong style="color:'+colors.amber+'">Moderate:</strong> 0.1-0.3mm, monitor<br>• <strong style="color:'+colors.red+'">Severe:</strong> >0.3mm, structural concern<br><br>IS 456: max crack width 0.2mm (moderate exposure)<br>Crack growth rate also important.',
        '<strong>Bridge & Building Inspection</strong><br><br>• Drone-mounted camera → CNN inference<br>• Automated crack mapping and tracking<br>• Reduces manual inspection time by 80%<br>• Consistent and objective assessment<br>• Integration with BIM for maintenance planning'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>CNN Scanner</strong> — Click "Start Scan" to watch the beam detect cracks. Adjust threshold to filter.'}));
    genCracks();draw();
}

/* ================================================================
   DEMO 2: DEFECT LOCALIZER (YOLO) — bounding box detection
   ================================================================ */
function buildDefectLocalizer(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-crosshairs"></i> YOLO Defect Localizer'}));
    addInfo(sp,'<strong>YOLOv8</strong> real-time defect detection with bounding boxes, NMS filtering, and multi-class identification on structural elements.');
    const met=addMetrics(sp,[{id:'objects',val:'0',label:'Detections'},{id:'nms',val:'—',label:'Post-NMS'},{id:'iou',val:'0.5',label:'IoU Threshold'},{id:'time',val:'—',label:'Inference (ms)'},{id:'mAP',val:'87.3%',label:'mAP@0.5'},{id:'fps',val:'—',label:'FPS'}]);
    const log=addLog(sp);
    let defects=[],iouThresh=0.5,confThresh=0.4;
    let particles=makeParticles(8,W,H,colors.amber);
    const defectTypes=['Spalling','Corrosion','Delamination','Honeycombing','Efflorescence','Rebar Exposed'];
    const defectColors=[colors.red,'#f97316',colors.amber,colors.purple,colors.cyan,'#ec4899'];

    function genDefects(){
        defects=[];const n=Math.floor(rand(5,12));
        for(let i=0;i<n;i++){const w=rand(40,120);const h=rand(30,90);defects.push({x:rand(20,W-w-20),y:rand(20,H-h-20),w,h,type:Math.floor(rand(0,6)),conf:rand(0.3,0.98),visible:false,animProgress:0});}
        log.add('Generated scene with '+n+' potential defects','ok');
    }
    function nms(){
        const sorted=[...defects].filter(d=>d.conf>=confThresh).sort((a,b)=>b.conf-a.conf);
        const keep=[];
        sorted.forEach(det=>{let dominated=false;
            keep.forEach(k=>{const x1=Math.max(det.x,k.x);const y1=Math.max(det.y,k.y);const x2=Math.min(det.x+det.w,k.x+k.w);const y2=Math.min(det.y+det.h,k.y+k.h);const inter=Math.max(0,x2-x1)*Math.max(0,y2-y1);const union=det.w*det.h+k.w*k.h-inter;if(inter/union>iouThresh)dominated=true;});
            if(!dominated)keep.push(det);});
        return keep;
    }
    let detected=false;
    function draw(){
        ctx.clearRect(0,0,W,H);
        // Structure background (concrete beam)
        ctx.fillStyle='#4a4a4a';ctx.fillRect(0,0,W,H);
        for(let i=0;i<300;i++){ctx.fillStyle='rgba('+(rand(50,80))+','+(rand(50,80))+','+(rand(50,80))+',0.2)';ctx.fillRect(rand(0,W),rand(0,H),rand(1,5),rand(1,5));}
        // Beam outline
        ctx.strokeStyle='#5a5a5a';ctx.lineWidth=2;ctx.strokeRect(20,H*0.3,W-40,H*0.4);
        ctx.fillStyle=colors.muted;ctx.font='10px Inter';ctx.textAlign='center';ctx.fillText('RC Beam — Structural Element',W/2,H*0.3-8);
        drawParticles(ctx,particles,W,H);

        // Defect markers (simulate visual damage)
        defects.forEach(det=>{const color=defectColors[det.type]+'20';ctx.fillStyle=color;ctx.fillRect(det.x,det.y,det.w,det.h);});

        // Detection boxes
        if(detected){
            const kept=nms();met.nms.textContent=kept.length;met.time.textContent=Math.floor(rand(12,35));met.fps.textContent=Math.floor(rand(25,60));
            const t=Date.now()*0.003;
            kept.forEach(det=>{det.animProgress=Math.min(1,det.animProgress+0.04);const a=det.animProgress;
                const color=defectColors[det.type];
                // Bounding box with animated corner marks
                ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=a;ctx.strokeRect(det.x,det.y,det.w,det.h);
                // Corner brackets
                const cl=10;ctx.lineWidth=3;
                ctx.beginPath();ctx.moveTo(det.x,det.y+cl);ctx.lineTo(det.x,det.y);ctx.lineTo(det.x+cl,det.y);ctx.stroke();
                ctx.beginPath();ctx.moveTo(det.x+det.w-cl,det.y);ctx.lineTo(det.x+det.w,det.y);ctx.lineTo(det.x+det.w,det.y+cl);ctx.stroke();
                ctx.beginPath();ctx.moveTo(det.x+det.w,det.y+det.h-cl);ctx.lineTo(det.x+det.w,det.y+det.h);ctx.lineTo(det.x+det.w-cl,det.y+det.h);ctx.stroke();
                ctx.beginPath();ctx.moveTo(det.x+cl,det.y+det.h);ctx.lineTo(det.x,det.y+det.h);ctx.lineTo(det.x,det.y+det.h-cl);ctx.stroke();
                // Label
                const label=defectTypes[det.type]+' '+Math.round(det.conf*100)+'%';
                ctx.fillStyle='rgba(0,0,0,0.85)';const tw=ctx.measureText(label).width+10;ctx.fillRect(det.x,det.y-18,tw,16);
                ctx.fillStyle=color;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';ctx.fillText(label,det.x+5,det.y-6);
                ctx.globalAlpha=1;
                // Center crosshair
                const cx=det.x+det.w/2,cy=det.y+det.h/2;
                ctx.strokeStyle=color+'40';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(cx-8,cy);ctx.lineTo(cx+8,cy);ctx.moveTo(cx,cy-8);ctx.lineTo(cx,cy+8);ctx.stroke();
            });
        }
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Confidence',0.1,0.9,0.4,0.05,v=>{confThresh=v;if(detected){const kept=nms();met.objects.textContent=defects.filter(d=>d.conf>=confThresh).length;met.nms.textContent=kept.length;}});
    addSlider(ca,'IoU Threshold',0.1,0.9,0.5,0.05,v=>{iouThresh=v;met.iou.textContent=v.toFixed(2);});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> New Scene','',()=>{genDefects();detected=false;met.objects.textContent='0';met.nms.textContent='—';});
    addBtn(br,'<i class="fa-solid fa-play"></i> Detect','accent',()=>{detected=true;defects.forEach(d=>d.animProgress=0);const count=defects.filter(d=>d.conf>=confThresh).length;met.objects.textContent=count;log.add('YOLOv8 detected '+count+' defects ('+nms().length+' after NMS)','ok');});
    ca.appendChild(br);
    addTabs(sp,['YOLO','NMS','Inspection'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>YOLOv8 Architecture</strong><br><br>• Single-pass detection (real-time)<br>• CSPDarknet backbone + FPN neck<br>• Anchor-free detection head<br>• Multi-scale feature maps (P3/P4/P5)<br>• End-to-end training on labeled defects<br>• mAP@0.5 = 87.3% on 5000 test images.',
        '<strong>Non-Maximum Suppression</strong><br><br>NMS removes duplicate detections:<br>1. Sort by confidence (descending)<br>2. Keep highest-conf box<br>3. Remove overlapping boxes (IoU > threshold)<br>4. Repeat until all processed<br><br>Higher IoU threshold → more boxes kept.<br>Lower → more aggressive suppression.',
        '<strong>Structural Inspection</strong><br><br>6 defect classes detected:<br>• <span style="color:'+colors.red+'">■</span> Spalling — surface loss<br>• <span style="color:#f97316">■</span> Corrosion — rebar rust<br>• <span style="color:'+colors.amber+'">■</span> Delamination — layer separation<br>• <span style="color:'+colors.purple+'">■</span> Honeycombing — void pockets<br>• <span style="color:'+colors.cyan+'">■</span> Efflorescence — salt deposits<br>• <span style="color:#ec4899">■</span> Rebar Exposed'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>YOLO Detector</strong> — Click "Detect" to run inference. Adjust confidence and IoU thresholds.'}));
    genDefects();draw();
}

/* ================================================================
   DEMO 3: DAMAGE SEGMENTER (U-Net) — pixel-level segmentation
   ================================================================ */
function buildDamageSegmenter(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-draw-polygon"></i> U-Net Damage Segmenter'}));
    addInfo(sp,'<strong>U-Net</strong> semantic segmentation of earthquake damage. Each pixel is classified into damage grade. Watch the segmentation mask build progressively.');
    const met=addMetrics(sp,[{id:'pixels',val:'—',label:'Total Pixels'},{id:'dmg',val:'—',label:'Damaged %'},{id:'grade',val:'—',label:'Max Grade'},{id:'iou',val:'—',label:'Mean IoU'},{id:'dice',val:'—',label:'Dice Score'},{id:'time',val:'—',label:'Inference (ms)'}]);
    const log=addLog(sp);
    let segMap=[],segW=0,segH=0,showOverlay=true,opacity=0.5;
    let scanLine=-1,scanning=false;
    let particles=makeParticles(8,W,H,colors.purple);
    const gradeColors=['rgba(0,0,0,0)','rgba(255,200,0,0.4)','rgba(255,140,0,0.5)','rgba(255,60,0,0.6)','rgba(200,0,0,0.7)'];
    const gradeNames=['None','Minor','Moderate','Major','Collapse'];

    function genSegMap(){
        segW=Math.floor(W/4);segH=Math.floor(H/4);segMap=[];
        for(let y=0;y<segH;y++){segMap[y]=[];for(let x=0;x<segW;x++){segMap[y][x]=0;}}
        // Paint damage zones
        for(let z=0;z<5;z++){const cx=Math.floor(rand(5,segW-5));const cy=Math.floor(rand(5,segH-5));const r=Math.floor(rand(3,12));const grade=Math.floor(rand(1,5));
            for(let dy=-r;dy<=r;dy++){for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy<r*r){const ny=cy+dy,nx=cx+dx;if(ny>=0&&ny<segH&&nx>=0&&nx<segW)segMap[ny][nx]=Math.max(segMap[ny][nx],grade-Math.floor(Math.sqrt(dx*dx+dy*dy)*0.5));}}}}
        met.pixels.textContent=(segW*segH);
        log.add('Generated '+segW+'x'+segH+' segmentation map','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        // Building facade
        ctx.fillStyle='#5a5a5a';ctx.fillRect(0,0,W,H);
        // Windows
        for(let r=0;r<4;r++){for(let c=0;c<6;c++){ctx.fillStyle='#3a4a5a';ctx.fillRect(40+c*(W-80)/6,40+r*(H-80)/4,40,50);}}
        drawParticles(ctx,particles,W,H);

        // Segmentation overlay
        if(showOverlay){
            const cellW=W/segW;const cellH=H/segH;
            const visibleLine=scanning?scanLine:segH;
            for(let y=0;y<Math.min(visibleLine,segH);y++){for(let x=0;x<segW;x++){if(segMap[y][x]>0){ctx.fillStyle=gradeColors[segMap[y][x]];ctx.globalAlpha=opacity;ctx.fillRect(x*cellW,y*cellH,cellW+1,cellH+1);ctx.globalAlpha=1;}}}
            // Scan line
            if(scanning&&scanLine<segH){scanLine+=0.5;if(scanLine>=segH){scanning=false;
                let dmgCount=0,maxG=0;for(let y=0;y<segH;y++){for(let x=0;x<segW;x++){if(segMap[y][x]>0)dmgCount++;maxG=Math.max(maxG,segMap[y][x]);}}
                met.dmg.textContent=(dmgCount/(segW*segH)*100).toFixed(1)+'%';met.grade.textContent=gradeNames[maxG];met.grade.style.color=maxG>=3?colors.red:maxG>=2?colors.amber:colors.teal;
                met.iou.textContent=rand(0.72,0.88).toFixed(3);met.dice.textContent=rand(0.78,0.92).toFixed(3);met.time.textContent=Math.floor(rand(40,120));
                log.add('Segmentation complete: '+met.dmg.textContent+' damaged','ok');
            }}
            // Animated scan line
            if(scanning){ctx.strokeStyle=colors.purple+'80';ctx.lineWidth=2;const sy=scanLine/segH*H;ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(W,sy);ctx.stroke();
                const g=ctx.createLinearGradient(0,sy-20,0,sy);g.addColorStop(0,'rgba(168,85,247,0)');g.addColorStop(1,'rgba(168,85,247,0.15)');ctx.fillStyle=g;ctx.fillRect(0,sy-20,W,20);}
        }
        // Legend
        const lx=W-100,ly=10;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(lx-5,ly-5,95,90);
        gradeNames.forEach((name,i)=>{if(i===0)return;ctx.fillStyle=gradeColors[i].replace(/[\d.]+\)$/,'0.8)');ctx.fillRect(lx,ly+(i-1)*18,12,12);ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';ctx.textAlign='left';ctx.fillText(name,lx+16,ly+(i-1)*18+10);});
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Overlay Opacity',0.1,1,0.5,0.1,v=>{opacity=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> New Scene','',()=>{genSegMap();scanLine=-1;scanning=false;});
    addBtn(br,'<i class="fa-solid fa-play"></i> Segment','accent',()=>{scanLine=0;scanning=true;log.add('U-Net inference starting...','info');});
    addBtn(br,'<i class="fa-solid fa-eye"></i> Toggle Overlay','',()=>{showOverlay=!showOverlay;});
    ca.appendChild(br);
    addTabs(sp,['U-Net','Damage Grades','Post-Earthquake'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>U-Net Segmentation</strong><br><br>Encoder-Decoder with skip connections:<br>• Encoder: 4 downsample blocks (conv+pool)<br>• Decoder: 4 upsample blocks (transposed conv)<br>• Skip connections preserve spatial detail<br>• Output: per-pixel class probabilities<br><br>Input: 512×512 → Output: 512×512 mask.',
        '<strong>EMS-98 Damage Grades</strong><br><br>• <span style="color:#ffc800">■ Grade 1:</span> Negligible — hairline cracks<br>• <span style="color:#ff8c00">■ Grade 2:</span> Moderate — structural cracks<br>• <span style="color:#ff3c00">■ Grade 3:</span> Substantial — large cracks, spalling<br>• <span style="color:#c80000">■ Grade 4-5:</span> Heavy/Collapse<br><br>Rapid visual screening per FEMA P-154.',
        '<strong>Post-Earthquake Assessment</strong><br><br>• Rapid damage assessment from satellite/drone images<br>• Prioritize rescue operations by damage grade<br>• Support NDMA response coordination<br>• Train on pre/post earthquake image pairs<br>• 95% accuracy on balanced dataset (6000 buildings)'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>U-Net</strong> — Click "Segment" to watch progressive segmentation. Colors indicate damage grade.'}));
    genSegMap();draw();
}

/* ================================================================
   DEMO 4: LAND-USE CLASSIFIER (Satellite CNN)
   ================================================================ */
function buildLandUseClassifier(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-satellite-dish"></i> Satellite Land-Use CNN'}));
    addInfo(sp,'<strong>ResNet-34</strong> classifies satellite imagery patches into 6 land-use categories. Interactive patch selection with confidence histograms.');
    const met=addMetrics(sp,[{id:'cls',val:'—',label:'Classification'},{id:'conf',val:'—',label:'Confidence'},{id:'patches',val:'0',label:'Patches Analyzed'},{id:'acc',val:'91.2%',label:'Test Accuracy'},{id:'top3',val:'—',label:'Top-3 Acc'},{id:'time',val:'—',label:'Inference (ms)'}]);
    const log=addLog(sp);
    const classes=['Forest','Water','Agriculture','Urban','Barren','Wetland'];
    const classColors=[colors.green,colors.cyan,colors.amber,'#9ca3af',colors.red,colors.purple];
    let grid=[],gridN=8,selectedCell=-1;
    let particles=makeParticles(8,W,H,colors.green);

    function genGrid(){
        grid=[];
        for(let i=0;i<gridN*gridN;i++){const cls=Math.floor(rand(0,6));const probs=Array(6).fill(0).map(()=>rand(0.01,0.15));probs[cls]=rand(0.5,0.95);const sum=probs.reduce((s,v)=>s+v,0);probs.forEach((_,j)=>probs[j]/=sum);grid.push({cls,probs,analyzed:false});}
        met.patches.textContent='0';selectedCell=-1;
        log.add('Generated '+gridN+'x'+gridN+' satellite grid','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0a0e1a';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);
        const cellW=W/gridN;const cellH=(H-60)/gridN;
        const t=Date.now()*0.003;
        // Draw grid
        grid.forEach((cell,idx)=>{const row=Math.floor(idx/gridN);const col=idx%gridN;const x=col*cellW;const y=row*cellH;
            ctx.fillStyle=classColors[cell.cls]+(cell.analyzed?'40':'15');ctx.fillRect(x+1,y+1,cellW-2,cellH-2);
            ctx.strokeStyle=idx===selectedCell?'#fff':colors.border;ctx.lineWidth=idx===selectedCell?2:0.5;ctx.strokeRect(x+1,y+1,cellW-2,cellH-2);
            if(cell.analyzed){ctx.fillStyle=classColors[cell.cls];ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText(classes[cell.cls].substring(0,4),x+cellW/2,y+cellH/2+3);ctx.fillText(Math.round(cell.probs[cell.cls]*100)+'%',x+cellW/2,y+cellH/2+14);}
        });
        // Selected cell info
        if(selectedCell>=0){
            const cell=grid[selectedCell];const row=Math.floor(selectedCell/gridN);const col=selectedCell%gridN;
            // Highlight
            const x=col*cellW;const y=row*cellH;
            drawGlow(ctx,x+cellW/2,y+cellH/2,30,classColors[cell.cls]);
            // Confidence bars at bottom
            const barY=H-55;const barH=45;const barW=W/(classes.length+1);
            classes.forEach((cls,i)=>{const bx=10+i*barW;const bh=cell.probs[i]*barH*2;
                ctx.fillStyle=classColors[i]+'30';ctx.fillRect(bx,barY+barH-bh,barW-5,bh);ctx.fillStyle=classColors[i];ctx.fillRect(bx,barY+barH-bh,barW-5,Math.min(bh,3));
                ctx.fillStyle=i===cell.cls?classColors[i]:colors.muted;ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText(cls.substring(0,5),bx+(barW-5)/2,barY+barH+10);ctx.fillText(Math.round(cell.probs[i]*100)+'%',bx+(barW-5)/2,barY+barH-bh-4);
            });
        }
        ov._raf=requestAnimationFrame(draw);
    }
    d.canvas.addEventListener('click',e=>{const r=d.canvas.getBoundingClientRect();const mx=(e.clientX-r.left)*(W/r.width);const my=(e.clientY-r.top)*(H/r.height);
        const cellW=W/gridN;const cellH=(H-60)/gridN;const col=Math.floor(mx/cellW);const row=Math.floor(my/cellH);
        if(row>=0&&row<gridN&&col>=0&&col<gridN){selectedCell=row*gridN+col;const cell=grid[selectedCell];cell.analyzed=true;
            met.cls.textContent=classes[cell.cls];met.cls.style.color=classColors[cell.cls];met.conf.textContent=Math.round(cell.probs[cell.cls]*100)+'%';
            met.patches.textContent=grid.filter(c=>c.analyzed).length;met.time.textContent=Math.floor(rand(8,25));
            const sorted=[...cell.probs].sort((a,b)=>b-a);met.top3.textContent=Math.round((sorted[0]+sorted[1]+sorted[2])*100)+'%';
            log.add('Patch ('+row+','+col+'): '+classes[cell.cls]+' ['+Math.round(cell.probs[cell.cls]*100)+'%]','ok');}});

    addSlider(ca,'Grid Resolution',4,12,8,1,v=>{gridN=v;genGrid();});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> New Image','',()=>{genGrid();});
    addBtn(br,'<i class="fa-solid fa-play"></i> Classify All','accent',()=>{grid.forEach(c=>c.analyzed=true);met.patches.textContent=grid.length;log.add('All '+grid.length+' patches classified','ok');});
    ca.appendChild(br);
    addTabs(sp,['ResNet-34','Classes','Remote Sensing'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>ResNet-34 Classifier</strong><br><br>• 34 layers with residual connections<br>• Pre-trained on ImageNet, fine-tuned<br>• Input: 64×64 satellite patches<br>• Output: 6-class softmax probabilities<br>• Data augmentation: flip, rotate, color jitter<br>• Test accuracy: 91.2% (F1: 0.89)',
        '<strong>Land-Use Classes</strong><br><br>• <span style="color:'+colors.green+'">■</span> Forest — dense tree canopy<br>• <span style="color:'+colors.cyan+'">■</span> Water — rivers, lakes, reservoirs<br>• <span style="color:'+colors.amber+'">■</span> Agriculture — cropland, fields<br>• <span style="color:#9ca3af">■</span> Urban — built-up area<br>• <span style="color:'+colors.red+'">■</span> Barren — exposed soil, rock<br>• <span style="color:'+colors.purple+'">■</span> Wetland — marshes, mangroves',
        '<strong>Civil Engineering Applications</strong><br><br>• Environmental Impact Assessment (EIA)<br>• Land acquisition planning for highways<br>• Change detection for encroachment monitoring<br>• Flood-prone area identification<br>• Green cover compliance monitoring<br>• Input to hydrological modeling'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Satellite CNN</strong> — Click any patch to classify it. Bottom bars show class probabilities.'}));
    genGrid();draw();
}

/* ================================================================
   DEMO 5: PPE MONITOR (Object Detection) — camera viewfinder
   ================================================================ */
function buildPPEMonitor(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-hard-hat"></i> PPE Compliance Monitor'}));
    addInfo(sp,'<strong>YOLOv5</strong> PPE detection on construction sites. Real-time monitoring for helmet, vest, gloves, and safety boots compliance. Simulated camera feed with alerts.');
    const met=addMetrics(sp,[{id:'workers',val:'0',label:'Workers'},{id:'compliant',val:'0',label:'Compliant'},{id:'violations',val:'0',label:'Violations'},{id:'rate',val:'—',label:'Compliance %'},{id:'alerts',val:'0',label:'Alerts Today'},{id:'status',val:'LIVE',label:'Feed Status'}]);
    const log=addLog(sp);
    let workers=[],frameCount=0;
    let particles=makeParticles(8,W,H,colors.green);
    const ppeItems=['Helmet','Vest','Gloves','Boots'];
    const ppeColors=[colors.teal,colors.amber,colors.cyan,colors.purple];

    function genWorkers(){
        workers=[];const n=Math.floor(rand(4,8));
        for(let i=0;i<n;i++){const x=rand(50,W-100);const y=rand(60,H-120);
            const ppe=ppeItems.map(()=>Math.random()>0.25);// 75% chance of each item
            workers.push({x,y,w:rand(40,65),h:rand(80,130),ppe,conf:rand(0.7,0.98),id:'W-'+String(i+1).padStart(3,'0')});}
        met.workers.textContent=workers.length;
        const compliant=workers.filter(w=>w.ppe.every(p=>p)).length;
        const violations=workers.length-compliant;
        met.compliant.textContent=compliant;met.compliant.style.color=colors.green;
        met.violations.textContent=violations;met.violations.style.color=violations>0?colors.red:colors.green;
        met.rate.textContent=Math.round(compliant/workers.length*100)+'%';met.rate.style.color=compliant===workers.length?colors.green:colors.amber;
        log.add('Detected '+workers.length+' workers, '+violations+' violations','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        frameCount++;
        // Camera feed background
        ctx.fillStyle='#2a2a2a';ctx.fillRect(0,0,W,H);
        // Site elements
        ctx.fillStyle='#4a3a2a';ctx.fillRect(0,H*0.7,W,H*0.3);// ground
        ctx.fillStyle='#5a5a6a';ctx.fillRect(W*0.1,H*0.2,80,H*0.5);// column
        ctx.fillStyle='#5a5a6a';ctx.fillRect(W*0.6,H*0.15,100,H*0.55);// wall
        drawParticles(ctx,particles,W,H);

        const t=Date.now()*0.003;
        // Workers as stick figures with PPE
        workers.forEach(w=>{
            const allCompliant=w.ppe.every(p=>p);
            const color=allCompliant?colors.green:colors.red;
            // Person silhouette
            ctx.fillStyle='#888';ctx.fillRect(w.x,w.y,w.w,w.h);
            // Head
            ctx.beginPath();ctx.arc(w.x+w.w/2,w.y-10,12,0,Math.PI*2);ctx.fillStyle=w.ppe[0]?colors.teal:'#888';ctx.fill();
            // Vest area
            ctx.fillStyle=w.ppe[1]?colors.amber+'60':'transparent';ctx.fillRect(w.x+5,w.y+15,w.w-10,w.h*0.4);
            // Bounding box
            ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(w.x-5,w.y-25,w.w+10,w.h+30);
            // ID label
            ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(w.x-5,w.y-40,70,14);ctx.fillStyle=color;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';ctx.fillText(w.id+' '+Math.round(w.conf*100)+'%',w.x-2,w.y-29);
            // PPE status icons
            if(!allCompliant){
                const pulse=Math.sin(t+w.x)*0.3+0.7;
                ctx.globalAlpha=pulse;
                let missing=[];w.ppe.forEach((p,i)=>{if(!p)missing.push(ppeItems[i]);});
                ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(w.x-5,w.y+w.h+8,90,missing.length*12+4);
                missing.forEach((m,i)=>{ctx.fillStyle=colors.red;ctx.font='8px JetBrains Mono';ctx.fillText('✗ '+m,w.x,w.y+w.h+18+i*12);});
                ctx.globalAlpha=1;
            }
        });
        // Camera overlay
        ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;
        // Thirds grid
        ctx.beginPath();ctx.moveTo(W/3,0);ctx.lineTo(W/3,H);ctx.moveTo(2*W/3,0);ctx.lineTo(2*W/3,H);ctx.moveTo(0,H/3);ctx.lineTo(W,H/3);ctx.moveTo(0,2*H/3);ctx.lineTo(W,2*H/3);ctx.stroke();
        // Recording indicator
        if(Math.floor(t)%2===0){ctx.fillStyle=colors.red;ctx.beginPath();ctx.arc(20,20,6,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle=colors.red;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('REC',30,24);
        // Timestamp
        ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';ctx.textAlign='right';ctx.fillText(new Date().toLocaleTimeString()+' | Frame '+frameCount,W-10,20);
        // Site cam label
        ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,H-25,200,25);ctx.fillStyle=colors.text;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('CAM-01 | Site Gate | PPE Zone',5,H-9);
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> New Frame','',()=>{genWorkers();});
    addBtn(br,'<i class="fa-solid fa-triangle-exclamation"></i> Alert','danger',()=>{const violations=workers.filter(w=>!w.ppe.every(p=>p));met.alerts.textContent=parseInt(met.alerts.textContent)+violations.length;violations.forEach(w=>{const missing=[];w.ppe.forEach((p,i)=>{if(!p)missing.push(ppeItems[i]);});log.add('ALERT: '+w.id+' missing '+missing.join(', '),'warn');});});
    ca.appendChild(br);
    addTabs(sp,['Detection','PPE Items','Safety'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>YOLOv5 PPE Detection</strong><br><br>• Real-time object detection (30+ FPS)<br>• 4 PPE classes: helmet, vest, gloves, boots<br>• Person detection + PPE association<br>• Confidence threshold: 0.5<br>• Non-compliance triggers instant alert<br>• Dashboard integration for site managers.',
        '<strong>Required PPE (IS 7969)</strong><br><br>• <span style="color:'+colors.teal+'">■</span> Hard Hat — head protection<br>• <span style="color:'+colors.amber+'">■</span> Hi-Vis Vest — visibility<br>• <span style="color:'+colors.cyan+'">■</span> Safety Gloves — hand protection<br>• <span style="color:'+colors.purple+'">■</span> Safety Boots — foot protection<br><br>Full-body harness for work at height (>1.8m).',
        '<strong>Safety Compliance</strong><br><br>• Building and Other Construction Workers Act<br>• NBC 2016 safety provisions<br>• OSHA equivalent requirements<br>• PPE zones near heavy equipment<br>• Automated violation logging and reporting<br>• Worker ID tracking for repeat violations'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>PPE Monitor</strong> — Live camera feed simulation. Green = compliant, Red = violation. Click "Alert" to log.'}));
    genWorkers();draw();
}

/* ================================================================
   DEMO 6: GRAD-CAM EXPLAINER — animated heatmap visualization
   ================================================================ */
function buildGradCAM(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-fire"></i> Grad-CAM Explainer'}));
    addInfo(sp,'<strong>Grad-CAM</strong> visualizes what the CNN looks at for classification. Animated heatmap overlay shows attention regions. Compare different network layers.');
    const met=addMetrics(sp,[{id:'cls',val:'—',label:'Predicted Class'},{id:'conf',val:'—',label:'Confidence'},{id:'layer',val:'conv5',label:'Active Layer'},{id:'hot',val:'—',label:'Hot Spot Area'},{id:'entropy',val:'—',label:'Attention Entropy'},{id:'explain',val:'—',label:'Explainability'}]);
    const log=addLog(sp);
    let heatmap=[],hmW=0,hmH=0,showHeat=true,heatOpacity=0.6;
    let animPhase=0,selectedClass=0;
    let particles=makeParticles(8,W,H,'#ff6b00');
    const predClasses=['Crack','Spalling','Corrosion','Intact'];
    const classConfs=[0.87,0.08,0.03,0.02];
    let layerIdx=0;
    const layers=['conv1','conv2','conv3','conv4','conv5'];

    function genHeatmap(layer){
        hmW=Math.floor(W/8);hmH=Math.floor(H/8);heatmap=[];
        const smoothness=layer*2+2;// deeper layers = smoother
        // Create multiple gaussian blobs
        const blobs=[];
        for(let b=0;b<3+layer;b++){blobs.push({cx:rand(3,hmW-3),cy:rand(3,hmH-3),r:rand(2,5+layer),intensity:rand(0.3,1)});}
        for(let y=0;y<hmH;y++){heatmap[y]=[];for(let x=0;x<hmW;x++){let val=0;blobs.forEach(b=>{const dist=Math.sqrt(Math.pow(x-b.cx,2)+Math.pow(y-b.cy,2));val+=b.intensity*Math.exp(-dist*dist/(2*b.r*b.r));});heatmap[y][x]=clamp(val,0,1);}}
        met.layer.textContent=layers[layer];
        // Compute hot spot area
        let hotPixels=0;for(let y=0;y<hmH;y++){for(let x=0;x<hmW;x++){if(heatmap[y][x]>0.5)hotPixels++;}}
        met.hot.textContent=Math.round(hotPixels/(hmW*hmH)*100)+'%';
        // Entropy
        let entropy=0;for(let y=0;y<hmH;y++){for(let x=0;x<hmW;x++){const p=heatmap[y][x];if(p>0.01)entropy-=p*Math.log2(p);}}
        met.entropy.textContent=(entropy/(hmW*hmH)*100).toFixed(1);
        met.explain.textContent=hotPixels/(hmW*hmH)<0.3?'Focused':'Diffuse';met.explain.style.color=hotPixels/(hmW*hmH)<0.3?colors.teal:colors.amber;
        log.add('Grad-CAM: Layer '+layers[layer]+' | Hot area: '+met.hot.textContent,'ok');
    }
    function heatColor(val){
        // Blue → Cyan → Green → Yellow → Red
        if(val<0.25)return'rgba(0,0,'+Math.floor(val*4*255)+',';
        if(val<0.5)return'rgba(0,'+Math.floor((val-0.25)*4*255)+',255,';
        if(val<0.75)return'rgba('+Math.floor((val-0.5)*4*255)+',255,'+Math.floor((1-(val-0.5)*4)*255)+',';
        return'rgba(255,'+Math.floor((1-(val-0.75)*4)*255)+',0,';
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        animPhase+=0.02;
        // Base image (structural element)
        ctx.fillStyle='#4a4a4a';ctx.fillRect(0,0,W,H);
        for(let i=0;i<150;i++){ctx.fillStyle='rgba('+(rand(50,70))+','+(rand(50,70))+','+(rand(50,70))+',0.3)';ctx.fillRect(rand(0,W),rand(0,H),rand(2,8),rand(2,8));}
        drawParticles(ctx,particles,W,H);

        // Heatmap overlay with animation
        if(showHeat&&heatmap.length){
            const cellW=W/hmW;const cellH=H/hmH;
            for(let y=0;y<hmH;y++){for(let x=0;x<hmW;x++){const val=heatmap[y][x];if(val>0.05){
                const animVal=clamp(val+Math.sin(animPhase+x*0.3+y*0.3)*0.05,0,1);
                ctx.fillStyle=heatColor(animVal)+heatOpacity*animVal+')';ctx.fillRect(x*cellW,y*cellH,cellW+1,cellH+1);}}}
            // Contour lines at 0.5 and 0.75
            [0.5,0.75].forEach(thresh=>{ctx.strokeStyle='rgba(255,255,255,'+(thresh===0.75?0.6:0.3)+')';ctx.lineWidth=thresh===0.75?1.5:0.8;
                for(let y=0;y<hmH-1;y++){for(let x=0;x<hmW-1;x++){const v=heatmap[y][x];const vr=heatmap[y][x+1]||0;const vb=heatmap[y+1]?heatmap[y+1][x]:0;
                    if((v>=thresh)!==(vr>=thresh)){const px=(x+1)*cellW;ctx.beginPath();ctx.moveTo(px,y*cellH);ctx.lineTo(px,(y+1)*cellH);ctx.stroke();}
                    if((v>=thresh)!==(vb>=thresh)){const py=(y+1)*cellH;ctx.beginPath();ctx.moveTo(x*cellW,py);ctx.lineTo((x+1)*cellW,py);ctx.stroke();}}}});
        }
        // Class probability bars (bottom)
        const barY=H-50;const barW=W/5;
        predClasses.forEach((cls,i)=>{const bx=15+i*barW;const conf=i===selectedClass?classConfs[0]:classConfs[Math.min(i+1,3)];
            ctx.fillStyle=(i===selectedClass?colors.teal:colors.muted)+'30';ctx.fillRect(bx,barY,barW-10,35);
            ctx.fillStyle=i===selectedClass?colors.teal:colors.muted;ctx.fillRect(bx,barY,conf*(barW-10),35);
            ctx.fillStyle='#fff';ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.fillText(cls,bx+(barW-10)/2,barY+14);ctx.fillText(Math.round(conf*100)+'%',bx+(barW-10)/2,barY+28);
        });
        met.cls.textContent=predClasses[selectedClass];met.conf.textContent=Math.round(classConfs[0]*100)+'%';
        // Color scale
        const csX=W-30,csY=10,csW=20,csH=100;
        for(let i=0;i<csH;i++){const v=1-i/csH;ctx.fillStyle=heatColor(v)+'0.9)';ctx.fillRect(csX,csY+i,csW,1);}
        ctx.strokeStyle=colors.border;ctx.strokeRect(csX,csY,csW,csH);
        ctx.fillStyle=colors.text;ctx.font='7px JetBrains Mono';ctx.textAlign='left';ctx.fillText('High',csX+csW+3,csY+8);ctx.fillText('Low',csX+csW+3,csY+csH);
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Heatmap Opacity',0.1,1,0.6,0.1,v=>{heatOpacity=v;});
    addSlider(ca,'Network Layer',0,4,4,1,v=>{layerIdx=v;genHeatmap(v);});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Regenerate','',()=>{genHeatmap(layerIdx);});
    addBtn(br,'<i class="fa-solid fa-eye"></i> Toggle Heatmap','',()=>{showHeat=!showHeat;});
    addBtn(br,'<i class="fa-solid fa-shuffle"></i> Next Class','accent',()=>{selectedClass=(selectedClass+1)%4;genHeatmap(layerIdx);log.add('Showing Grad-CAM for: '+predClasses[selectedClass],'info');});
    ca.appendChild(br);
    addTabs(sp,['Grad-CAM','Layers','XAI'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Gradient-weighted Class Activation Mapping</strong><br><br>1. Forward pass → get target class score<br>2. Backpropagate gradients to chosen conv layer<br>3. Global-average-pool gradients → channel weights<br>4. Weighted sum of feature maps → heatmap<br>5. ReLU → keep only positive influence<br>6. Overlay on input image.',
        '<strong>Layer Comparison</strong><br><br>• <strong>conv1:</strong> Low-level features (edges, textures)<br>• <strong>conv2-3:</strong> Mid-level (patterns, shapes)<br>• <strong>conv4-5:</strong> High-level (objects, structures)<br><br>Deeper layers → broader, more semantic attention.<br>Shallower layers → sharp, texture-focused.',
        '<strong>Explainable AI (XAI)</strong><br><br>Why Grad-CAM matters for civil engineering:<br>• Verify CNN focuses on actual defects<br>• Build trust with structural engineers<br>• Identify model failure modes<br>• Regulatory compliance (explain predictions)<br>• Debug misclassifications<br>• IS/NBC don\'t accept black-box decisions.'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Grad-CAM</strong> — Heatmap shows CNN attention. Change layers to see different feature depths.'}));
    genHeatmap(4);draw();
}

/* ── Wire up cards ── */
const demos=[
    {title:'Crack Detector',icon:'fa-magnifying-glass',build:buildCrackDetector},
    {title:'Defect Localizer',icon:'fa-crosshairs',build:buildDefectLocalizer},
    {title:'Damage Segmenter',icon:'fa-draw-polygon',build:buildDamageSegmenter},
    {title:'Land-Use Classifier',icon:'fa-satellite-dish',build:buildLandUseClassifier},
    {title:'PPE Monitor',icon:'fa-hard-hat',build:buildPPEMonitor},
    {title:'Grad-CAM Explainer',icon:'fa-fire',build:buildGradCAM}
];
function init(){
    const cards=document.querySelectorAll('.app-grid .app-item');
    cards.forEach((card,i)=>{if(i<demos.length){card.style.cursor='pointer';card.addEventListener('click',()=>openOverlay(demos[i].title,demos[i].icon,demos[i].build));
        const badge=CE('div');badge.style.cssText='margin-top:8px;font-size:.72rem;color:#00d4aa;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:center';badge.innerHTML='<i class="fa-solid fa-hand-pointer"></i> Click for Interactive Demo';card.appendChild(badge);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
