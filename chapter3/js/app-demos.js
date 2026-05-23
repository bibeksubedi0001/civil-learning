/* ================================================================
   CHAPTER 3 — INTERACTIVE APPLICATION DEMOS (Unsupervised Learning)
   6 demos: Soil Zone Clustering, Material Hierarchy, Sensor Anomaly,
   Borehole PCA, Water Quality Zones, GIS Land Classification
   ================================================================ */
(function(){
'use strict';
const CE=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const rand=(a,b)=>Math.random()*(b-a)+a;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const colors={teal:'#00d4aa',cyan:'#0ea5e9',amber:'#f59e0b',purple:'#a855f7',red:'#ef4444',green:'#22c55e',text:'rgba(255,255,255,.75)',muted:'rgba(255,255,255,.4)',border:'rgba(255,255,255,.08)'};
const clusterColors=['#00d4aa','#0ea5e9','#f59e0b','#a855f7','#ef4444','#22c55e','#ec4899','#f97316'];

function openOverlay(title,icon,buildFn){let ov=document.querySelector('.app-demo-overlay');if(!ov){ov=CE('div','app-demo-overlay');document.body.appendChild(ov);}ov.innerHTML='';const hdr=CE('div','app-demo-overlay__header');const ttl=CE('div','app-demo-overlay__title');ttl.innerHTML='<i class="fa-solid '+icon+'"></i> '+title;const cb=CE('button','app-demo-overlay__close');cb.innerHTML='<i class="fa-solid fa-xmark"></i> Close';cb.onclick=()=>ov.classList.remove('active');hdr.append(ttl,cb);const body=CE('div','app-demo-overlay__body');const mp=CE('div','app-demo-panel app-demo-panel--main');const sp=CE('div','app-demo-panel app-demo-panel--side');body.append(mp,sp);ov.append(hdr,body);const cw=CE('div','app-demo-canvas-wrap');const canvas=document.createElement('canvas');cw.appendChild(canvas);mp.appendChild(cw);const ca=CE('div','app-demo-controls');mp.appendChild(ca);requestAnimationFrame(()=>{ov.classList.add('active');canvas.width=cw.clientWidth||700;canvas.height=cw.clientHeight||400;buildFn({canvas,ctx:canvas.getContext('2d'),W:canvas.width,H:canvas.height,mainPanel:mp,sidePanel:sp,ctrlArea:ca,cWrap:cw});});document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){ov.classList.remove('active');document.removeEventListener('keydown',esc);}});}
function addSlider(p,l,mn,mx,v,st,cb){const r=CE('div','app-demo-slider-row');r.innerHTML='<label>'+l+'</label><input type="range" min="'+mn+'" max="'+mx+'" value="'+v+'" step="'+(st||1)+'"><span class="val">'+v+'</span>';const i=r.querySelector('input'),s=r.querySelector('.val');i.addEventListener('input',()=>{s.textContent=(+i.value).toFixed(st<1?2:0);cb(+i.value);});p.appendChild(r);return i;}
function addBtn(p,l,c,cb){const b=CE('button','app-demo-btn'+(c?' app-demo-btn--'+c:''));b.innerHTML=l;b.onclick=cb;p.appendChild(b);return b;}
function addInfo(p,h){const d=CE('div','app-demo-info');d.innerHTML=h;p.appendChild(d);return d;}
function addMetrics(p,items){const g=CE('div','app-demo-metrics');const els={};items.forEach(it=>{const m=CE('div','app-demo-metric');m.innerHTML='<div class="app-demo-metric__value">'+it.val+'</div><div class="app-demo-metric__label">'+it.label+'</div>';g.appendChild(m);els[it.id]=m.querySelector('.app-demo-metric__value');});p.appendChild(g);return els;}
function addLog(p){const log=CE('div','app-demo-log');log.innerHTML='<span class="log-info">[SYS]</span> Ready.\n';p.appendChild(log);return{el:log,add(m,t='info'){const s=document.createElement('span');s.className='log-'+t;s.textContent='['+t.toUpperCase()+']';log.appendChild(s);log.appendChild(document.createTextNode(' '+m+'\n'));log.scrollTop=log.scrollHeight;},clear(){log.innerHTML='';}};}
function addTabs(p,tabs,cb){const w=CE('div','app-demo-tabs');tabs.forEach((t,i)=>{const b=CE('button','app-demo-tab'+(i===0?' active':''));b.textContent=t;b.onclick=()=>{w.querySelectorAll('.app-demo-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');cb(i);};w.appendChild(b);});p.appendChild(w);}

/* ================================================================
   DEMO 1: SOIL ZONE CLUSTERING (K-Means)
   ================================================================ */
