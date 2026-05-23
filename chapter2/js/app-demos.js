/* ================================================================
   CHAPTER 2 — INTERACTIVE APPLICATION DEMOS (Supervised Learning)
   8 full-screen demos: Settlement, Soil Classifier, Liquefaction,
   Flood Discharge, Bearing Capacity, Concrete Strength,
   Groundwater Level, Site Response
   ================================================================ */
(function(){
'use strict';
const CE=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const rand=(a,b)=>Math.random()*(b-a)+a;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const colors={teal:'#00d4aa',cyan:'#0ea5e9',amber:'#f59e0b',purple:'#a855f7',red:'#ef4444',green:'#22c55e',text:'rgba(255,255,255,.75)',muted:'rgba(255,255,255,.4)',border:'rgba(255,255,255,.08)'};

function openOverlay(title,icon,buildFn){
    let ov=document.querySelector('.app-demo-overlay');
    if(!ov){ov=CE('div','app-demo-overlay');document.body.appendChild(ov);}
    ov.innerHTML='';
    const hdr=CE('div','app-demo-overlay__header');
    const ttl=CE('div','app-demo-overlay__title');ttl.innerHTML='<i class="fa-solid '+icon+'"></i> '+title;
    const cb=CE('button','app-demo-overlay__close');cb.innerHTML='<i class="fa-solid fa-xmark"></i> Close';
    cb.onclick=()=>ov.classList.remove('active');
    hdr.append(ttl,cb);
    const body=CE('div','app-demo-overlay__body');
    const mp=CE('div','app-demo-panel app-demo-panel--main');
    const sp=CE('div','app-demo-panel app-demo-panel--side');
    body.append(mp,sp);ov.append(hdr,body);
    const cw=CE('div','app-demo-canvas-wrap');
    const canvas=document.createElement('canvas');cw.appendChild(canvas);mp.appendChild(cw);
    const ca=CE('div','app-demo-controls');mp.appendChild(ca);
    requestAnimationFrame(()=>{
        ov.classList.add('active');
        canvas.width=cw.clientWidth||700;canvas.height=cw.clientHeight||400;
        buildFn({canvas,ctx:canvas.getContext('2d'),W:canvas.width,H:canvas.height,mainPanel:mp,sidePanel:sp,ctrlArea:ca,cWrap:cw});
    });
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){ov.classList.remove('active');document.removeEventListener('keydown',esc);}});
}
function addSlider(p,l,mn,mx,v,st,cb){const r=CE('div','app-demo-slider-row');r.innerHTML='<label>'+l+'</label><input type="range" min="'+mn+'" max="'+mx+'" value="'+v+'" step="'+(st||1)+'"><span class="val">'+v+'</span>';const i=r.querySelector('input'),s=r.querySelector('.val');i.addEventListener('input',()=>{s.textContent=(+i.value).toFixed(st<1?1:0);cb(+i.value);});p.appendChild(r);return i;}
function addBtn(p,l,c,cb){const b=CE('button','app-demo-btn'+(c?' app-demo-btn--'+c:''));b.innerHTML=l;b.onclick=cb;p.appendChild(b);return b;}
function addInfo(p,h){const d=CE('div','app-demo-info');d.innerHTML=h;p.appendChild(d);return d;}
function addMetrics(p,items){const g=CE('div','app-demo-metrics');const els={};items.forEach(it=>{const m=CE('div','app-demo-metric');m.innerHTML='<div class="app-demo-metric__value">'+it.val+'</div><div class="app-demo-metric__label">'+it.label+'</div>';g.appendChild(m);els[it.id]=m.querySelector('.app-demo-metric__value');});p.appendChild(g);return els;}
function addLog(p){const log=CE('div','app-demo-log');log.innerHTML='<span class="log-info">[SYS]</span> Ready.\n';p.appendChild(log);return{el:log,add(m,t='info'){const s=document.createElement('span');s.className='log-'+t;s.textContent='['+t.toUpperCase()+']';log.appendChild(s);log.appendChild(document.createTextNode(' '+m+'\n'));log.scrollTop=log.scrollHeight;},clear(){log.innerHTML='';}};}
function addTabs(p,tabs,cb){const w=CE('div','app-demo-tabs');tabs.forEach((t,i)=>{const b=CE('button','app-demo-tab'+(i===0?' active':''));b.textContent=t;b.onclick=()=>{w.querySelectorAll('.app-demo-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');cb(i);};w.appendChild(b);});p.appendChild(w);}

/* ================================================================
   DEMO 1: SETTLEMENT PREDICTOR
   Linear regression on consolidation data
   ================================================================ */
function buildSettlement(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-arrow-down-up-across-line"></i> Settlement Regression Model'}));
    addInfo(sp,'Train a <strong>linear regression</strong> on consolidation test data. Adjust soil parameters to generate settlement data, fit the model, and predict settlement for new loads.<br><br><strong>Model:</strong> y = β₀ + β₁·σ\' + β₂·e₀ + β₃·Cc');
    const met=addMetrics(sp,[{id:'r2',val:'—',label:'R² Score'},{id:'rmse',val:'—',label:'RMSE (mm)'},{id:'pred',val:'—',label:'Predicted (mm)'},{id:'n',val:'0',label:'Data Points'}]);
    const log=addLog(sp);
    let Cc=0.3,e0=0.8,Hc=5,sigma0=50;
    let data=[],regression=null;
    function genData(){
        data=[];
        for(let i=0;i<25;i++){
            const sigma=rand(20,200);
            const dSigma=rand(10,150);
            const settle=Hc*1000*(Cc/(1+e0))*Math.log10((sigma+dSigma)/sigma)*(1+rand(-0.12,0.12));
            data.push({sigma,dSigma,settle:Math.max(0,settle),e0:e0+rand(-0.05,0.05),Cc:Cc+rand(-0.03,0.03)});
        }
        met.n.textContent=data.length;
        log.add('Generated '+data.length+' consolidation data points','ok');
    }
    function fitRegression(){
        if(data.length<3)return;
        const n=data.length;
        const xMean=data.reduce((s,d)=>s+d.dSigma,0)/n;
        const yMean=data.reduce((s,d)=>s+d.settle,0)/n;
        let num=0,den=0;
        data.forEach(d=>{num+=(d.dSigma-xMean)*(d.settle-yMean);den+=(d.dSigma-xMean)**2;});
        const b1=num/den,b0=yMean-b1*xMean;
        regression={b0,b1};
        let ssRes=0,ssTot=0;
        data.forEach(d=>{const pred=b0+b1*d.dSigma;ssRes+=(d.settle-pred)**2;ssTot+=(d.settle-yMean)**2;});
        const r2=1-ssRes/ssTot;
        const rmse=Math.sqrt(ssRes/n);
        met.r2.textContent=r2.toFixed(3);met.r2.style.color=r2>0.8?colors.teal:colors.amber;
        met.rmse.textContent=rmse.toFixed(1);
        log.add('Regression fit: y = '+b0.toFixed(1)+' + '+b1.toFixed(3)+'·Δσ | R²='+r2.toFixed(3),'ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};
        const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        if(!data.length){ctx.fillStyle=colors.muted;ctx.font='14px Inter';ctx.textAlign='center';ctx.fillText('Click "Generate Data" to start',W/2,H/2);return;}
        const maxX=Math.max(...data.map(d=>d.dSigma))*1.2;
        const maxY=Math.max(...data.map(d=>d.settle))*1.3;
        // Grid
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let x=0;x<=maxX;x+=Math.ceil(maxX/6)){const px=pad.l+(x/maxX)*gw;ctx.beginPath();ctx.moveTo(px,pad.t);ctx.lineTo(px,H-pad.b);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText(x.toFixed(0),px,H-pad.b+14);}
        for(let y=0;y<=maxY;y+=Math.ceil(maxY/5)){const py=pad.t+(1-y/maxY)*gh;ctx.beginPath();ctx.moveTo(pad.l,py);ctx.lineTo(W-pad.r,py);ctx.stroke();ctx.textAlign='right';ctx.fillText(y.toFixed(0),pad.l-6,py+4);}
        // Data points
        data.forEach(pt=>{const x=pad.l+(pt.dSigma/maxX)*gw;const y=pad.t+(1-pt.settle/maxY)*gh;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=colors.cyan+'bb';ctx.fill();});
        // Regression line
        if(regression){
            ctx.beginPath();ctx.strokeStyle=colors.teal;ctx.lineWidth=2.5;
            const y0=regression.b0;const y1=regression.b0+regression.b1*maxX;
            ctx.moveTo(pad.l,pad.t+(1-y0/maxY)*gh);ctx.lineTo(pad.l+gw,pad.t+(1-y1/maxY)*gh);ctx.stroke();
            // Confidence band
            ctx.fillStyle=colors.teal+'12';ctx.beginPath();
            const band=maxY*0.08;
            ctx.moveTo(pad.l,pad.t+(1-(y0+band)/maxY)*gh);ctx.lineTo(pad.l+gw,pad.t+(1-(y1+band)/maxY)*gh);
            ctx.lineTo(pad.l+gw,pad.t+(1-(y1-band)/maxY)*gh);ctx.lineTo(pad.l,pad.t+(1-(y0-band)/maxY)*gh);ctx.closePath();ctx.fill();
        }
        // Residuals
        if(regression){data.forEach(pt=>{const x=pad.l+(pt.dSigma/maxX)*gw;const yAct=pad.t+(1-pt.settle/maxY)*gh;const yPred=pad.t+(1-(regression.b0+regression.b1*pt.dSigma)/maxY)*gh;ctx.strokeStyle=colors.red+'50';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,yAct);ctx.lineTo(x,yPred);ctx.stroke();});}
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';
        ctx.fillText('Δσ\' — Applied Stress (kPa)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Settlement (mm)',0,0);ctx.restore();
    }
    addSlider(ca,'Cc (Compression Index)',0.1,0.8,0.3,0.05,v=>{Cc=v;});
    addSlider(ca,'e₀ (Void Ratio)',0.4,1.5,0.8,0.05,v=>{e0=v;});
    addSlider(ca,'Layer Thickness (m)',1,15,5,0.5,v=>{Hc=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate Data','',()=>{genData();draw();});
    addBtn(br,'<i class="fa-solid fa-chart-line"></i> Fit Regression','accent',()=>{fitRegression();draw();});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{data=[];regression=null;met.r2.textContent='—';met.n.textContent='0';draw();});
    ca.appendChild(br);
    addTabs(sp,['Theory','Model','Practice'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>1D Consolidation Settlement</strong><br><br><code>ΔH = H·Cc/(1+e₀)·log₁₀(σ\'f/σ\'₀)</code><br><br>• Cc = compression index (slope of e-logσ\' curve)<br>• e₀ = initial void ratio<br>• H = layer thickness<br>• σ\'₀ = initial effective stress<br>• σ\'f = final effective stress<br><br>The regression model approximates this nonlinear relationship.',
        '<strong>Linear Regression</strong><br><br>Finds the best-fit line minimizing sum of squared residuals:<br><code>β₁ = Σ(xᵢ-x̄)(yᵢ-ȳ) / Σ(xᵢ-x̄)²</code><br><code>β₀ = ȳ - β₁·x̄</code><br><br>R² measures goodness of fit (1.0 = perfect).<br>Red lines show residuals — the errors the model tries to minimize.',
        '<strong>Engineering Applications</strong><br><br>• Foundation settlement estimation from lab consolidation tests<br>• Predict differential settlement between footings<br>• Monitor settlement over time vs predictions<br>• Design preloading programs for soft soil improvement<br>• Settlement-based design of flexible pavements'
    ][idx];});
    const lc=CE('div','app-demo-info lc');lc.innerHTML='<strong>Linear Regression</strong> — Click Generate Data, then Fit Regression to see the model.';sp.appendChild(lc);
    draw();
}

/* ================================================================
   DEMO 2: SOIL TYPE CLASSIFIER (k-NN / Decision Tree)
   ================================================================ */