function buildSoilClustering(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-circle-nodes"></i> K-Means Soil Zone Clustering'}));
    addInfo(sp,'Cluster soil investigation data using <strong>K-Means</strong>. Points represent borehole test results (SPT vs Depth). Watch centroids converge and zones form in real-time.');
    const met=addMetrics(sp,[{id:'k',val:'3',label:'K Clusters'},{id:'iter',val:'0',label:'Iterations'},{id:'wss',val:'—',label:'Inertia (WSS)'},{id:'silhouette',val:'—',label:'Silhouette'}]);
    const log=addLog(sp);
    let K=3,data=[],centroids=[],assignments=[],iteration=0;
    let animating=false,animId=null;
    function genData(){
        data=[];const centers=[[15,5],[35,8],[10,15],[40,3],[20,12]];
        for(let c=0;c<Math.min(K+1,5);c++){for(let i=0;i<20;i++){data.push({x:centers[c][0]+rand(-8,8),y:centers[c][1]+rand(-3,3)});}}
        assignments=new Array(data.length).fill(0);
        centroids=[];for(let c=0;c<K;c++){centroids.push({x:rand(5,45),y:rand(2,18)});}
        iteration=0;met.iter.textContent=0;
        log.add('Generated '+data.length+' borehole data points','ok');
    }
    function kMeansStep(){
        // Assign
        let changed=false;
        data.forEach((pt,i)=>{let best=0,bestD=Infinity;centroids.forEach((c,ci)=>{const d=Math.sqrt((pt.x-c.x)**2+(pt.y-c.y)**2);if(d<bestD){bestD=d;best=ci;}});if(assignments[i]!==best){changed=true;assignments[i]=best;}});
        // Update centroids
        for(let c=0;c<K;c++){const pts=data.filter((_,i)=>assignments[i]===c);if(pts.length){centroids[c]={x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};}}
        iteration++;met.iter.textContent=iteration;
        // WSS
        let wss=0;data.forEach((pt,i)=>{const c=centroids[assignments[i]];wss+=(pt.x-c.x)**2+(pt.y-c.y)**2;});met.wss.textContent=wss.toFixed(0);
        // Silhouette (simplified)
        let silSum=0;data.forEach((pt,i)=>{const ci=assignments[i];const own=data.filter((_,j)=>j!==i&&assignments[j]===ci);const a=own.length?own.reduce((s,p)=>s+Math.sqrt((pt.x-p.x)**2+(pt.y-p.y)**2),0)/own.length:0;let bMin=Infinity;for(let c=0;c<K;c++){if(c===ci)continue;const other=data.filter((_,j)=>assignments[j]===c);if(other.length){const b=other.reduce((s,p)=>s+Math.sqrt((pt.x-p.x)**2+(pt.y-p.y)**2),0)/other.length;if(b<bMin)bMin=b;}}const s=bMin!==Infinity?(bMin-a)/Math.max(a,bMin):0;silSum+=s;});
        met.silhouette.textContent=(silSum/data.length).toFixed(3);
        return changed;
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const maxX=55,maxY=22;
        // Voronoi-style background
        const step=5;
        for(let x=pad.l;x<W-pad.r;x+=step){for(let y=pad.t;y<H-pad.b;y+=step){const dx=((x-pad.l)/gw)*maxX;const dy=((y-pad.t)/gh)*maxY;let best=0,bestD=Infinity;centroids.forEach((c,ci)=>{const d=(dx-c.x)**2+(dy-c.y)**2;if(d<bestD){bestD=d;best=ci;}});ctx.fillStyle=clusterColors[best%clusterColors.length]+'12';ctx.fillRect(x,y,step,step);}}
        // Grid
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let x=0;x<=maxX;x+=10){const px=pad.l+(x/maxX)*gw;ctx.beginPath();ctx.moveTo(px,pad.t);ctx.lineTo(px,H-pad.b);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText(x,px,H-pad.b+14);}
        for(let y=0;y<=maxY;y+=5){const py=pad.t+(y/maxY)*gh;ctx.beginPath();ctx.moveTo(pad.l,py);ctx.lineTo(W-pad.r,py);ctx.stroke();ctx.textAlign='right';ctx.fillText(y,pad.l-6,py+4);}
        // Data points
        data.forEach((pt,i)=>{const x=pad.l+(pt.x/maxX)*gw;const y=pad.t+(pt.y/maxY)*gh;const ci=assignments[i];ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=clusterColors[ci%clusterColors.length]+'cc';ctx.fill();});
        // Centroids
        centroids.forEach((c,ci)=>{const x=pad.l+(c.x/maxX)*gw;const y=pad.t+(c.y/maxY)*gh;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fillStyle=clusterColors[ci%clusterColors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('C'+(ci+1),x,y+4);});
        // Axes
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';
        ctx.fillText('SPT N-value',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Depth (m)',0,0);ctx.restore();
    }
    addSlider(ca,'K Clusters',2,6,3,1,v=>{K=v;met.k.textContent=v;genData();draw();});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate','',()=>{genData();draw();});
    addBtn(br,'<i class="fa-solid fa-forward-step"></i> Step','accent',()=>{kMeansStep();draw();log.add('K-Means iteration '+iteration,'info');});
    addBtn(br,'<i class="fa-solid fa-play"></i> Auto Run','',()=>{if(animating)return;animating=true;const step=()=>{const ch=kMeansStep();draw();if(ch&&iteration<50){animId=setTimeout(step,300);}else{animating=false;log.add('Converged after '+iteration+' iterations','ok');}};step();});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','danger',()=>{if(animId)clearTimeout(animId);animating=false;genData();draw();});
    ca.appendChild(br);
    addTabs(sp,['K-Means','Soil Zones','Elbow Method'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>K-Means Algorithm</strong><br><br>1. Initialize K random centroids<br>2. Assign each point to nearest centroid<br>3. Update centroids to cluster means<br>4. Repeat until convergence<br><br>WSS (Within-cluster Sum of Squares) measures compactness.<br>Silhouette score measures cluster separation quality.',
        '<strong>Soil Zone Interpretation</strong><br><br>Each cluster represents a soil stratum or zone:<br>• <strong>Zone 1:</strong> Shallow, weak layer (low N, shallow)<br>• <strong>Zone 2:</strong> Deep competent layer (high N, deep)<br>• <strong>Zone 3:</strong> Intermediate layer<br><br>Use cluster boundaries to delineate soil profiles across a site.',
        '<strong>Choosing K (Elbow Method)</strong><br><br>Run K-Means for K = 2,3,...,8 and plot WSS vs K.<br>The "elbow" indicates optimal K where adding clusters gives diminishing returns.<br><br>Also consider:<br>• Silhouette score (higher = better)<br>• Geological interpretation (does K make sense?)<br>• Gap statistic for formal testing'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>K-Means</strong> — Click Step to iterate or Auto Run to watch convergence.'}));
    genData();draw();
}

/* ================================================================
   DEMO 2: MATERIAL HIERARCHY (Hierarchical Clustering / Dendrogram)
   ================================================================ */
function buildMaterialHierarchy(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-sitemap"></i> Material Hierarchy (Dendrogram)'}));
    addInfo(sp,'<strong>Agglomerative hierarchical clustering</strong> of construction materials by properties. The dendrogram shows how materials group based on strength, density, and cost similarity.');
    const met=addMetrics(sp,[{id:'clusters',val:'—',label:'Clusters'},{id:'cutoff',val:'—',label:'Cut Height'},{id:'materials',val:'12',label:'Materials'},{id:'method',val:'Ward',label:'Linkage'}]);
    const log=addLog(sp);
    const materials=[
        {name:'M20 Conc',strength:20,density:2400,cost:4500,color:colors.teal},
        {name:'M30 Conc',strength:30,density:2400,cost:5500,color:colors.teal},
        {name:'M40 Conc',strength:40,density:2450,cost:7000,color:colors.teal},
        {name:'Fe415',strength:415,density:7850,cost:55000,color:colors.cyan},
        {name:'Fe500',strength:500,density:7850,cost:60000,color:colors.cyan},
        {name:'TMT Bars',strength:550,density:7850,cost:58000,color:colors.cyan},
        {name:'Brick',strength:10,density:1800,cost:6000,color:colors.amber},
        {name:'AAC Block',strength:4,density:600,cost:3800,color:colors.amber},
        {name:'Fly Ash Br',strength:8,density:1600,cost:5000,color:colors.amber},
        {name:'Timber',strength:12,density:600,cost:25000,color:colors.green},
        {name:'Mild Steel',strength:250,density:7850,cost:50000,color:colors.purple},
        {name:'Glass',strength:33,density:2500,cost:2000,color:colors.muted}
    ];
    let cutHeight=0.5;
    // Simple distance matrix
    function normalizedDist(a,b){
        const maxS=600,maxD=8000,maxC=65000;
        return Math.sqrt(((a.strength-b.strength)/maxS)**2+((a.density-b.density)/maxD)**2+((a.cost-b.cost)/maxC)**2);
    }
    // Build dendrogram (simple agglomerative)
    let dendro=[];
    function buildDendrogram(){
        const n=materials.length;
        let clusters=materials.map((_,i)=>({items:[i],height:0}));
        let dists=[];
        for(let i=0;i<n;i++){dists[i]=[];for(let j=0;j<n;j++){dists[i][j]=normalizedDist(materials[i],materials[j]);}}
        dendro=[];
        while(clusters.length>1){
            let minD=Infinity,mi=-1,mj=-1;
            for(let i=0;i<clusters.length;i++){for(let j=i+1;j<clusters.length;j++){
                let d=0,cnt=0;
                for(const a of clusters[i].items){for(const b of clusters[j].items){d+=dists[a][b];cnt++;}}
                d/=cnt;
                if(d<minD){minD=d;mi=i;mj=j;}
            }}
            const merged={items:[...clusters[mi].items,...clusters[mj].items],height:minD,left:clusters[mi],right:clusters[mj]};
            dendro.push(merged);
            clusters.splice(mj,1);clusters.splice(mi,1);clusters.push(merged);
        }
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:80,r:30,t:20,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const n=materials.length;
        const maxH=dendro.length?dendro[dendro.length-1].height*1.2:1;
        // Draw dendrogram (bottom-up)
        const leafPositions={};
        // Layout leaves
        let leafOrder=[];
        function getLeaves(node){if(node.items.length===1){leafOrder.push(node.items[0]);return;}if(node.left)getLeaves(node.left);if(node.right)getLeaves(node.right);}
        if(dendro.length)getLeaves(dendro[dendro.length-1]);
        else leafOrder=materials.map((_,i)=>i);
        leafOrder.forEach((li,pos)=>{leafPositions[li]=pad.l+(pos+0.5)/(n)*gw;});
        // Draw leaves
        leafOrder.forEach((li,pos)=>{const x=leafPositions[li];ctx.fillStyle=materials[li].color||colors.text;ctx.font='9px JetBrains Mono';ctx.textAlign='center';ctx.save();ctx.translate(x,H-pad.b+8);ctx.rotate(-Math.PI/4);ctx.fillText(materials[li].name,0,0);ctx.restore();});
        // Draw merge lines
        function getClusterX(node){if(node.items.length===1)return leafPositions[node.items[0]];const xs=node.items.map(i=>leafPositions[i]);return(Math.min(...xs)+Math.max(...xs))/2;}
        // Cut line
        const cutY=pad.t+(1-cutHeight)*gh;
        ctx.strokeStyle=colors.red+'50';ctx.setLineDash([6,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pad.l,cutY);ctx.lineTo(W-pad.r,cutY);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=colors.red;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('Cut: h='+cutHeight.toFixed(2),W-pad.r-80,cutY-5);
        // Count clusters at cut
        let nClusters=0;dendro.forEach(node=>{if(node.height/maxH<=cutHeight&&(!node.left||node.left.height/maxH>cutHeight||node.left.items.length===1)){nClusters++;}});
        // Simpler: count by iterating
        nClusters=0;const visited=new Set();
        function countAtCut(node){if(node.height/maxH>cutHeight){nClusters++;return;}if(node.left&&node.left.items.length>1)countAtCut(node.left);else nClusters++;if(node.right&&node.right.items.length>1)countAtCut(node.right);else nClusters++;}
        if(dendro.length)countAtCut(dendro[dendro.length-1]);else nClusters=n;
        met.clusters.textContent=Math.min(nClusters,n);met.cutoff.textContent=cutHeight.toFixed(2);
        // Draw dendrogram links
        dendro.forEach(node=>{const h=node.height/maxH;const y=pad.t+(1-h)*gh;const lx=getClusterX(node.left);const rx=getClusterX(node.right);const ly=node.left.items.length===1?H-pad.b:pad.t+(1-node.left.height/maxH)*gh;const ry=node.right.items.length===1?H-pad.b:pad.t+(1-node.right.height/maxH)*gh;
            ctx.strokeStyle=h>cutHeight/maxH*maxH?colors.teal+'80':'rgba(255,255,255,.3)';ctx.lineWidth=1.5;
            ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(lx,y);ctx.lineTo(rx,y);ctx.lineTo(rx,ry);ctx.stroke();
        });
        // Height axis
        ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='right';
        for(let h=0;h<=maxH;h+=maxH/5){const y=pad.t+(1-h/maxH)*gh;ctx.fillText(h.toFixed(2),pad.l-6,y+4);}
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.fillText('Distance',0,0);ctx.restore();
    }
    addSlider(ca,'Cut Height',0.1,1.0,0.5,0.05,v=>{cutHeight=v;draw();});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-sitemap"></i> Build Tree','',()=>{buildDendrogram();draw();log.add('Dendrogram built with '+dendro.length+' merges','ok');});
    ca.appendChild(br);
    addTabs(sp,['Algorithm','Linkage','Materials'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Agglomerative Clustering</strong><br><br>1. Start: each material is its own cluster<br>2. Find the two closest clusters<br>3. Merge them into one cluster<br>4. Repeat until single cluster remains<br><br>The dendrogram shows merge history. Cut horizontally to get K clusters.',
        '<strong>Linkage Methods</strong><br><br>• <strong>Ward:</strong> Minimize increase in total WSS (used here)<br>• <strong>Complete:</strong> Maximum distance between any pair<br>• <strong>Average:</strong> Mean pairwise distance (UPGMA)<br>• <strong>Single:</strong> Minimum distance (can chain)',
        '<strong>Material Properties</strong><br><br>Features used for clustering:<br>• Compressive strength (MPa)<br>• Density (kg/m³)<br>• Cost (₹/m³)<br><br>Expected groups:<br>• Concrete variants (M20, M30, M40)<br>• Steel variants (Fe415, Fe500, TMT, Mild Steel)<br>• Masonry (Brick, AAC, Fly Ash)<br>• Others (Timber, Glass)'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Dendrogram</strong> — Click "Build Tree" then adjust the cut height to see different cluster counts.'}));
    buildDendrogram();draw();
}

/* ================================================================
   DEMO 3: SENSOR ANOMALY DETECTOR (Isolation Forest)
   ================================================================ */
function buildSensorAnomaly(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-triangle-exclamation"></i> Isolation Forest Anomaly Detector'}));
    addInfo(sp,'<strong>Isolation Forest</strong> detects anomalous sensor readings in structural monitoring data. Anomalies are isolated quickly (short path length) because they differ from normal patterns.');
    const met=addMetrics(sp,[{id:'total',val:'0',label:'Total Points'},{id:'anomalies',val:'0',label:'Anomalies'},{id:'pct',val:'—',label:'Anomaly %'},{id:'threshold',val:'0.6',label:'Threshold'}]);
    const log=addLog(sp);
    let data=[],threshold=0.6,contamination=0.05;
    function genData(){
        data=[];
        // Normal cluster
        for(let i=0;i<180;i++){data.push({x:rand(15,45)+rand(-5,5),y:rand(10,30)+rand(-5,5),score:0});}
        // Anomalies
        const nAnom=Math.floor(data.length*contamination);
        for(let i=0;i<nAnom;i++){data.push({x:rand(0,60),y:rand(0,45),score:0});}
        // Compute anomaly scores (simplified: based on distance from mean)
        const mx=data.reduce((s,p)=>s+p.x,0)/data.length;
        const my=data.reduce((s,p)=>s+p.y,0)/data.length;
        const sx=Math.sqrt(data.reduce((s,p)=>s+(p.x-mx)**2,0)/data.length);
        const sy=Math.sqrt(data.reduce((s,p)=>s+(p.y-my)**2,0)/data.length);
        data.forEach(p=>{const zx=Math.abs(p.x-mx)/sx;const zy=Math.abs(p.y-my)/sy;p.score=1-Math.exp(-0.3*Math.sqrt(zx**2+zy**2));});
        const anomalies=data.filter(p=>p.score>threshold).length;
        met.total.textContent=data.length;met.anomalies.textContent=anomalies;
        met.pct.textContent=(anomalies/data.length*100).toFixed(1)+'%';
        log.add('Generated '+data.length+' readings, '+anomalies+' anomalies','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:50,r:30,t:25,b:45};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const maxX=65,maxY=50;
        // Background density (heatmap-like)
        const step=6;
        for(let x=pad.l;x<W-pad.r;x+=step){for(let y=pad.t;y<H-pad.b;y+=step){const dx=(x-pad.l)/gw*maxX;const dy=(y-pad.t)/gh*maxY;let density=0;data.forEach(p=>{const dist=Math.sqrt((dx-p.x)**2+(dy-p.y)**2);if(dist<8)density+=1-dist/8;});ctx.fillStyle='rgba(0,212,170,'+Math.min(0.15,density*0.015)+')';ctx.fillRect(x,y,step,step);}}
        // Data points
        data.forEach(p=>{const x=pad.l+(p.x/maxX)*gw;const y=pad.t+(p.y/maxY)*gh;const isAnom=p.score>threshold;ctx.beginPath();ctx.arc(x,y,isAnom?6:3,0,Math.PI*2);ctx.fillStyle=isAnom?colors.red+'cc':colors.teal+'80';ctx.fill();if(isAnom){ctx.strokeStyle=colors.red;ctx.lineWidth=1.5;ctx.stroke();}});
        // Grid
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let x=0;x<=maxX;x+=10){const px=pad.l+(x/maxX)*gw;ctx.beginPath();ctx.moveTo(px,pad.t);ctx.lineTo(px,H-pad.b);ctx.stroke();}
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Acceleration (mg)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Frequency (Hz)',0,0);ctx.restore();
        // Legend
        ctx.fillStyle=colors.teal;ctx.beginPath();ctx.arc(W-pad.r-80,pad.t+12,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors.text;ctx.font='10px Inter';ctx.textAlign='left';ctx.fillText('Normal',W-pad.r-72,pad.t+16);
        ctx.fillStyle=colors.red;ctx.beginPath();ctx.arc(W-pad.r-80,pad.t+28,5,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors.text;ctx.fillText('Anomaly',W-pad.r-72,pad.t+32);
    }
    addSlider(ca,'Threshold',0.3,0.9,0.6,0.05,v=>{threshold=v;met.threshold.textContent=v.toFixed(2);const an=data.filter(p=>p.score>v).length;met.anomalies.textContent=an;met.pct.textContent=(an/data.length*100).toFixed(1)+'%';draw();});
    addSlider(ca,'Contamination %',1,15,5,1,v=>{contamination=v/100;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate','',()=>{genData();draw();});
    addBtn(br,'<i class="fa-solid fa-bolt"></i> Add Anomaly','danger',()=>{data.push({x:rand(0,10),y:rand(35,50),score:0.9});data.push({x:rand(50,60),y:rand(0,10),score:0.85});met.total.textContent=data.length;const an=data.filter(p=>p.score>threshold).length;met.anomalies.textContent=an;draw();log.add('Manual anomalies injected','warn');});
    ca.appendChild(br);
    addTabs(sp,['Isolation Forest','Scores','SHM Use'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Isolation Forest</strong><br><br>Key insight: anomalies are "few and different" — they are easier to isolate.<br><br>1. Build random binary trees on the data<br>2. Anomalies have shorter average path length<br>3. Score = f(average path length)<br>4. Score > threshold → anomaly<br><br>No need for labeled data — fully unsupervised!',
        '<strong>Anomaly Scores</strong><br><br>Score range: [0, 1]<br>• Score ≈ 0: very normal<br>• Score ≈ 0.5: borderline<br>• Score ≈ 1: strong anomaly<br><br>The threshold slider controls sensitivity:<br>• Lower threshold → more anomalies detected (higher recall)<br>• Higher threshold → fewer false positives (higher precision)',
        '<strong>SHM Applications</strong><br><br>• Detect sensor malfunction or drift<br>• Identify unusual vibration events<br>• Flag structural changes (cracking, settlement)<br>• Filter outliers before training other ML models<br>• Real-time alerting on edge devices'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Isolation Forest</strong> — Red points are anomalies. Adjust threshold to control sensitivity.'}));
    genData();draw();
}

/* ================================================================
   DEMO 4: BOREHOLE PCA (Principal Component Analysis)
   ================================================================ */
function buildBoreholePCA(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-compress"></i> PCA on Borehole Data'}));
    addInfo(sp,'<strong>PCA</strong> reduces multi-dimensional borehole data (SPT, moisture, density, fines) to 2 principal components for visualization and pattern discovery.');
    const met=addMetrics(sp,[{id:'var1',val:'—',label:'PC1 Variance %'},{id:'var2',val:'—',label:'PC2 Variance %'},{id:'total',val:'—',label:'Total Var %'},{id:'n',val:'0',label:'Boreholes'}]);
    const log=addLog(sp);
    let data=[],pcData=[];
    function genData(){
        data=[];
        // Generate correlated borehole data
        for(let i=0;i<60;i++){
            const spt=rand(5,45);const moisture=30-spt*0.4+rand(-5,5);const density=1.6+spt*0.015+rand(-0.1,0.1);const fines=rand(5,80);
            const group=spt>25?0:spt>15?1:2;
            data.push({spt,moisture,density,fines,group});
        }
        // Simple PCA (2D projection)
        const means={spt:0,moisture:0,density:0,fines:0};
        data.forEach(d=>{means.spt+=d.spt;means.moisture+=d.moisture;means.density+=d.density;means.fines+=d.fines;});
        const n=data.length;Object.keys(means).forEach(k=>means[k]/=n);
        // Standardize and project (approximate PC1 = spt direction, PC2 = fines direction)
        pcData=data.map(d=>({pc1:(d.spt-means.spt)*0.7+(d.density-means.density)*20,pc2:(d.fines-means.fines)*0.5+(d.moisture-means.moisture)*0.3,group:d.group}));
        const totalVar=pcData.reduce((s,p)=>s+p.pc1**2+p.pc2**2,0);
        const var1=pcData.reduce((s,p)=>s+p.pc1**2,0)/totalVar*100;
        const var2=pcData.reduce((s,p)=>s+p.pc2**2,0)/totalVar*100;
        met.var1.textContent=var1.toFixed(1)+'%';met.var2.textContent=var2.toFixed(1)+'%';
        met.total.textContent=(var1+var2).toFixed(1)+'%';met.n.textContent=n;
        log.add('PCA computed on '+n+' boreholes. Explained variance: '+(var1+var2).toFixed(1)+'%','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        if(!pcData.length){ctx.fillStyle=colors.muted;ctx.font='14px Inter';ctx.textAlign='center';ctx.fillText('Click Generate to compute PCA',W/2,H/2);return;}
        const maxPC1=Math.max(...pcData.map(p=>Math.abs(p.pc1)))*1.3;
        const maxPC2=Math.max(...pcData.map(p=>Math.abs(p.pc2)))*1.3;
        // Origin lines
        const cx=pad.l+gw/2,cy=pad.t+gh/2;
        ctx.strokeStyle=colors.border;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,cy);ctx.lineTo(W-pad.r,cy);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,pad.t);ctx.lineTo(cx,H-pad.b);ctx.stroke();
        // Data points
        const groupColors=[colors.teal,colors.amber,colors.red];
        pcData.forEach(p=>{const x=cx+(p.pc1/maxPC1)*(gw/2);const y=cy-(p.pc2/maxPC2)*(gh/2);ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle=groupColors[p.group]+'bb';ctx.fill();ctx.strokeStyle=groupColors[p.group];ctx.lineWidth=1;ctx.stroke();});
        // Loading arrows (approximate)
        const loadings=[{name:'SPT',dx:0.7,dy:0.1},{name:'Moisture',dx:-0.3,dy:0.5},{name:'Density',dx:0.5,dy:-0.2},{name:'Fines',dx:-0.1,dy:0.7}];
        loadings.forEach(l=>{const ex=cx+l.dx*(gw/3);const ey=cy-l.dy*(gh/3);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.strokeStyle=colors.purple;ctx.lineWidth=2;ctx.stroke();
            const angle=Math.atan2(cy-ey,ex-cx);ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-8*Math.cos(angle-0.3),ey+8*Math.sin(angle-0.3));ctx.lineTo(ex-8*Math.cos(angle+0.3),ey+8*Math.sin(angle+0.3));ctx.closePath();ctx.fillStyle=colors.purple;ctx.fill();
            ctx.fillStyle=colors.purple;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText(l.name,ex+5,ey-5);
        });
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('PC1 ('+met.var1.textContent+')',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('PC2 ('+met.var2.textContent+')',0,0);ctx.restore();
        // Legend
        ['Dense/Stiff','Medium','Soft/Loose'].forEach((name,i)=>{ctx.fillStyle=groupColors[i];ctx.beginPath();ctx.arc(pad.l+10,pad.t+12+i*16,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors.text;ctx.font='10px Inter';ctx.textAlign='left';ctx.fillText(name,pad.l+20,pad.t+16+i*16);});
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate + PCA','',()=>{genData();draw();});
    ca.appendChild(br);
    addTabs(sp,['PCA Theory','Loadings','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Principal Component Analysis</strong><br><br>PCA finds orthogonal axes (principal components) that maximize variance.<br><br>1. Standardize features (zero mean, unit variance)<br>2. Compute covariance matrix<br>3. Find eigenvectors (PCs) and eigenvalues (variance)<br>4. Project data onto top 2 PCs for visualization<br><br>PC1 captures the most variance, PC2 the second most.',
        '<strong>Loading Vectors</strong><br><br>Purple arrows show how original features relate to PCs:<br><br>• <strong>SPT:</strong> High loading on PC1 → SPT drives most variation<br>• <strong>Fines:</strong> High loading on PC2 → independent dimension<br>• <strong>Moisture & SPT:</strong> Opposite directions → negatively correlated<br>• <strong>Density & SPT:</strong> Similar direction → positively correlated',
        '<strong>Geotechnical Applications</strong><br><br>• Reduce 10+ lab parameters to 2-3 key dimensions<br>• Identify soil stratigraphy patterns across boreholes<br>• Feature selection for ML models (remove redundant features)<br>• Outlier detection in lab test results<br>• Spatial variability assessment for probabilistic analysis'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>PCA Biplot</strong> — Points are boreholes in PC space. Purple arrows show feature loadings.'}));
    genData();draw();
}

/* ================================================================
   DEMO 5: WATER QUALITY ZONES (DBSCAN)
   ================================================================ */
function buildWaterQualityZones(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-map-location-dot"></i> DBSCAN Water Quality Zones'}));
    addInfo(sp,'<strong>DBSCAN</strong> (Density-Based Spatial Clustering) identifies zones of similar water quality on a river catchment. Unlike K-Means, DBSCAN finds clusters of arbitrary shape and detects outliers.');
    const met=addMetrics(sp,[{id:'clusters',val:'—',label:'Clusters Found'},{id:'noise',val:'—',label:'Noise Points'},{id:'eps',val:'3',label:'ε (epsilon)'},{id:'minPts',val:'4',label:'minPts'}]);
    const log=addLog(sp);
    let eps=3,minPts=4,data=[],labels=[];
    function genData(){
        data=[];
        // Cluster 1: Clean zone (circle)
        for(let i=0;i<25;i++){const a=rand(0,Math.PI*2);const r=rand(0,8);data.push({x:20+r*Math.cos(a),y:15+r*Math.sin(a)});}
        // Cluster 2: Moderate (elongated)
        for(let i=0;i<20;i++){data.push({x:40+rand(-3,3),y:10+rand(-12,12)});}
        // Cluster 3: Polluted (crescent)
        for(let i=0;i<20;i++){const a=rand(0.3,2.8);data.push({x:55+12*Math.cos(a),y:25+12*Math.sin(a)});}
        // Noise points
        for(let i=0;i<8;i++){data.push({x:rand(5,70),y:rand(2,40)});}
        labels=new Array(data.length).fill(-1);
        log.add('Generated '+data.length+' water quality monitoring points','ok');
    }
    function runDBSCAN(){
        labels=new Array(data.length).fill(-1);
        const visited=new Set();let clusterID=0;
        function regionQuery(idx){const pts=[];data.forEach((p,i)=>{if(Math.sqrt((p.x-data[idx].x)**2+(p.y-data[idx].y)**2)<=eps)pts.push(i);});return pts;}
        function expandCluster(idx,neighbors,cid){labels[idx]=cid;const queue=[...neighbors];while(queue.length){const q=queue.shift();if(!visited.has(q)){visited.add(q);const qNeighbors=regionQuery(q);if(qNeighbors.length>=minPts){qNeighbors.forEach(n=>{if(!queue.includes(n)&&labels[n]===-1)queue.push(n);});}}if(labels[q]===-1)labels[q]=cid;}}
        data.forEach((_,i)=>{if(visited.has(i))return;visited.add(i);const neighbors=regionQuery(i);if(neighbors.length>=minPts){expandCluster(i,neighbors,clusterID);clusterID++;}});
        const nClusters=Math.max(...labels)+1;const noise=labels.filter(l=>l===-1).length;
        met.clusters.textContent=nClusters;met.noise.textContent=noise;
        log.add('DBSCAN found '+nClusters+' clusters, '+noise+' noise points','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:40,r:25,t:25,b:40};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const maxX=75,maxY=45;
        // Cluster hulls (simplified as ellipses around clusters)
        const nClusters=Math.max(...labels)+1;
        for(let c=0;c<nClusters;c++){
            const pts=data.filter((_,i)=>labels[i]===c);if(pts.length<2)continue;
            const cx=pts.reduce((s,p)=>s+p.x,0)/pts.length;const cy=pts.reduce((s,p)=>s+p.y,0)/pts.length;
            const rx=Math.max(...pts.map(p=>Math.abs(p.x-cx)))+eps;const ry=Math.max(...pts.map(p=>Math.abs(p.y-cy)))+eps;
            const sx=pad.l+(cx/maxX)*gw;const sy=pad.t+(cy/maxY)*gh;
            ctx.beginPath();ctx.ellipse(sx,sy,(rx/maxX)*gw,(ry/maxY)*gh,0,0,Math.PI*2);
            ctx.fillStyle=clusterColors[c%clusterColors.length]+'10';ctx.fill();
            ctx.strokeStyle=clusterColors[c%clusterColors.length]+'30';ctx.lineWidth=1;ctx.stroke();
        }
        // Points
        data.forEach((p,i)=>{const x=pad.l+(p.x/maxX)*gw;const y=pad.t+(p.y/maxY)*gh;const l=labels[i];ctx.beginPath();ctx.arc(x,y,l===-1?3:5,0,Math.PI*2);ctx.fillStyle=l===-1?colors.muted+'80':clusterColors[l%clusterColors.length]+'cc';ctx.fill();if(l===-1){ctx.strokeStyle=colors.red+'80';ctx.lineWidth=1;ctx.setLineDash([2,2]);ctx.stroke();ctx.setLineDash([]);}});
        // ε radius for first point
        if(data.length){const p=data[0];const x=pad.l+(p.x/maxX)*gw;const y=pad.t+(p.y/maxY)*gh;const r=(eps/maxX)*gw;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=colors.muted;ctx.font='9px JetBrains Mono';ctx.fillText('ε',x+r+3,y-3);}
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Easting (km)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Northing (km)',0,0);ctx.restore();
    }
    addSlider(ca,'ε (Epsilon)',1,10,3,0.5,v=>{eps=v;met.eps.textContent=v;});
    addSlider(ca,'minPts',2,10,4,1,v=>{minPts=v;met.minPts.textContent=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate','',()=>{genData();draw();});
    addBtn(br,'<i class="fa-solid fa-play"></i> Run DBSCAN','accent',()=>{runDBSCAN();draw();});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','danger',()=>{genData();draw();});
    ca.appendChild(br);
    addTabs(sp,['DBSCAN','Parameters','vs K-Means'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>DBSCAN Algorithm</strong><br><br>1. Pick an unvisited point<br>2. Find all points within ε radius<br>3. If ≥ minPts neighbors → start a cluster<br>4. Expand cluster by visiting neighbors recursively<br>5. Points with < minPts neighbors and not reachable = noise<br><br>No need to specify K! Finds clusters automatically.',
        '<strong>Parameter Selection</strong><br><br>• <strong>ε (epsilon):</strong> Neighborhood radius. Too small → many noise points. Too large → clusters merge.<br>• <strong>minPts:</strong> Minimum points to form a cluster. Rule of thumb: minPts ≥ dimensions + 1<br><br>Use the <strong>k-distance plot</strong> to find the elbow for optimal ε.',
        '<strong>DBSCAN vs K-Means</strong><br><br>DBSCAN advantages:<br>• No need to specify K<br>• Finds arbitrary shapes (not just spherical)<br>• Detects noise/outliers<br><br>K-Means advantages:<br>• Faster on large datasets<br>• More predictable cluster sizes<br>• Easier to interpret'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>DBSCAN</strong> — Generate data, then Run DBSCAN. Gray dashed points are noise.'}));
    genData();draw();
}

/* ================================================================
   DEMO 6: GIS LAND CLASSIFICATION (Self-Organizing Map)
   ================================================================ */
function buildGISClassification(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-map"></i> SOM Land Use Classification'}));
    addInfo(sp,'<strong>Self-Organizing Map</strong> for unsupervised land use classification from satellite spectral data. The SOM grid maps high-dimensional spectral bands to a 2D grid preserving topology.');
    const met=addMetrics(sp,[{id:'gridSize',val:'10×10',label:'SOM Grid'},{id:'epoch',val:'0',label:'Epoch'},{id:'qError',val:'—',label:'Quant. Error'},{id:'classes',val:'5',label:'Land Classes'}]);
    const log=addLog(sp);
    let gridN=10,epochs=0;
    const landTypes=['Urban','Forest','Water','Agri','Barren'];
    const landColors=['#9ca3af','#22c55e','#0ea5e9','#f59e0b','#a0845c'];
    // SOM grid weights (3 bands: Red, Green, NIR)
    let som=[];
    function initSOM(){
        som=[];epochs=0;met.epoch.textContent='0';
        for(let i=0;i<gridN;i++){som[i]=[];for(let j=0;j<gridN;j++){som[i][j]={r:rand(0,1),g:rand(0,1),nir:rand(0,1)};}}
        log.add('SOM grid initialized ('+gridN+'×'+gridN+')','ok');
    }
    // Training data (spectral signatures)
    const trainingData=[
        // Urban: high red, medium green, low NIR
        ...Array.from({length:20},()=>({r:rand(0.5,0.8),g:rand(0.3,0.5),nir:rand(0.1,0.3)})),
        // Forest: low red, high green, very high NIR
        ...Array.from({length:20},()=>({r:rand(0.1,0.3),g:rand(0.4,0.7),nir:rand(0.7,0.95)})),
        // Water: low all, slightly higher blue/green
        ...Array.from({length:20},()=>({r:rand(0.05,0.15),g:rand(0.1,0.25),nir:rand(0.01,0.1)})),
        // Agriculture: medium red, high green, high NIR
        ...Array.from({length:20},()=>({r:rand(0.2,0.4),g:rand(0.5,0.7),nir:rand(0.5,0.8)})),
        // Barren: high red, medium green, medium NIR
        ...Array.from({length:20},()=>({r:rand(0.5,0.7),g:rand(0.35,0.5),nir:rand(0.3,0.5)}))
    ];
    function trainEpoch(){
        const lr=0.3*Math.exp(-epochs/50);const sigma=gridN/2*Math.exp(-epochs/30);
        for(let t=0;t<trainingData.length;t++){
            const input=trainingData[Math.floor(rand(0,trainingData.length))];
            // Find BMU
            let bmuI=0,bmuJ=0,bmuD=Infinity;
            for(let i=0;i<gridN;i++){for(let j=0;j<gridN;j++){const d=(som[i][j].r-input.r)**2+(som[i][j].g-input.g)**2+(som[i][j].nir-input.nir)**2;if(d<bmuD){bmuD=d;bmuI=i;bmuJ=j;}}}
            // Update neighbors
            for(let i=0;i<gridN;i++){for(let j=0;j<gridN;j++){const dist=Math.sqrt((i-bmuI)**2+(j-bmuJ)**2);const h=Math.exp(-(dist*dist)/(2*sigma*sigma));const rate=lr*h;som[i][j].r+=rate*(input.r-som[i][j].r);som[i][j].g+=rate*(input.g-som[i][j].g);som[i][j].nir+=rate*(input.nir-som[i][j].nir);}}
        }
        epochs++;met.epoch.textContent=epochs;
        // Quantization error
        let qe=0;trainingData.forEach(inp=>{let minD=Infinity;for(let i=0;i<gridN;i++){for(let j=0;j<gridN;j++){const d=Math.sqrt((som[i][j].r-inp.r)**2+(som[i][j].g-inp.g)**2+(som[i][j].nir-inp.nir)**2);if(d<minD)minD=d;}}qe+=minD;});
        met.qError.textContent=(qe/trainingData.length).toFixed(4);
    }
    function classifySOM(cell){
        // Compare to land type centroids
        const centroids=[{r:0.65,g:0.4,nir:0.2},{r:0.2,g:0.55,nir:0.85},{r:0.1,g:0.18,nir:0.05},{r:0.3,g:0.6,nir:0.65},{r:0.6,g:0.43,nir:0.4}];
        let best=0,bestD=Infinity;centroids.forEach((c,ci)=>{const d=(cell.r-c.r)**2+(cell.g-c.g)**2+(cell.nir-c.nir)**2;if(d<bestD){bestD=d;best=ci;}});
        return best;
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:30,r:30,t:25,b:40};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const cellW=gw/gridN,cellH=gh/gridN;
        // Draw SOM grid as colored cells
        for(let i=0;i<gridN;i++){for(let j=0;j<gridN;j++){const cell=som[i][j];const cls=classifySOM(cell);const x=pad.l+j*cellW;const y=pad.t+i*cellH;
            ctx.fillStyle=landColors[cls];ctx.globalAlpha=0.6;ctx.fillRect(x,y,cellW-1,cellH-1);ctx.globalAlpha=1;
            // Also show RGB mapping
            const r=Math.floor(cell.r*200+55);const g=Math.floor(cell.g*200+55);const b=Math.floor(cell.nir*150+50);
            ctx.fillStyle=`rgba(${r},${g},${b},0.3)`;ctx.fillRect(x,y,cellW-1,cellH-1);
            // Border
            ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=0.5;ctx.strokeRect(x,y,cellW-1,cellH-1);
        }}
        // Legend
        landTypes.forEach((lt,i)=>{const x=pad.l+i*(gw/5);ctx.fillStyle=landColors[i];ctx.fillRect(x,H-pad.b+10,14,14);ctx.fillStyle=colors.text;ctx.font='10px Inter';ctx.textAlign='left';ctx.fillText(lt,x+18,H-pad.b+21);});
        ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='right';ctx.fillText('Epoch: '+epochs,W-pad.r,pad.t+12);
    }
    addSlider(ca,'Grid Size',5,15,10,1,v=>{gridN=v;met.gridSize.textContent=v+'×'+v;initSOM();draw();});
    const br=CE('div','app-demo-btn-row');
    let trainInterval=null;
    addBtn(br,'<i class="fa-solid fa-play"></i> Train','',()=>{if(trainInterval)return;trainInterval=setInterval(()=>{trainEpoch();draw();if(epochs>=100){clearInterval(trainInterval);trainInterval=null;log.add('Training complete (100 epochs)','ok');}},100);});
    addBtn(br,'<i class="fa-solid fa-forward-step"></i> Step','accent',()=>{trainEpoch();draw();});
    addBtn(br,'<i class="fa-solid fa-pause"></i> Pause','warn',()=>{if(trainInterval){clearInterval(trainInterval);trainInterval=null;}});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','danger',()=>{if(trainInterval){clearInterval(trainInterval);trainInterval=null;}initSOM();draw();});
    ca.appendChild(br);
    addTabs(sp,['SOM Theory','Spectral','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Self-Organizing Map (Kohonen)</strong><br><br>1. Initialize grid with random weights<br>2. For each input, find Best Matching Unit (BMU)<br>3. Update BMU and neighbors toward input<br>4. Learning rate & neighborhood shrink over time<br>5. Grid self-organizes: nearby cells ↔ similar inputs<br><br>Result: 2D map preserving topological relationships.',
        '<strong>Spectral Signatures</strong><br><br>Each land type has a unique spectral fingerprint:<br>• <strong>Urban:</strong> High red reflectance, low NIR<br>• <strong>Forest:</strong> Low red, very high NIR<br>• <strong>Water:</strong> Low across all bands<br>• <strong>Agriculture:</strong> High NIR (chlorophyll), medium red<br>• <strong>Barren:</strong> High red, moderate NIR<br><br>SOM learns to distinguish these without labeled training data.',
        '<strong>Remote Sensing Applications</strong><br><br>• Land use / land cover (LULC) mapping<br>• Urban sprawl monitoring<br>• Deforestation detection<br>• Flood extent mapping from SAR data<br>• Crop type classification<br>• Geological mapping for mineral exploration'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>SOM Grid</strong> — Click Train to watch the map self-organize. Colors show classified land types.'}));
    initSOM();draw();
}

/* ── Wire up cards ── */
const demos=[
    {title:'Soil Zone Clustering',icon:'fa-circle-nodes',build:buildSoilClustering},
    {title:'Material Hierarchy',icon:'fa-sitemap',build:buildMaterialHierarchy},
    {title:'Sensor Anomaly Detector',icon:'fa-triangle-exclamation',build:buildSensorAnomaly},
    {title:'Borehole PCA',icon:'fa-compress',build:buildBoreholePCA},
    {title:'Water Quality Zones',icon:'fa-map-location-dot',build:buildWaterQualityZones},
    {title:'GIS Land Classification',icon:'fa-map',build:buildGISClassification}
];
function init(){
    const cards=document.querySelectorAll('.app-grid .app-item');
    cards.forEach((card,i)=>{if(i<demos.length){card.style.cursor='pointer';card.addEventListener('click',()=>openOverlay(demos[i].title,demos[i].icon,demos[i].build));
        const badge=CE('div');badge.style.cssText='margin-top:8px;font-size:.72rem;color:#00d4aa;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:center';badge.innerHTML='<i class="fa-solid fa-hand-pointer"></i> Click for Interactive Demo';card.appendChild(badge);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