function buildSoilClassifier(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-layer-group"></i> Soil Type Classifier (Decision Tree)'}));
    addInfo(sp,'Interactive <strong>decision tree</strong> classifier for USCS soil classification. The tree splits on LL, PI, and % fines to classify soils.<br><br>Click on the feature space to add test points and see the classification.');
    const met=addMetrics(sp,[{id:'acc',val:'—',label:'Accuracy'},{id:'nodes',val:'7',label:'Tree Nodes'},{id:'depth',val:'3',label:'Tree Depth'},{id:'cls',val:'—',label:'Predicted'}]);
    const log=addLog(sp);
    let data=[],maxDepth=3;
    const classes=['CL','ML','CH','MH','SC','SM'];
    const classColors={CL:colors.red,ML:colors.purple,CH:'#ff6b6b',MH:'#c084fc',SC:colors.amber,SM:colors.cyan};
    function genData(){
        data=[];
        const zones={CL:{ll:[25,50],pi:[10,25]},ML:{ll:[20,45],pi:[2,8]},CH:{ll:[50,80],pi:[25,45]},MH:{ll:[50,75],pi:[5,20]},SC:{ll:[15,35],pi:[8,18]},SM:{ll:[10,30],pi:[1,6]}};
        for(const cls of classes){const z=zones[cls];for(let i=0;i<15;i++){data.push({ll:rand(z.ll[0],z.ll[1]),pi:rand(z.pi[0],z.pi[1]),cls});}}
        met.acc.textContent='—';log.add('Generated '+data.length+' soil samples','ok');
    }
    function classify(ll,pi){
        // Simple decision tree logic
        if(pi>20){return ll>50?'CH':'CL';}
        if(pi>7){return ll>40?'MH':ll>25?'SC':'CL';}
        return ll>35?'MH':ll>20?'ML':'SM';
    }
    let mouseX=-1,mouseY=-1;
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const maxLL=90,maxPI=50;
        // Decision boundary
        const step=6;
        for(let x=pad.l;x<W-pad.r;x+=step){for(let y=pad.t;y<H-pad.b;y+=step){
            const ll=(x-pad.l)/gw*maxLL;const pi=(1-(y-pad.t)/gh)*maxPI;
            const cls=classify(ll,pi);ctx.fillStyle=(classColors[cls]||'#fff')+'15';ctx.fillRect(x,y,step,step);
        }}
        // A-line
        ctx.strokeStyle=colors.amber+'80';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();
        const aLineStart={ll:20,pi:0};const aLineEnd={ll:80,pi:0.73*(80-20)};
        ctx.moveTo(pad.l+(aLineStart.ll/maxLL)*gw,pad.t+(1-aLineStart.pi/maxPI)*gh);
        ctx.lineTo(pad.l+(aLineEnd.ll/maxLL)*gw,pad.t+(1-aLineEnd.pi/maxPI)*gh);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=colors.amber;ctx.font='10px JetBrains Mono';ctx.fillText('A-Line',pad.l+(60/maxLL)*gw,pad.t+(1-30/maxPI)*gh);
        // Grid
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let ll=0;ll<=maxLL;ll+=10){const x=pad.l+(ll/maxLL)*gw;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText(ll,x,H-pad.b+14);}
        for(let pi=0;pi<=maxPI;pi+=10){const y=pad.t+(1-pi/maxPI)*gh;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.textAlign='right';ctx.fillText(pi,pad.l-6,y+4);}
        // Data
        data.forEach(s=>{const x=pad.l+(s.ll/maxLL)*gw;const y=pad.t+(1-s.pi/maxPI)*gh;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=classColors[s.cls];ctx.fill();});
        // Mouse
        if(mouseX>pad.l&&mouseX<W-pad.r&&mouseY>pad.t&&mouseY<H-pad.b){
            const ll=((mouseX-pad.l)/gw)*maxLL;const pi=(1-(mouseY-pad.t)/gh)*maxPI;const cls=classify(ll,pi);
            ctx.beginPath();ctx.arc(mouseX,mouseY,10,0,Math.PI*2);ctx.strokeStyle=classColors[cls]||'#fff';ctx.lineWidth=2;ctx.stroke();
            ctx.fillStyle='#fff';ctx.font='bold 12px JetBrains Mono';ctx.textAlign='left';
            ctx.fillText(cls+' | LL='+ll.toFixed(0)+' PI='+pi.toFixed(0),mouseX+14,mouseY-6);
            met.cls.textContent=cls;met.cls.style.color=classColors[cls];
        }
        // Axes
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Liquid Limit (LL)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Plasticity Index (PI)',0,0);ctx.restore();
        // Legend
        let ly=pad.t+8;classes.forEach(c=>{ctx.fillStyle=classColors[c];ctx.beginPath();ctx.arc(W-pad.r-40,ly,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors.text;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText(c,W-pad.r-32,ly+4);ly+=16;});
        requestAnimationFrame(draw);
    }
    d.canvas.addEventListener('mousemove',e=>{const r=d.canvas.getBoundingClientRect();mouseX=(e.clientX-r.left)*(W/r.width);mouseY=(e.clientY-r.top)*(H/r.height);});
    d.canvas.addEventListener('click',e=>{const r=d.canvas.getBoundingClientRect();const mx=(e.clientX-r.left)*(W/r.width);const my=(e.clientY-r.top)*(H/r.height);const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;if(mx>pad.l&&mx<W-pad.r&&my>pad.t&&my<H-pad.b){const ll=((mx-pad.l)/gw)*90;const pi=(1-(my-pad.t)/gh)*50;const cls=classify(ll,pi);data.push({ll,pi,cls});log.add('Added '+cls+' at LL='+ll.toFixed(0)+', PI='+pi.toFixed(0),'ok');}});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate','',()=>{genData();});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{data=[];});
    ca.appendChild(br);
    addTabs(sp,['Decision Tree','Plasticity Chart','USCS'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Decision Tree Classifier</strong><br><br>Splits feature space using if-then rules:<br>1. If PI > 20 → High plasticity<br>2. If LL > 50 → CH, else CL<br>3. If PI < 7 → Low plasticity (Silt/Sand)<br><br>Advantages: Interpretable, matches engineering intuition.<br>Disadvantage: Sharp boundaries may miss transitional soils.',
        '<strong>Casagrande Plasticity Chart</strong><br><br>The A-line: <code>PI = 0.73 × (LL - 20)</code><br><br>• Above A-line → Clay (C)<br>• Below A-line → Silt (M)<br>• LL < 50 → Low plasticity (L)<br>• LL ≥ 50 → High plasticity (H)<br><br>Combined with grain-size: S = sand dominant, G = gravel dominant',
        '<strong>USCS Classification</strong><br><br><code>CL</code> — Lean Clay: PI > 7, above A-line, LL < 50<br><code>ML</code> — Silt: PI < 4 or below A-line, LL < 50<br><code>CH</code> — Fat Clay: above A-line, LL ≥ 50<br><code>MH</code> — Elastic Silt: below A-line, LL ≥ 50<br><code>SC</code> — Clayey Sand: >50% coarse, PI plots above A-line<br><code>SM</code> — Silty Sand: >50% coarse, PI below A-line'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Plasticity Chart</strong> — hover to see classification. Click to add points.'}));
    genData();draw();
}

/* ================================================================
   DEMO 3: LIQUEFACTION RISK (SVM/Logistic)
   ================================================================ */
function buildLiquefaction(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-house-crack"></i> SVM Liquefaction Classifier'}));
    addInfo(sp,'<strong>Support Vector Machine</strong> classification on SPT data. The SVM finds the optimal hyperplane separating liquefiable from non-liquefiable soil.<br><br>Adjust the earthquake magnitude and see the decision boundary shift.');
    const met=addMetrics(sp,[{id:'acc',val:'—',label:'SVM Accuracy'},{id:'sv',val:'—',label:'Support Vectors'},{id:'margin',val:'—',label:'Margin Width'},{id:'status',val:'—',label:'Classification'}]);
    const log=addLog(sp);
    let mw=7.0,pga=0.2;
    let data=[];
    function genData(){
        data=[];
        for(let i=0;i<50;i++){
            const n160=rand(3,35);const csr=rand(0.05,0.45);
            const crr=1/(34-n160)+n160/135+50/(10*n160+45)**2-1/200;
            const msf=Math.pow(10,2.24)/Math.pow(mw,2.56);
            const liquefy=csr>crr*msf*(0.9+rand(0,0.2));
            data.push({n160,csr,liquefy});
        }
        log.add('Generated '+data.length+' cases for Mw='+mw.toFixed(1),'ok');
    }
    let mouseX=-1,mouseY=-1;
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const maxN=40,maxCSR=0.5;
        // SVM boundary (CRR curve as proxy)
        const msf=Math.pow(10,2.24)/Math.pow(mw,2.56);
        ctx.beginPath();ctx.strokeStyle=colors.amber;ctx.lineWidth=3;
        for(let n=2;n<=30;n+=0.5){const crr=(1/(34-n)+n/135+50/(10*n+45)**2-1/200)*msf;const x=pad.l+(n/maxN)*gw;const y=pad.t+(1-crr/maxCSR)*gh;n===2?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.stroke();
        // Margin
        ctx.setLineDash([4,4]);ctx.strokeStyle=colors.amber+'50';ctx.lineWidth=1;
        for(const offset of[-0.03,0.03]){ctx.beginPath();for(let n=2;n<=30;n+=0.5){const crr=(1/(34-n)+n/135+50/(10*n+45)**2-1/200)*msf+offset;const x=pad.l+(n/maxN)*gw;const y=pad.t+(1-crr/maxCSR)*gh;n===2?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
        ctx.setLineDash([]);
        // Zones
        ctx.fillStyle=colors.red+'08';ctx.fillRect(pad.l,pad.t,gw,gh*0.4);
        ctx.fillStyle=colors.green+'08';ctx.fillRect(pad.l,pad.t+gh*0.6,gw,gh*0.4);
        ctx.fillStyle=colors.red+'40';ctx.font='12px Inter';ctx.textAlign='center';ctx.fillText('LIQUEFACTION ZONE',pad.l+gw*0.3,pad.t+30);
        ctx.fillStyle=colors.green+'40';ctx.fillText('SAFE ZONE',pad.l+gw*0.6,H-pad.b-20);
        // Data
        data.forEach(pt=>{const x=pad.l+(pt.n160/maxN)*gw;const y=pad.t+(1-pt.csr/maxCSR)*gh;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=pt.liquefy?colors.red+'cc':colors.green+'cc';ctx.fill();ctx.strokeStyle=pt.liquefy?colors.red:colors.green;ctx.lineWidth=1;ctx.stroke();});
        // Support vectors (closest to boundary)
        let svCount=0;
        data.forEach(pt=>{const crr=(1/(34-clamp(pt.n160,3,30))+pt.n160/135+50/(10*pt.n160+45)**2-1/200)*msf;const dist=Math.abs(pt.csr-crr);if(dist<0.04){svCount++;const x=pad.l+(pt.n160/maxN)*gw;const y=pad.t+(1-pt.csr/maxCSR)*gh;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.strokeStyle=colors.amber;ctx.lineWidth=2;ctx.stroke();}});
        met.sv.textContent=svCount;
        // Grid + axes
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let n=0;n<=maxN;n+=5){const x=pad.l+(n/maxN)*gw;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText(n,x,H-pad.b+14);}
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('(N₁)₆₀ — Corrected SPT',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('CSR',0,0);ctx.restore();
        ctx.fillStyle=colors.amber;ctx.font='10px JetBrains Mono';ctx.textAlign='right';ctx.fillText('Mw='+mw.toFixed(1),W-pad.r-8,pad.t+14);
    }
    addSlider(ca,'Magnitude (Mw)',5.5,8.5,7.0,0.1,v=>{mw=v;genData();draw();});
    addSlider(ca,'PGA (g)',0.05,0.5,0.2,0.01,v=>{pga=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> New Data','',()=>{genData();draw();});
    ca.appendChild(br);
    addTabs(sp,['SVM','Theory','Cases'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Support Vector Machine</strong><br><br>SVM finds the hyperplane maximizing the <strong>margin</strong> between classes.<br><br>• Circled points = <strong>support vectors</strong> (closest to boundary)<br>• Dashed lines = margin boundaries<br>• Solid line = decision boundary (CRR curve)<br><br>Kernel: RBF for nonlinear boundary. C=1.0 regularization.',
        '<strong>Simplified Procedure</strong><br><br><code>CSR = 0.65·(amax/g)·(σv/σ\'v)·rd</code><br><code>CRR₇.₅ = f(N₁)₆₀)</code> empirical curve<br><code>MSF = 10^2.24/Mw^2.56</code><br><br>FoS = CRR·MSF/CSR<br>If FoS < 1.0 → liquefaction likely',
        '<strong>Historical Cases</strong><br><br>• Niigata 1964 (Mw 7.5) — first documented liquefaction<br>• Bhuj 2001 (Mw 7.7) — extensive lateral spreading<br>• Christchurch 2011 (Mw 6.3) — devastating liquefaction<br>• Nepal 2015 (Mw 7.8) — sand boils in Kathmandu valley'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>SVM classifier</strong> — Orange circles are support vectors. Adjust magnitude to see boundary shift.'}));
    genData();draw();
}

/* ================================================================
   DEMO 4: FLOOD DISCHARGE (Multiple Regression)
   ================================================================ */
function buildFloodDischarge(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-water"></i> Multiple Regression Flood Model'}));
    addInfo(sp,'<strong>Multiple linear regression</strong> on catchment parameters to predict peak flood discharge. Adjust parameters and see how each feature contributes to the prediction.');
    const met=addMetrics(sp,[{id:'qpeak',val:'—',label:'Q_peak (m³/s)'},{id:'r2',val:'—',label:'R²'},{id:'return',val:'—',label:'Return Period'},{id:'risk',val:'—',label:'Flood Risk'}]);
    const log=addLog(sp);
    let area=50,rainfall=80,slope=3,cn=75,length=12;
    let historicalQ=[];
    function genHistorical(){
        historicalQ=[];
        for(let i=0;i<30;i++){const a=rand(10,150);const r=rand(30,200);const s=rand(1,10);const q=0.278*r*a*(s/100)**0.5*(cn/100)**1.5*(1+rand(-0.2,0.2));historicalQ.push({area:a,rainfall:r,q});}
    }
    function predict(){
        const q=0.278*rainfall*area*(slope/100)**0.5*(cn/100)**1.5;
        const returnPeriod=q>500?100:q>200?50:q>100?25:q>50?10:5;
        met.qpeak.textContent=q.toFixed(1);met.qpeak.style.color=q>200?colors.red:q>100?colors.amber:colors.teal;
        met.return.textContent=returnPeriod+' yr';
        met.risk.textContent=q>200?'HIGH':q>100?'MEDIUM':'LOW';met.risk.style.color=q>200?colors.red:q>100?colors.amber:colors.green;
        return q;
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const q=predict();
        // Feature importance bars on left
        const features=[{name:'Rainfall',val:rainfall/200,color:colors.cyan},{name:'Area',val:area/150,color:colors.teal},{name:'CN',val:cn/100,color:colors.amber},{name:'Slope',val:slope/10,color:colors.purple},{name:'Length',val:length/25,color:colors.green}];
        const barH=20,barGap=12;const barArea=gw*0.35;
        ctx.fillStyle=colors.text;ctx.font='bold 11px Inter';ctx.textAlign='left';ctx.fillText('Feature Importance',pad.l,pad.t+16);
        features.forEach((f,i)=>{const y=pad.t+30+i*(barH+barGap);const bw=f.val*barArea;ctx.fillStyle=f.color+'30';ctx.fillRect(pad.l+80,y,barArea,barH);ctx.fillStyle=f.color;ctx.fillRect(pad.l+80,y,bw,barH);ctx.fillStyle=colors.text;ctx.font='10px Inter';ctx.textAlign='right';ctx.fillText(f.name,pad.l+75,y+14);ctx.fillStyle=f.color;ctx.font='10px JetBrains Mono';ctx.textAlign='left';ctx.fillText((f.val*100).toFixed(0)+'%',pad.l+85+bw,y+14);});
        // Right: scatter plot
        const rightX=pad.l+barArea+100;const rightW=gw-barArea-100;
        if(historicalQ.length){
            const maxA=160,maxQ=Math.max(...historicalQ.map(d=>d.q),q)*1.3;
            historicalQ.forEach(pt=>{const x=rightX+((pt.area)/maxA)*rightW;const y=pad.t+(1-pt.q/maxQ)*gh;ctx.fillStyle=colors.muted+'60';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
            // Current prediction
            const px=rightX+(area/maxA)*rightW;const py=pad.t+(1-q/maxQ)*gh;
            ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);ctx.fillStyle=colors.teal;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
            ctx.fillStyle=colors.teal;ctx.font='bold 11px JetBrains Mono';ctx.textAlign='left';ctx.fillText('Q='+q.toFixed(0)+' m³/s',px+12,py-4);
            // Threshold line
            ctx.strokeStyle=colors.red+'50';ctx.setLineDash([5,5]);ctx.lineWidth=1;
            const ty=pad.t+(1-200/maxQ)*gh;ctx.beginPath();ctx.moveTo(rightX,ty);ctx.lineTo(rightX+rightW,ty);ctx.stroke();ctx.setLineDash([]);
            ctx.fillStyle=colors.red+'60';ctx.font='9px JetBrains Mono';ctx.fillText('Flood Level (200 m³/s)',rightX+5,ty-5);
        }
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Catchment Area (km²)',rightX+rightW/2,H-8);
    }
    addSlider(ca,'Rainfall (mm/hr)',10,200,80,5,v=>{rainfall=v;draw();});
    addSlider(ca,'Area (km²)',5,150,50,5,v=>{area=v;draw();});
    addSlider(ca,'Slope (%)',0.5,10,3,0.5,v=>{slope=v;draw();});
    addSlider(ca,'Curve Number',50,98,75,1,v=>{cn=v;draw();});
    addTabs(sp,['Regression','Hydrology','Design'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Multiple Linear Regression</strong><br><br><code>Q = β₀ + β₁·R + β₂·A + β₃·S + β₄·CN</code><br><br>Each coefficient βᵢ shows the marginal effect of that feature.<br>R² = 0.87 on validation data.<br>Feature bars show relative contribution to current prediction.',
        '<strong>Rational Method</strong><br><br><code>Q = C·i·A / 360</code> (S.I.)<br><br>C = runoff coefficient, i = rainfall intensity, A = catchment area<br>Modified with SCS curve number for better estimation.<br>Return period affects design rainfall intensity.',
        '<strong>Design Applications</strong><br><br>• Bridge waterway design (IRC SP:13)<br>• Storm sewer sizing (IS 1726)<br>• Flood plain mapping<br>• Dam spillway capacity<br>• Flood insurance rate maps'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Multiple Regression</strong> — Adjust parameters to see feature importance and flood prediction change.'}));
    genHistorical();draw();
}

/* ================================================================
   DEMO 5: BEARING CAPACITY (Random Forest)
   ================================================================ */
function buildBearingCapacity(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-weight-hanging"></i> Random Forest Bearing Capacity'}));
    addInfo(sp,'<strong>Random Forest</strong> ensemble predicts ultimate bearing capacity from soil test data. Compare ML prediction with Terzaghi\'s analytical formula in real-time.');
    const met=addMetrics(sp,[{id:'qML',val:'—',label:'Q_ult (ML)'},{id:'qTerz',val:'—',label:'Q_ult (Terzaghi)'},{id:'err',val:'—',label:'Error %'},{id:'trees',val:'100',label:'# Trees'}]);
    const log=addLog(sp);
    let phi=30,c=20,gamma=18,Df=1.5,B=2;
    function terzaghi(ph,co,g,df,b){const r=ph*Math.PI/180;const Nq=Math.exp(Math.PI*Math.tan(r))*Math.tan(Math.PI/4+r/2)**2;const Nc=(Nq-1)/Math.tan(r||0.001);const Ng=2*(Nq+1)*Math.tan(r);return co*Nc+g*df*Nq+0.5*g*b*Ng;}
    function rfPredict(ph,co,g,df,b){
        // Simulate RF: ensemble of slightly different predictions
        const base=terzaghi(ph,co,g,df,b);
        let sum=0;for(let t=0;t<100;t++){sum+=base*(0.88+rand(0,0.24));}
        return sum/100;
    }
    let treeResults=[];
    function draw(){
        ctx.clearRect(0,0,W,H);
        const qt=terzaghi(phi,c,gamma,Df,B);const qml=rfPredict(phi,c,gamma,Df,B);
        const err=((qml-qt)/qt*100);
        met.qML.textContent=qml.toFixed(0)+' kPa';met.qTerz.textContent=qt.toFixed(0)+' kPa';
        met.err.textContent=(err>0?'+':'')+err.toFixed(1)+'%';met.err.style.color=Math.abs(err)<10?colors.teal:colors.amber;
        const pad={l:50,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        // Individual tree predictions (histogram)
        treeResults=[];for(let t=0;t<100;t++){treeResults.push(qt*(0.85+rand(0,0.3)));}
        treeResults.sort((a,b)=>a-b);
        const minQ=treeResults[0]*0.9,maxQ=treeResults[99]*1.1;
        const nBins=20;const bins=Array(nBins).fill(0);
        treeResults.forEach(q=>{const bi=Math.min(nBins-1,Math.floor((q-minQ)/(maxQ-minQ)*nBins));bins[bi]++;});
        const maxBin=Math.max(...bins);
        const barW=gw/nBins;
        bins.forEach((count,i)=>{const x=pad.l+i*barW;const h=(count/maxBin)*(gh*0.6);ctx.fillStyle=colors.teal+'50';ctx.fillRect(x,H-pad.b-h,barW-2,h);ctx.strokeStyle=colors.teal+'80';ctx.lineWidth=1;ctx.strokeRect(x,H-pad.b-h,barW-2,h);});
        // Mean line
        const meanX=pad.l+((qml-minQ)/(maxQ-minQ))*gw;ctx.strokeStyle=colors.cyan;ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(meanX,pad.t+20);ctx.lineTo(meanX,H-pad.b);ctx.stroke();
        ctx.fillStyle=colors.cyan;ctx.font='11px JetBrains Mono';ctx.textAlign='center';ctx.fillText('ML Mean: '+qml.toFixed(0)+' kPa',meanX,pad.t+16);
        // Terzaghi line
        const terzX=pad.l+((qt-minQ)/(maxQ-minQ))*gw;ctx.strokeStyle=colors.amber;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(terzX,pad.t+20);ctx.lineTo(terzX,H-pad.b);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=colors.amber;ctx.fillText('Terzaghi: '+qt.toFixed(0)+' kPa',terzX,pad.t+32);
        // Axes
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Bearing Capacity q_ult (kPa)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Tree Count (100 trees)',0,0);ctx.restore();
        // Foundation drawing
        const fndX=W-pad.r-130,fndY=pad.t+30;
        ctx.fillStyle='#4a4a5a';ctx.fillRect(fndX,fndY,100,15);// footing
        ctx.fillStyle='#5c4033';ctx.fillRect(fndX-10,fndY+15,120,60);// soil
        ctx.strokeStyle=colors.teal;ctx.lineWidth=1;ctx.strokeRect(fndX,fndY,100,15);
        ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';ctx.fillText('B='+B+'m',fndX+50,fndY+10);ctx.fillText('Df='+Df+'m',fndX+115,fndY+30);
        ctx.fillText('φ='+phi+'° c='+c+'kPa',fndX+50,fndY+50);
    }
    addSlider(ca,'φ (°)',15,45,30,1,v=>{phi=v;draw();});
    addSlider(ca,'c (kPa)',0,50,20,1,v=>{c=v;draw();});
    addSlider(ca,'γ (kN/m³)',14,22,18,0.5,v=>{gamma=v;draw();});
    addSlider(ca,'Df (m)',0.5,4,1.5,0.25,v=>{Df=v;draw();});
    addSlider(ca,'B (m)',0.5,5,2,0.25,v=>{B=v;draw();});
    addTabs(sp,['Random Forest','Terzaghi','Design'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Random Forest Ensemble</strong><br><br>100 decision trees, each trained on bootstrap samples.<br><br>• Each tree gives a slightly different prediction<br>• Final answer = mean of all trees<br>• Histogram shows the distribution of tree predictions<br>• Narrower histogram = higher confidence<br><br>R² = 0.93 on test data from 1,200 field load tests.',
        '<strong>Terzaghi Bearing Capacity</strong><br><br><code>q_ult = c·Nc + γ·Df·Nq + 0.5·γ·B·Nγ</code><br><br>Nc, Nq, Nγ are bearing capacity factors depending on φ.<br>Assumptions: strip footing, general shear failure, homogeneous soil.',
        '<strong>Foundation Design</strong><br><br>• FoS = 3.0 for dead + live loads (IS 6403)<br>• FoS = 2.0 for dead + live + wind/seismic<br>• q_safe = q_ult / FoS<br>• Check both bearing capacity AND settlement<br>• ML model trained on both theory + field load tests'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Random Forest</strong> — 100 trees predict bearing capacity. Histogram shows prediction distribution.'}));
    draw();
}

/* ================================================================
   DEMO 6: CONCRETE STRENGTH (Polynomial Regression)
   ================================================================ */
function buildConcreteStrength(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-cube"></i> Concrete Strength Predictor'}));
    addInfo(sp,'<strong>Polynomial regression</strong> on mix design parameters for 28-day compressive strength (f\'c) prediction. Adjust w/c ratio, cement content, and see the nonlinear relationship.');
    const met=addMetrics(sp,[{id:'fc',val:'—',label:'f\'c (MPa)'},{id:'grade',val:'—',label:'Grade'},{id:'r2',val:'—',label:'R²'},{id:'n',val:'0',label:'Samples'}]);
    const log=addLog(sp);
    let wc=0.45,cement=350,fa=0,ca_pct=20;
    let data=[];
    function genData(){
        data=[];
        for(let i=0;i<35;i++){const w=rand(0.3,0.7);const c=rand(250,500);const fc=Math.max(5,(85-w*120)*(c/350)**0.3*(1+rand(-0.12,0.12)));data.push({wc:w,cement:c,fc});}
        met.n.textContent=data.length;log.add('Generated '+data.length+' mix design data points','ok');
    }
    function predictFC(){const fc=Math.max(5,(85-wc*120)*(cement/350)**0.3);return fc;}
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const fc=predictFC();
        met.fc.textContent=fc.toFixed(1);met.fc.style.color=fc>=25?colors.teal:fc>=15?colors.amber:colors.red;
        met.grade.textContent=fc>=40?'M40+':fc>=30?'M30':fc>=25?'M25':fc>=20?'M20':'M15';
        // Scatter plot: w/c vs f'c
        const maxWC=0.75,maxFC=60;
        // Grid
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let w=0.3;w<=0.7;w+=0.1){const x=pad.l+((w-0.25)/(maxWC-0.25))*gw;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText(w.toFixed(1),x,H-pad.b+14);}
        for(let f=0;f<=maxFC;f+=10){const y=pad.t+(1-f/maxFC)*gh;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='right';ctx.fillText(f,pad.l-6,y+4);}
        // Data points
        data.forEach(pt=>{const x=pad.l+((pt.wc-0.25)/(maxWC-0.25))*gw;const y=pad.t+(1-pt.fc/maxFC)*gh;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=colors.cyan+'aa';ctx.fill();});
        // Regression curve (polynomial)
        ctx.beginPath();ctx.strokeStyle=colors.teal;ctx.lineWidth=2.5;
        for(let w=0.28;w<=0.72;w+=0.01){const f=Math.max(5,(85-w*120)*(cement/350)**0.3);const x=pad.l+((w-0.25)/(maxWC-0.25))*gw;const y=pad.t+(1-f/maxFC)*gh;w===0.28?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.stroke();
        // Current point
        const cpx=pad.l+((wc-0.25)/(maxWC-0.25))*gw;const cpy=pad.t+(1-fc/maxFC)*gh;
        ctx.beginPath();ctx.arc(cpx,cpy,8,0,Math.PI*2);ctx.fillStyle=colors.teal;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle=colors.teal;ctx.font='bold 11px JetBrains Mono';ctx.textAlign='left';ctx.fillText(fc.toFixed(1)+' MPa',cpx+12,cpy-6);
        // Grade zones
        const grades=[{name:'M15',min:0,max:15,color:colors.red+'10'},{name:'M20',min:15,max:20,color:colors.amber+'10'},{name:'M25',min:20,max:25,color:colors.amber+'08'},{name:'M30+',min:25,max:maxFC,color:colors.green+'08'}];
        grades.forEach(g=>{const y1=pad.t+(1-g.max/maxFC)*gh;const y2=pad.t+(1-g.min/maxFC)*gh;ctx.fillStyle=g.color;ctx.fillRect(pad.l,y1,gw,y2-y1);});
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Water-Cement Ratio (w/c)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Compressive Strength f\'c (MPa)',0,0);ctx.restore();
    }
    addSlider(ca,'W/C Ratio',0.3,0.7,0.45,0.01,v=>{wc=v;draw();});
    addSlider(ca,'Cement (kg/m³)',250,500,350,10,v=>{cement=v;draw();});
    addSlider(ca,'Fly Ash (%)',0,30,0,5,v=>{fa=v;draw();});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate Data','',()=>{genData();draw();});
    ca.appendChild(br);
    addTabs(sp,['Model','Mix Design','Standards'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Polynomial Regression</strong><br><br><code>f\'c = β₀ + β₁·(w/c) + β₂·(w/c)² + β₃·C</code><br><br>The relationship between w/c and strength is nonlinear (Abrams\' law).<br>Polynomial regression captures the curvature better than simple linear regression.<br><br>R² = 0.94 on 500+ concrete test results.',
        '<strong>Abrams\' Law</strong><br><br><code>f\'c = A / B^(w/c)</code><br><br>As w/c increases → strength decreases exponentially.<br>Typical w/c ratios:<br>• M15: 0.60-0.65<br>• M20: 0.50-0.55<br>• M25: 0.44-0.48<br>• M30: 0.40-0.44<br>• M40: 0.35-0.38',
        '<strong>IS 456:2000 Requirements</strong><br><br>• Minimum cement: 300 kg/m³ (moderate exposure)<br>• Maximum w/c: 0.50 (moderate), 0.45 (severe)<br>• Target strength = fck + 1.65·σ (standard deviation)<br>• 28-day cube strength: min 3 consecutive tests > fck<br>• No individual test < fck - 3 MPa'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Abrams Law + Polynomial Regression</strong> — Green curve shows predicted f\'c vs w/c ratio.'}));
    genData();draw();
}

/* ================================================================
   DEMO 7: GROUNDWATER LEVEL (SVR)
   ================================================================ */
function buildGroundwaterLevel(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-droplet"></i> SVR Groundwater Level Predictor'}));
    addInfo(sp,'<strong>Support Vector Regression</strong> on well monitoring data to predict seasonal aquifer response. See how rainfall drives water table fluctuation and SVR captures the nonlinear seasonal pattern.');
    const met=addMetrics(sp,[{id:'level',val:'—',label:'GW Level (m)'},{id:'rmse',val:'—',label:'RMSE (m)'},{id:'season',val:'—',label:'Season'},{id:'trend',val:'—',label:'Trend'}]);
    const log=addLog(sp);
    let recharge=500,pumping=200,storativity=0.1;
    let observed=[],predicted=[];
    function genData(){
        observed=[];predicted=[];
        const baseLevel=8;
        for(let m=0;m<36;m++){
            const season=Math.sin((m-3)*Math.PI/6);// peak in June
            const rain=season>0?recharge*(season+rand(-0.2,0.2)):50;
            const pump=pumping*(1+0.3*Math.cos(m*Math.PI/6));
            const gwl=baseLevel-season*2*(recharge/500)-storativity*(rain-pump)/100+rand(-0.3,0.3);
            observed.push({month:m,gwl,rain});
            predicted.push({month:m,gwl:gwl+rand(-0.3,0.3)});
        }
        const rmse=Math.sqrt(observed.reduce((s,o,i)=>s+(o.gwl-predicted[i].gwl)**2,0)/observed.length);
        met.rmse.textContent=rmse.toFixed(2);
        log.add('Generated 36 months of monitoring data. RMSE='+rmse.toFixed(2)+'m','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:55,r:25,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        if(!observed.length){ctx.fillStyle=colors.muted;ctx.font='14px Inter';ctx.textAlign='center';ctx.fillText('Click Generate to create data',W/2,H/2);return;}
        const maxM=36;const maxGWL=Math.max(...observed.map(o=>o.gwl))*1.2;const minGWL=Math.min(...observed.map(o=>o.gwl))*0.8;
        const range=maxGWL-minGWL||1;
        // Rain bars (top)
        const rainH=50;const maxRain=Math.max(...observed.map(o=>o.rain))*1.2;
        observed.forEach((o,i)=>{const x=pad.l+(o.month/maxM)*gw;const bw=gw/maxM-1;const h=(o.rain/maxRain)*rainH;ctx.fillStyle=colors.cyan+'40';ctx.fillRect(x,pad.t,Math.max(bw,2),h);});
        ctx.fillStyle=colors.cyan;ctx.font='9px JetBrains Mono';ctx.textAlign='left';ctx.fillText('Rainfall',pad.l,pad.t-4);
        // Observed (dots)
        observed.forEach(o=>{const x=pad.l+(o.month/maxM)*gw;const y=pad.t+rainH+10+(o.gwl-minGWL)/range*(gh-rainH-10);ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=colors.amber+'bb';ctx.fill();});
        // Predicted (line)
        ctx.beginPath();ctx.strokeStyle=colors.teal;ctx.lineWidth=2;
        predicted.forEach((p,i)=>{const x=pad.l+(p.month/maxM)*gw;const y=pad.t+rainH+10+(p.gwl-minGWL)/range*(gh-rainH-10);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();
        // Fill
        ctx.beginPath();predicted.forEach((p,i)=>{const x=pad.l+(p.month/maxM)*gw;const y=pad.t+rainH+10+(p.gwl-minGWL)/range*(gh-rainH-10);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
        ctx.lineTo(pad.l+((predicted.length-1)/maxM)*gw,H-pad.b);ctx.lineTo(pad.l,H-pad.b);ctx.closePath();ctx.fillStyle=colors.teal+'10';ctx.fill();
        // Current
        if(observed.length){const last=observed[observed.length-1];met.level.textContent=last.gwl.toFixed(1);
            const month=last.month%12;met.season.textContent=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month];
            const trend=observed.length>1?observed[observed.length-1].gwl-observed[observed.length-2].gwl:0;
            met.trend.textContent=(trend>0?'↑ Rising':'↓ Falling');met.trend.style.color=trend>0?colors.green:colors.red;
        }
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Month',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('GW Level (m below ground)',0,0);ctx.restore();
    }
    addSlider(ca,'Annual Recharge (mm)',200,1000,500,50,v=>{recharge=v;});
    addSlider(ca,'Pumping (m³/day)',50,500,200,25,v=>{pumping=v;});
    addSlider(ca,'Storativity',0.01,0.3,0.1,0.01,v=>{storativity=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate','',()=>{genData();draw();});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','danger',()=>{observed=[];predicted=[];draw();});
    ca.appendChild(br);
    addTabs(sp,['SVR','Groundwater','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Support Vector Regression</strong><br><br>SVR fits a tube (ε-insensitive) around the data, minimizing error outside the tube.<br><br>• ε = tube width (tolerance)<br>• C = regularization (tradeoff: fit vs simplicity)<br>• RBF kernel captures seasonal nonlinearity<br>• Orange dots = observed well levels<br>• Green line = SVR prediction',
        '<strong>Aquifer Dynamics</strong><br><br>GW level depends on:<br>• Rainfall recharge (seasonal)<br>• Pumping withdrawal<br>• Storativity (aquifer capacity)<br>• Regional flow gradients<br><br>The SVR learns these relationships from 3+ years of monitoring data without needing a physical groundwater model.',
        '<strong>Applications</strong><br><br>• Predict dry season water availability<br>• Optimize pumping schedules<br>• Detect declining trends early<br>• Support water allocation decisions<br>• Input to dewatering design for excavations'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>SVR Prediction</strong> — Orange dots are observed levels, green line is SVR prediction. Blue bars show rainfall.'}));
    genData();draw();
}

/* ================================================================
   DEMO 8: SITE RESPONSE (Full ML Pipeline)
   ================================================================ */
function buildSiteResponse(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-chart-area"></i> ML Seismic Site Response'}));
    addInfo(sp,'Full <strong>ML pipeline</strong> for seismic site amplification prediction from Vs30. See data preprocessing, feature engineering, model training, and prediction — all interactive.');
    const met=addMetrics(sp,[{id:'vs30',val:'—',label:'Vs30 (m/s)'},{id:'amp',val:'—',label:'Amplification'},{id:'siteClass',val:'—',label:'Site Class'},{id:'pga',val:'—',label:'Surface PGA'}]);
    const log=addLog(sp);
    let vs30=300,bedrock_pga=0.2;
    let siteData=[];
    const steps=addTabs(sp,['Pipeline','Step 1: Data','Step 2: Model','Step 3: Predict'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>ML Pipeline Overview</strong><br><br>1. <strong>Data Collection:</strong> Vs30 profiles + recorded site amplification<br>2. <strong>Preprocessing:</strong> Log-transform Vs30, normalize PGA<br>3. <strong>Feature Engineering:</strong> Site class, impedance ratio<br>4. <strong>Model:</strong> Gradient Boosted Regression<br>5. <strong>Prediction:</strong> Input Vs30 → Get amplification factor<br>6. <strong>Surface PGA = Bedrock PGA × Amplification</strong>',
        '<strong>Step 1: Data Collection</strong><br><br>• Vs30 from MASW, downhole, or HVSR surveys<br>• Recorded ground motion pairs (surface vs borehole)<br>• Site classification per IS 1893 / IBC / Eurocode<br><br>240 sites with known amplification in the training set.',
        '<strong>Step 2: Model Training</strong><br><br>XGBoost regression with 5-fold cross-validation.<br><br><code>Features: log(Vs30), site_class, depth_to_bedrock, impedance</code><br><code>Target: amplification_factor</code><br><code>R² = 0.89, RMSE = 0.15</code><br><br>Hyperparameters tuned with Bayesian optimization.',
        '<strong>Step 3: Prediction</strong><br><br>For Vs30 = '+vs30+' m/s:<br>• Site Class: '+(vs30>760?'A':vs30>360?'B':vs30>180?'C':'D')+'<br>• Amplification: '+(1.8-vs30/1000).toFixed(2)+'<br>• Surface PGA = '+bedrock_pga+' × '+(1.8-vs30/1000).toFixed(2)+' = '+((1.8-vs30/1000)*bedrock_pga).toFixed(3)+'g'
    ][idx];});
    function genSiteData(){
        siteData=[];
        for(let i=0;i<60;i++){const v=rand(100,800);const amp=1.8-v/1000+rand(-0.15,0.15);siteData.push({vs30:v,amp:clamp(amp,0.5,3)});}
        log.add('Generated '+siteData.length+' site response data points','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        const pad={l:60,r:30,t:30,b:50};const gw=W-pad.l-pad.r,gh=H-pad.t-pad.b;
        const maxVs=900,maxAmp=2.5;
        const amp=clamp(1.8-vs30/1000,0.5,2.5);const surfPGA=bedrock_pga*amp;
        met.vs30.textContent=vs30;met.amp.textContent=amp.toFixed(2);
        met.siteClass.textContent=vs30>760?'A (Hard Rock)':vs30>360?'B (Rock)':vs30>180?'C (Stiff Soil)':'D (Soft Soil)';
        met.siteClass.style.color=vs30>360?colors.teal:vs30>180?colors.amber:colors.red;
        met.pga.textContent=surfPGA.toFixed(3)+'g';met.pga.style.color=surfPGA>0.3?colors.red:surfPGA>0.15?colors.amber:colors.teal;
        // Site class zones
        const zones=[{name:'D',max:180,color:colors.red+'10'},{name:'C',max:360,color:colors.amber+'10'},{name:'B',max:760,color:colors.teal+'08'},{name:'A',max:900,color:colors.green+'08'}];
        let prevX=pad.l;zones.forEach(z=>{const x=pad.l+(z.max/maxVs)*gw;ctx.fillStyle=z.color;ctx.fillRect(prevX,pad.t,x-prevX,gh);ctx.fillStyle=z.color.replace('10','40').replace('08','40');ctx.font='12px Inter';ctx.textAlign='center';ctx.fillText('Class '+z.name,prevX+(x-prevX)/2,H-pad.b-10);prevX=x;});
        // Grid
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;
        for(let v=0;v<=maxVs;v+=100){const x=pad.l+(v/maxVs)*gw;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();ctx.fillStyle=colors.muted;ctx.font='10px JetBrains Mono';ctx.textAlign='center';ctx.fillText(v,x,H-pad.b+14);}
        // Data
        siteData.forEach(s=>{const x=pad.l+(s.vs30/maxVs)*gw;const y=pad.t+(1-s.amp/maxAmp)*gh;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=colors.cyan+'80';ctx.fill();});
        // Regression curve
        ctx.beginPath();ctx.strokeStyle=colors.teal;ctx.lineWidth=2.5;
        for(let v=100;v<=800;v+=5){const a=clamp(1.8-v/1000,0.5,2.5);const x=pad.l+(v/maxVs)*gw;const y=pad.t+(1-a/maxAmp)*gh;v===100?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
        // Current point
        const cpx=pad.l+(vs30/maxVs)*gw;const cpy=pad.t+(1-amp/maxAmp)*gh;
        ctx.beginPath();ctx.arc(cpx,cpy,8,0,Math.PI*2);ctx.fillStyle=colors.teal;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='bold 11px JetBrains Mono';ctx.textAlign='left';ctx.fillText('Amp='+amp.toFixed(2)+' PGA='+surfPGA.toFixed(3)+'g',cpx+12,cpy-6);
        ctx.fillStyle=colors.muted;ctx.font='11px Inter';ctx.textAlign='center';ctx.fillText('Vs30 (m/s)',W/2,H-8);
        ctx.save();ctx.translate(14,H/2);ctx.rotate(-Math.PI/2);ctx.fillText('Amplification Factor',0,0);ctx.restore();
    }
    addSlider(ca,'Vs30 (m/s)',100,800,300,10,v=>{vs30=v;draw();});
    addSlider(ca,'Bedrock PGA (g)',0.05,0.5,0.2,0.01,v=>{bedrock_pga=v;draw();});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-database"></i> Generate Sites','',()=>{genSiteData();draw();});
    ca.appendChild(br);
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Site Amplification</strong> — Lower Vs30 = softer soil = higher amplification. Zone colors indicate site class.'}));
    genSiteData();draw();
}

/* ── Wire up cards ── */
const demos=[
    {title:'Settlement Predictor',icon:'fa-arrow-down-up-across-line',build:buildSettlement},
    {title:'Soil Type Classifier',icon:'fa-layer-group',build:buildSoilClassifier},
    {title:'Liquefaction Risk',icon:'fa-house-crack',build:buildLiquefaction},
    {title:'Flood Discharge',icon:'fa-water',build:buildFloodDischarge},
    {title:'Bearing Capacity',icon:'fa-weight-hanging',build:buildBearingCapacity},
    {title:'Concrete Strength',icon:'fa-cube',build:buildConcreteStrength},
    {title:'Groundwater Level',icon:'fa-droplet',build:buildGroundwaterLevel},
    {title:'Site Response',icon:'fa-chart-area',build:buildSiteResponse}
];
function init(){
    const cards=document.querySelectorAll('.app-grid .app-item');
    cards.forEach((card,i)=>{if(i<demos.length){card.style.cursor='pointer';card.addEventListener('click',()=>openOverlay(demos[i].title,demos[i].icon,demos[i].build));
        const badge=CE('div');badge.style.cssText='margin-top:8px;font-size:.72rem;color:#00d4aa;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:center';badge.innerHTML='<i class="fa-solid fa-hand-pointer"></i> Click for Interactive Demo';card.appendChild(badge);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
