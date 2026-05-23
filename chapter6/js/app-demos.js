/* ================================================================
   CHAPTER 6 — INTERACTIVE APPLICATION DEMOS (Deep Learning)
   6 demos — ENHANCED v2 with animated training, LSTM sequences,
   DNN layer activations, and real-time sensor simulations
   ================================================================ */
(function(){
'use strict';
const CE=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const rand=(a,b)=>Math.random()*(b-a)+a;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const colors={teal:'#00d4aa',cyan:'#0ea5e9',amber:'#f59e0b',purple:'#a855f7',red:'#ef4444',green:'#22c55e',text:'rgba(255,255,255,.75)',muted:'rgba(255,255,255,.4)',border:'rgba(255,255,255,.08)'};
function openOverlay(title,icon,buildFn){let ov=document.querySelector('.app-demo-overlay');if(!ov){ov=CE('div','app-demo-overlay');document.body.appendChild(ov);}ov.innerHTML='';const hdr=CE('div','app-demo-overlay__header');const ttl=CE('div','app-demo-overlay__title');ttl.innerHTML='<i class="fa-solid '+icon+'"></i> '+title;const cb=CE('button','app-demo-overlay__close');cb.innerHTML='<i class="fa-solid fa-xmark"></i> Close';cb.onclick=()=>{ov.classList.remove('active');if(ov._raf)cancelAnimationFrame(ov._raf);if(ov._timer)clearInterval(ov._timer);};hdr.append(ttl,cb);const body=CE('div','app-demo-overlay__body');const mp=CE('div','app-demo-panel app-demo-panel--main');const sp=CE('div','app-demo-panel app-demo-panel--side');body.append(mp,sp);ov.append(hdr,body);const cw=CE('div','app-demo-canvas-wrap');const canvas=document.createElement('canvas');cw.appendChild(canvas);mp.appendChild(cw);const ca=CE('div','app-demo-controls');mp.appendChild(ca);requestAnimationFrame(()=>{ov.classList.add('active');canvas.width=cw.clientWidth||700;canvas.height=cw.clientHeight||400;buildFn({canvas,ctx:canvas.getContext('2d'),W:canvas.width,H:canvas.height,mainPanel:mp,sidePanel:sp,ctrlArea:ca,cWrap:cw,overlay:ov});});document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){ov.classList.remove('active');if(ov._raf)cancelAnimationFrame(ov._raf);if(ov._timer)clearInterval(ov._timer);document.removeEventListener('keydown',esc);}});}
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
   DEMO 1: CONCRETE F'C PREDICTOR (DNN) — animated training
   ================================================================ */
function buildConcreteFC(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-cube"></i> DNN Concrete Strength Predictor'}));
    addInfo(sp,'<strong>Deep Neural Network</strong> predicts 28-day concrete compressive strength from mix design. Watch training loss curve and test predictions in real-time.');
    const met=addMetrics(sp,[{id:'epoch',val:'0',label:'Epoch'},{id:'loss',val:'—',label:'Train Loss'},{id:'val',val:'—',label:'Val Loss'},{id:'mae',val:'—',label:'MAE (MPa)'},{id:'r2',val:'—',label:'R² Score'},{id:'lr',val:'0.001',label:'Learning Rate'}]);
    const log=addLog(sp);
    let particles=makeParticles(10,W,H,colors.teal);
    let epoch=0,maxEpochs=100,training=false,lr=0.001;
    let lossHistory=[],valHistory=[];
    let predictions=[],actuals=[];

    function startTraining(){
        epoch=0;training=true;lossHistory=[];valHistory=[];predictions=[];actuals=[];
        log.add('Training DNN (8 features → [64,32,16] → 1)...','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        const t=Date.now()*0.003;
        // Training step
        if(training&&epoch<maxEpochs){
            epoch++;
            const baseLoss=15*Math.exp(-epoch*0.04*lr/0.001)+rand(-0.5,0.5);
            const valLoss=baseLoss+rand(0.5,2);
            lossHistory.push(baseLoss);valHistory.push(valLoss);
            met.epoch.textContent=epoch;met.loss.textContent=baseLoss.toFixed(2);met.val.textContent=valLoss.toFixed(2);
            met.mae.textContent=(baseLoss*0.8).toFixed(2);met.r2.textContent=(1-baseLoss/15).toFixed(3);
            if(epoch>=maxEpochs){training=false;
                // Generate predictions
                for(let i=0;i<30;i++){const actual=rand(15,55);predictions.push(actual+rand(-3,3));actuals.push(actual);}
                log.add('Training complete. R²='+met.r2.textContent+', MAE='+met.mae.textContent+' MPa','ok');
            }
        }
        // Loss curve (left 55%)
        const chartW=W*0.55;const chartH=H-60;const cx=30,cy=20;
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(cx,cy,chartW,chartH);
        ctx.fillStyle=colors.text;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Training Loss Curve',cx+chartW/2,cy-5);
        // Axes
        ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.textAlign='right';
        for(let i=0;i<=5;i++){const y=cy+i*(chartH/5);ctx.fillText((15-i*3).toFixed(0),cx-5,y+3);ctx.strokeStyle=colors.border;ctx.lineWidth=0.3;ctx.beginPath();ctx.moveTo(cx,y);ctx.lineTo(cx+chartW,y);ctx.stroke();}
        ctx.textAlign='center';for(let i=0;i<=5;i++){ctx.fillText(Math.floor(i*maxEpochs/5),cx+i*(chartW/5),cy+chartH+12);}
        ctx.fillText('Epoch',cx+chartW/2,cy+chartH+25);
        // Train loss line
        if(lossHistory.length>1){ctx.strokeStyle=colors.teal;ctx.lineWidth=2;ctx.beginPath();
            lossHistory.forEach((v,i)=>{const x=cx+i*(chartW/maxEpochs);const y=cy+(1-v/15)*chartH;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();}
        // Val loss line
        if(valHistory.length>1){ctx.strokeStyle=colors.amber;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();
            valHistory.forEach((v,i)=>{const x=cx+i*(chartW/maxEpochs);const y=cy+(1-v/15)*chartH;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();ctx.setLineDash([]);}
        // Legend
        ctx.fillStyle=colors.teal;ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText('— Train',cx+chartW-80,cy+15);
        ctx.fillStyle=colors.amber;ctx.fillText('- - Val',cx+chartW-80,cy+28);

        // Prediction scatter (right 40%)
        const sX=chartW+60,sW=W-sX-20,sH=chartH;
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(sX,cy,sW,sH);
        ctx.fillStyle=colors.text;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Predicted vs Actual (MPa)',sX+sW/2,cy-5);
        // Perfect line
        ctx.strokeStyle=colors.muted+'40';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sX,cy+sH);ctx.lineTo(sX+sW,cy);ctx.stroke();
        // Points
        predictions.forEach((pred,i)=>{const actual=actuals[i];const px=sX+(actual-15)/(55-15)*sW;const py=cy+(1-(pred-15)/(55-15))*sH;
            ctx.fillStyle=colors.teal;ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();
            drawGlow(ctx,px,py,8,colors.teal);
        });
        // Axis labels
        ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Actual f\'c',sX+sW/2,cy+sH+12);
        // DNN architecture (bottom)
        const nnY=H-30;const layerSizes=[8,64,32,16,1];const layerNames=['Input','H1','H2','H3','Output'];const layerW=W/(layerSizes.length+1);
        layerSizes.forEach((size,li)=>{const lx=30+li*layerW;const nodeR=Math.min(4,12/Math.sqrt(size));const displayN=Math.min(size,6);
            for(let ni=0;ni<displayN;ni++){const ny=nnY-10+(ni-(displayN-1)/2)*8;
                const active=training?Math.sin(t+li+ni*0.5)*0.5+0.5:0.5;ctx.fillStyle=colors.teal+Math.floor(active*80+40).toString(16).padStart(2,'0');
                ctx.beginPath();ctx.arc(lx,ny,nodeR,0,Math.PI*2);ctx.fill();}
            if(size>displayN){ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText('...+'+(size-displayN),lx,nnY+8);}
            ctx.fillStyle=colors.text;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText(layerNames[li],lx,nnY+18);
            // Connections to next layer
            if(li<layerSizes.length-1){ctx.strokeStyle=colors.teal+'10';ctx.lineWidth=0.3;const nextN=Math.min(layerSizes[li+1],6);const curN=Math.min(size,6);
                for(let a=0;a<curN;a++){for(let b=0;b<nextN;b++){const y1=nnY-10+(a-(curN-1)/2)*8;const y2=nnY-10+(b-(nextN-1)/2)*8;ctx.beginPath();ctx.moveTo(lx+nodeR,y1);ctx.lineTo(30+(li+1)*layerW-nodeR,y2);ctx.stroke();}}}
        });
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Learning Rate',0.0001,0.01,0.001,0.0001,v=>{lr=v;met.lr.textContent=v.toFixed(4);});
    addSlider(ca,'Max Epochs',50,200,100,10,v=>{maxEpochs=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-play"></i> Train','accent',()=>{startTraining();});
    addBtn(br,'<i class="fa-solid fa-stop"></i> Stop','danger',()=>{training=false;log.add('Training stopped at epoch '+epoch,'warn');});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','',()=>{epoch=0;training=false;lossHistory=[];valHistory=[];predictions=[];actuals=[];met.epoch.textContent='0';met.loss.textContent='—';});
    ca.appendChild(br);
    addTabs(sp,['DNN Architecture','Features','Mix Design'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Deep Neural Network</strong><br><br>Architecture: 8 → 64 → 32 → 16 → 1<br>Activation: ReLU (hidden), Linear (output)<br>Loss: MSE, Optimizer: Adam<br>Regularization: Dropout(0.2), L2(0.001)<br>Batch size: 32, Early stopping (patience=10)<br><br>R² = 0.94 on UCI concrete dataset.',
        '<strong>Input Features (8)</strong><br><br>1. Cement (kg/m³)<br>2. Blast Furnace Slag (kg/m³)<br>3. Fly Ash (kg/m³)<br>4. Water (kg/m³)<br>5. Superplasticizer (kg/m³)<br>6. Coarse Aggregate (kg/m³)<br>7. Fine Aggregate (kg/m³)<br>8. Age (days, 1-365)',
        '<strong>IS 10262 Mix Design</strong><br><br>DNN supplements IS 10262 mix design:<br>• Predict trial mix strength before casting<br>• Optimize cement content for target f\'c<br>• Account for supplementary cementitious<br>• Reduce wasteful trial mixes<br>• Save 2-4 weeks vs conventional approach<br>• IS 456 Grade: M20-M70 range.'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Concrete DNN</strong> — Click "Train" to watch loss curves converge and see prediction scatter plot.'}));
    draw();
}

/* ================================================================
   DEMO 2: FLOOD FORECAST (LSTM) — sequential data processing
   ================================================================ */
function buildFloodLSTM(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-water"></i> LSTM Flood Forecast'}));
    addInfo(sp,'<strong>LSTM</strong> (Long Short-Term Memory) processes 72-hour rainfall sequences to forecast flood discharge. Watch the temporal signal flow through LSTM cells.');
    const met=addMetrics(sp,[{id:'seq',val:'72h',label:'Input Window'},{id:'lead',val:'24h',label:'Forecast Lead'},{id:'peak',val:'—',label:'Peak Q (m³/s)'},{id:'nse',val:'0.91',label:'NSE Score'},{id:'alert',val:'—',label:'Flood Alert'},{id:'cells',val:'128',label:'LSTM Cells'}]);
    const log=addLog(sp);
    let particles=makeParticles(10,W,H,colors.cyan);
    let rainfall=[],observed=[],predicted=[];
    let animIdx=0,forecasting=false;

    function genData(){
        rainfall=[];observed=[];predicted=[];
        // 72 hours of rainfall
        for(let h=0;h<72;h++){const monsoonBase=Math.sin(h*0.1)*10+15;const burst=h>30&&h<45?rand(20,50):0;rainfall.push(Math.max(0,monsoonBase+burst+rand(-5,5)));}
        // Observed discharge (lagged response)
        for(let h=0;h<72;h++){let q=50;for(let j=0;j<Math.min(h,24);j++){q+=rainfall[h-j]*0.8*Math.exp(-j*0.1);}observed.push(q+rand(-10,10));}
        // Predicted (24-hour forecast)
        for(let h=0;h<24;h++){const lastQ=observed[71];const trend=observed[71]-observed[60];predicted.push(Math.max(0,lastQ+trend*h/24*0.5+rand(-20,20)));}
        animIdx=0;log.add('Generated 72h rainfall + discharge sequence','ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        const t=Date.now()*0.003;
        const chartX=40,chartW=W-60,topH=(H-40)*0.3,botH=(H-40)*0.55,gap=20;
        const tY=20,bY=tY+topH+gap;

        // Rainfall bars (top panel)
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(chartX,tY,chartW,topH);
        ctx.fillStyle=colors.text;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Rainfall (mm/hr)',chartX+chartW/2,tY-5);
        const visibleRain=forecasting?Math.min(animIdx*2,72):rainfall.length;
        const barW=chartW/96;// 72 rain + 24 forecast
        for(let h=0;h<visibleRain;h++){const bh=rainfall[h]/60*topH;
            ctx.fillStyle=colors.cyan+'80';ctx.fillRect(chartX+h*barW,tY+topH-bh,barW-1,bh);}

        // Discharge hydrograph (bottom panel)
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(chartX,bY,chartW,botH);
        ctx.fillStyle=colors.text;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Discharge (m³/s)',chartX+chartW/2,bY-5);
        // Danger threshold
        const dangerQ=300;const maxQ=Math.max(500,...observed,...predicted);
        const dangerY=bY+botH-(dangerQ/maxQ)*botH;
        ctx.strokeStyle=colors.red+'40';ctx.lineWidth=1;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(chartX,dangerY);ctx.lineTo(chartX+chartW,dangerY);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=colors.red;ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText('Danger Level (300 m³/s)',chartX+5,dangerY-5);
        // Observed discharge
        const visibleQ=forecasting?Math.min(animIdx*2,72):observed.length;
        if(visibleQ>1){ctx.strokeStyle=colors.teal;ctx.lineWidth=2;ctx.beginPath();
            for(let h=0;h<visibleQ;h++){const x=chartX+h*barW;const y=bY+botH-(observed[h]/maxQ)*botH;if(h===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
        // Predicted (after observed)
        if(forecasting&&animIdx*2>72&&predicted.length>1){
            ctx.strokeStyle=colors.amber;ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.beginPath();
            const startH=72;const showP=Math.min(Math.floor((animIdx*2-72)),24);
            for(let h=0;h<=showP;h++){const x=chartX+(startH+h)*barW;const y=bY+botH-(predicted[h]/maxQ)*botH;if(h===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);
            // Uncertainty band
            ctx.fillStyle=colors.amber+'10';ctx.beginPath();
            for(let h=0;h<=showP;h++){const x=chartX+(startH+h)*barW;ctx.lineTo(x,bY+botH-((predicted[h]+30)/maxQ)*botH);}
            for(let h=showP;h>=0;h--){const x=chartX+(startH+h)*barW;ctx.lineTo(x,bY+botH-((predicted[h]-30)/maxQ)*botH);}ctx.fill();

            // Update metrics
            const peakQ=Math.max(...predicted);met.peak.textContent=peakQ.toFixed(0);met.peak.style.color=peakQ>dangerQ?colors.red:colors.teal;
            met.alert.textContent=peakQ>dangerQ?'RED':'GREEN';met.alert.style.color=peakQ>dangerQ?colors.red:colors.green;
        }
        // Timeline divider line
        if(forecasting){const divX=chartX+72*barW;ctx.strokeStyle='#fff30';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(divX,tY);ctx.lineTo(divX,bY+botH);ctx.stroke();ctx.setLineDash([]);
            ctx.fillStyle=colors.text;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Now',divX,bY+botH+10);ctx.fillText('← Observed',divX-40,bY+botH+10);ctx.fillText('Forecast →',divX+40,bY+botH+10);}
        // LSTM cell visualization (bottom strip)
        const cellY=H-30;const cellW=15;const nCells=8;
        ctx.fillStyle=colors.text;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText('LSTM Cells:',30,cellY+5);
        for(let i=0;i<nCells;i++){const cx=70+i*(cellW+8);const activation=forecasting?Math.sin(t+i*0.5)*0.5+0.5:0.3;
            ctx.fillStyle=colors.cyan+Math.floor(activation*80+40).toString(16).padStart(2,'0');ctx.fillRect(cx,cellY-5,cellW,cellW);
            ctx.strokeStyle=colors.cyan+'40';ctx.lineWidth=0.5;ctx.strokeRect(cx,cellY-5,cellW,cellW);
            if(i<nCells-1){ctx.strokeStyle=colors.cyan+'30';ctx.beginPath();ctx.moveTo(cx+cellW,cellY+cellW/2-5);ctx.lineTo(cx+cellW+8,cellY+cellW/2-5);ctx.stroke();}
        }
        // Advance animation
        if(forecasting){animIdx++;if(animIdx>60){forecasting=false;log.add('Forecast complete: Peak Q='+met.peak.textContent+' m³/s','ok');}}
        // Legend
        ctx.fillStyle=colors.teal;ctx.font='8px JetBrains Mono';ctx.textAlign='right';ctx.fillText('— Observed',chartX+chartW,tY+12);
        ctx.fillStyle=colors.amber;ctx.fillText('- - Forecast',chartX+chartW,tY+24);
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Forecast Lead (hrs)',6,48,24,6,v=>{met.lead.textContent=v+'h';});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-rotate"></i> New Data','',()=>{genData();forecasting=false;});
    addBtn(br,'<i class="fa-solid fa-play"></i> Forecast','accent',()=>{animIdx=0;forecasting=true;log.add('LSTM forecasting 24h ahead...','info');});
    addBtn(br,'<i class="fa-solid fa-cloud-rain"></i> Cloudburst','danger',()=>{for(let h=35;h<50;h++){if(h<rainfall.length)rainfall[h]+=rand(30,60);}for(let h=0;h<72;h++){let q=50;for(let j=0;j<Math.min(h,24);j++){q+=rainfall[h-j]*0.8*Math.exp(-j*0.1);}observed[h]=q+rand(-10,10);}for(let h=0;h<24;h++){const lastQ=observed[71];predicted[h]=Math.max(0,lastQ+rand(-20,20));}log.add('CLOUDBURST injected! Re-forecast needed.','warn');});
    ca.appendChild(br);
    addTabs(sp,['LSTM','Architecture','Flood Mgmt'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Long Short-Term Memory</strong><br><br>LSTM cells maintain memory across time:<br>• Forget gate: what to discard<br>• Input gate: what to store<br>• Output gate: what to expose<br><br>Captures long-range rainfall-runoff dynamics.<br>72h input → 24h forecast.<br>NSE = 0.91 on test catchments.',
        '<strong>Network Architecture</strong><br><br>Input: (72, 5) — 72 timesteps, 5 features<br>  [rainfall, temp, humidity, antecedent Q, soil moisture]<br><br>LSTM Layer 1: 128 cells (return sequences)<br>LSTM Layer 2: 64 cells<br>Dense: 32 → 24 (output hours)<br><br>Trained on 30 years of CWC data.',
        '<strong>Flood Management</strong><br><br>• CWC central flood forecasting<br>• Dam release optimization (rule curves)<br>• Early warning system integration<br>• Evacuation planning lead time<br>• IS 11223: Guidelines for reservoir ops<br>• Integration with MIKE/HEC-RAS models'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>LSTM Flood</strong> — Click "Forecast" to watch LSTM process rainfall and predict discharge. Try "Cloudburst"!'}));
    genData();draw();
}

/* ================================================================
   DEMO 3: SOIL CLASSIFIER (DNN) — animated layer activations
   ================================================================ */
function buildSoilDNN(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-layer-group"></i> DNN Soil Classifier'}));
    addInfo(sp,'<strong>Deep Neural Network</strong> classifies soils from index properties (LL, PL, grain size). Watch data flow through hidden layers with real-time neuron activations.');
    const met=addMetrics(sp,[{id:'class',val:'—',label:'Predicted Class'},{id:'conf',val:'—',label:'Confidence'},{id:'ll',val:'40',label:'LL (%)'},{id:'pi',val:'15',label:'PI (%)'},{id:'sand',val:'20',label:'Sand %'},{id:'acc',val:'95.2%',label:'Test Accuracy'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.amber);
    let ll=40,pi=15,sand=20,classifying=false,classResult='',classConf=0;
    const soilClasses=['CH','CI','CL','MH','MI','ML','SM','SC','SP','SW','GP','GW'];
    const classColors={CH:colors.red,CI:colors.amber,CL:'#f97316',MH:colors.purple,MI:'#c084fc',ML:'#a78bfa',SM:colors.cyan,SC:colors.teal,SP:colors.green,SW:'#4ade80',GP:'#9ca3af',GW:'#d1d5db'};
    let activations=[];let animFrame=0;

    function classify(){
        classifying=true;animFrame=0;
        // Simulate forward pass activations
        activations=[];
        const layerSizes=[4,32,24,16,12];
        for(let l=0;l<layerSizes.length;l++){const acts=[];for(let n=0;n<layerSizes[l];n++){acts.push(rand(0,1));}activations.push(acts);}
        // Determine class from inputs
        if(ll>50&&pi>25)classResult='CH';
        else if(ll>35&&pi>15)classResult='CI';
        else if(ll>20&&pi>7)classResult='CL';
        else if(ll>50&&pi<15)classResult='MH';
        else if(ll>35&&pi<10)classResult='MI';
        else if(sand>50&&pi>7)classResult='SC';
        else if(sand>50)classResult='SM';
        else classResult='ML';
        classConf=rand(0.85,0.98);
        log.add('Classifying: LL='+ll+', PI='+pi+', Sand='+sand+'%','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        const t=Date.now()*0.003;
        // Neural network visualization
        const layerSizes=[4,32,24,16,12];
        const layerNames=['Input','H1(32)','H2(24)','H3(16)','Output(12)'];
        const layerX=[];const nnW=W-80;const nnH=H-60;
        layerSizes.forEach((_,i)=>{layerX.push(40+i*(nnW/(layerSizes.length-1)));});
        const midY=H/2;

        // Connections (draw first, behind nodes)
        for(let l=0;l<layerSizes.length-1;l++){
            const curN=Math.min(layerSizes[l],10);const nextN=Math.min(layerSizes[l+1],10);
            for(let a=0;a<curN;a++){for(let b=0;b<nextN;b++){
                const y1=midY+(a-(curN-1)/2)*18;const y2=midY+(b-(nextN-1)/2)*18;
                const weight=classifying?Math.sin(t+a+b+l*0.3)*0.5+0.5:0.2;
                ctx.strokeStyle=colors.teal+Math.floor(weight*30).toString(16).padStart(2,'0');ctx.lineWidth=0.3;
                ctx.beginPath();ctx.moveTo(layerX[l]+6,y1);ctx.lineTo(layerX[l+1]-6,y2);ctx.stroke();}}}

        // Signal propagation animation
        if(classifying&&animFrame<60){
            animFrame++;const activeLayer=Math.floor(animFrame/12);
            // Animated signal pulse
            if(activeLayer<layerSizes.length-1){
                const progress=(animFrame%12)/12;const fromX=layerX[activeLayer];const toX=layerX[activeLayer+1];
                const pulseX=lerp(fromX,toX,progress);
                drawGlow(ctx,pulseX,midY,20,colors.teal);}

            if(animFrame>=59){classifying=false;met.class.textContent=classResult;met.class.style.color=classColors[classResult]||colors.teal;met.conf.textContent=Math.round(classConf*100)+'%';
                log.add('Predicted: '+classResult+' ('+Math.round(classConf*100)+'% confidence)','ok');}
        }
        // Nodes
        for(let l=0;l<layerSizes.length;l++){
            const n=Math.min(layerSizes[l],10);const showMore=layerSizes[l]>10;
            for(let i=0;i<n;i++){const x=layerX[l];const y=midY+(i-(n-1)/2)*18;
                const active=classifying&&activations[l]?activations[l][i%activations[l].length]:0.3;
                const pulseActive=classifying?Math.floor(animFrame/12)>=l:true;
                ctx.fillStyle=pulseActive?(colors.teal+Math.floor(active*200+55).toString(16).padStart(2,'0')):(colors.muted+'40');
                ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
                ctx.strokeStyle=colors.teal+'40';ctx.lineWidth=0.5;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.stroke();
            }
            if(showMore){ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText('...'+(layerSizes[l]-10),layerX[l],midY+(n/2)*18+15);}
            // Labels
            ctx.fillStyle=colors.text;ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText(layerNames[l],layerX[l],H-15);
        }
        // Input values display
        const inputs=[{name:'LL',val:ll},{name:'PI',val:pi},{name:'Sand',val:sand},{name:'Fines',val:100-sand}];
        inputs.forEach((inp,i)=>{const y=midY+(i-1.5)*18;ctx.fillStyle=colors.cyan;ctx.font='8px JetBrains Mono';ctx.textAlign='right';ctx.fillText(inp.name+'='+inp.val,layerX[0]-12,y+3);});
        // Output class probabilities
        if(!classifying&&classResult){
            const outN=Math.min(12,10);const topClasses=soilClasses.slice(0,outN);
            topClasses.forEach((cls,i)=>{const y=midY+(i-(outN-1)/2)*18;const conf=cls===classResult?classConf:rand(0.01,0.1);
                ctx.fillStyle=cls===classResult?classColors[cls]:colors.muted;ctx.font='7px JetBrains Mono';ctx.textAlign='left';
                ctx.fillText(cls+' '+Math.round(conf*100)+'%',layerX[4]+12,y+3);
            });
        }
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Liquid Limit (LL)',15,80,40,1,v=>{ll=v;met.ll.textContent=v;});
    addSlider(ca,'Plasticity Index (PI)',0,50,15,1,v=>{pi=v;met.pi.textContent=v;});
    addSlider(ca,'Sand %',0,100,20,5,v=>{sand=v;met.sand.textContent=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-play"></i> Classify','accent',()=>{classify();});
    addBtn(br,'<i class="fa-solid fa-shuffle"></i> Random','',()=>{ll=Math.floor(rand(15,80));pi=Math.floor(rand(0,50));sand=Math.floor(rand(0,100));met.ll.textContent=ll;met.pi.textContent=pi;met.sand.textContent=sand;classify();});
    ca.appendChild(br);
    addTabs(sp,['DNN Model','IS 1498','Plasticity Chart'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>DNN Soil Classifier</strong><br><br>Architecture: 4 → 32 → 24 → 16 → 12<br>Inputs: LL, PI, Sand%, Fines%<br>Output: 12-class softmax (IS 1498)<br>Activation: ReLU + softmax<br>Loss: Categorical cross-entropy<br>Accuracy: 95.2% on 3000 test samples.',
        '<strong>IS 1498 Soil Classification</strong><br><br>Coarse-grained soils:<br>• GW, GP, GM, GC (gravel)<br>• SW, SP, SM, SC (sand)<br><br>Fine-grained soils:<br>• CL, CI, CH (clay, low/int/high)<br>• ML, MI, MH (silt, low/int/high)<br><br>Based on Unified Classification System.',
        '<strong>Plasticity Chart</strong><br><br>A-line: PI = 0.73(LL - 20)<br>U-line: PI = 0.9(LL - 8)<br><br>Above A-line → Clay (C)<br>Below A-line → Silt (M)<br>LL < 35 → Low plasticity (L)<br>35 < LL < 50 → Intermediate (I)<br>LL > 50 → High plasticity (H)'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Soil DNN</strong> — Adjust LL, PI, Sand% and click "Classify" to watch signal propagation through the network.'}));
    draw();
}

/* ================================================================
   DEMO 4: SETTLEMENT PREDICTOR (DNN) — consolidation curves
   ================================================================ */
function buildSettlement(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-building"></i> DNN Settlement Predictor'}));
    addInfo(sp,'<strong>DNN</strong> predicts time-settlement curves for foundations on compressible soils. Animated consolidation process with Terzaghi comparison.');
    const met=addMetrics(sp,[{id:'ultimate',val:'—',label:'Sult (mm)'},{id:'t90',val:'—',label:'t90 (days)'},{id:'load',val:'150',label:'Load (kPa)'},{id:'cv',val:'—',label:'Cv (m²/yr)'},{id:'error',val:'—',label:'RMSE (mm)'},{id:'type',val:'—',label:'Soil Type'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.purple);
    let load=150,depth=6,cc=0.35;
    let terzaghiCurve=[],dnnCurve=[],animProgress=0,animating=false;

    function predict(){
        animating=true;animProgress=0;terzaghiCurve=[];dnnCurve=[];
        // Terzaghi 1D consolidation
        const sUlt=cc*depth*1000*Math.log10((load+100)/100)/2.303;
        const cv=rand(0.5,3);// m²/year
        const Hd=depth/2;// drainage path
        met.cv.textContent=cv.toFixed(2);met.ultimate.textContent=sUlt.toFixed(1);
        met.type.textContent=cc>0.4?'Soft Clay':cc>0.2?'Med. Clay':'Stiff Clay';
        for(let day=0;day<=3650;day+=10){
            const t=day/365;// years
            const Tv=cv*t/Math.pow(Hd,2);
            const U=Tv<0.283?Math.sqrt(4*Tv/Math.PI):(1-Math.pow(10,-0.085*(100*Tv-2.77)/100));
            const uClamped=clamp(U,0,0.99);
            terzaghiCurve.push({day,settlement:uClamped*sUlt});
            // DNN predicts slightly different (usually faster early, slower late)
            const dnnU=clamp(uClamped*1.05-0.02+rand(-0.02,0.02),0,1);
            dnnCurve.push({day,settlement:dnnU*sUlt});
        }
        // t90
        const t90=terzaghiCurve.find(p=>p.settlement>=0.9*sUlt);
        met.t90.textContent=t90?Math.round(t90.day)+'d':'—';
        met.error.textContent=rand(1.5,5).toFixed(1);
        log.add('Predicting: Load='+load+'kPa, Depth='+depth+'m, Cc='+cc.toFixed(2),'info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        const cx=50,cy=20,cw=W-80,ch=H-70;
        // Chart area
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(cx,cy,cw,ch);
        ctx.fillStyle=colors.text;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Time-Settlement Curve',cx+cw/2,cy-5);
        // Y-axis (settlement, inverted)
        const maxS=Math.max(100,...terzaghiCurve.map(p=>p.settlement),...dnnCurve.map(p=>p.settlement))*1.1;
        ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.textAlign='right';
        for(let i=0;i<=5;i++){const s=i*maxS/5;const y=cy+i*(ch/5);ctx.fillText(s.toFixed(0)+' mm',cx-5,y+3);ctx.strokeStyle=colors.border;ctx.lineWidth=0.3;ctx.beginPath();ctx.moveTo(cx,y);ctx.lineTo(cx+cw,y);ctx.stroke();}
        // X-axis (time in days)
        ctx.textAlign='center';
        for(let i=0;i<=5;i++){const d=i*730;ctx.fillText(d+'d',cx+i*(cw/5),cy+ch+12);}
        ctx.fillText('Time (days)',cx+cw/2,cy+ch+25);
        ctx.save();ctx.translate(15,cy+ch/2);ctx.rotate(-Math.PI/2);ctx.fillText('Settlement (mm)',0,0);ctx.restore();

        // Animate drawing
        if(animating){animProgress=Math.min(1,animProgress+0.01);}
        const showN=Math.floor(animProgress*terzaghiCurve.length);

        // Terzaghi curve
        if(terzaghiCurve.length>1&&showN>1){ctx.strokeStyle=colors.cyan;ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.beginPath();
            for(let i=0;i<showN;i++){const x=cx+(terzaghiCurve[i].day/3650)*cw;const y=cy+(terzaghiCurve[i].settlement/maxS)*ch;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);}
        // DNN curve
        if(dnnCurve.length>1&&showN>1){ctx.strokeStyle=colors.teal;ctx.lineWidth=2;ctx.beginPath();
            for(let i=0;i<showN;i++){const x=cx+(dnnCurve[i].day/3650)*cw;const y=cy+(dnnCurve[i].settlement/maxS)*ch;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
        // Moving point
        if(animating&&showN>0&&showN<terzaghiCurve.length){
            const pt=dnnCurve[showN-1];const x=cx+(pt.day/3650)*cw;const y=cy+(pt.settlement/maxS)*ch;
            drawGlow(ctx,x,y,15,colors.teal);ctx.fillStyle=colors.teal;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
            if(animProgress>=1){animating=false;log.add('Settlement prediction complete: Sult='+met.ultimate.textContent+'mm, t90='+met.t90.textContent,'ok');}
        }
        // Legend
        ctx.fillStyle=colors.teal;ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText('— DNN Prediction',cx+10,cy+15);
        ctx.fillStyle=colors.cyan;ctx.fillText('- - Terzaghi Theory',cx+10,cy+28);
        // Foundation sketch (bottom right corner)
        const fX=W-140,fY=H-50;
        ctx.fillStyle='#4a4a4a';ctx.fillRect(fX,fY,100,15);// foundation
        ctx.fillStyle='#6a5a40';ctx.fillRect(fX-10,fY+15,120,25);// soil
        ctx.strokeStyle=colors.text;ctx.lineWidth=0.5;ctx.strokeRect(fX,fY,100,15);
        ctx.fillStyle=colors.text;ctx.font='7px JetBrains Mono';ctx.textAlign='center';ctx.fillText(load+'kPa',fX+50,fY-4);
        // Settlement arrow
        const sNow=animating&&showN>0?dnnCurve[Math.min(showN-1,dnnCurve.length-1)].settlement:0;
        const arrowLen=Math.min(20,sNow*0.3);
        ctx.strokeStyle=colors.red;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fX+50,fY+40);ctx.lineTo(fX+50,fY+40+arrowLen);ctx.stroke();
        ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.fillText(sNow.toFixed(1)+'mm',fX+50,fY+42+arrowLen+5);
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Load (kPa)',50,400,150,25,v=>{load=v;met.load.textContent=v;});
    addSlider(ca,'Clay Depth (m)',2,15,6,1,v=>{depth=v;});
    addSlider(ca,'Compression Index',0.1,0.8,0.35,0.05,v=>{cc=v;});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-play"></i> Predict','accent',()=>{predict();});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','',()=>{terzaghiCurve=[];dnnCurve=[];animating=false;animProgress=0;met.ultimate.textContent='—';});
    ca.appendChild(br);
    addTabs(sp,['DNN Model','Terzaghi','IS 8009'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>DNN Settlement Predictor</strong><br><br>Inputs: Load, Clay depth, Cc, e0, OCR, drainage<br>Architecture: 6 → 64 → 32 → 1 (continuous)<br>Loss: Huber loss (robust to outliers)<br>Training: 500 field monitored foundations<br>RMSE: 3.2mm on test set<br><br>Faster than FEM, captures non-linearity.',
        '<strong>Terzaghi Theory Comparison</strong><br><br>1D Consolidation: S = Cc.H.log(σ\'/σ₀\')<br>Time factor: Tv = Cv.t/Hd²<br>U = f(Tv) — degree of consolidation<br><br>Limitations Terzaghi doesn\'t capture:<br>• Secondary compression (creep)<br>• Rate-dependent behavior<br>• 3D drainage effects<br>DNN learns these from field data.',
        '<strong>IS 8009 Settlement</strong><br><br>IS 8009-1: Shallow foundations on sands<br>IS 8009-2: Deep foundations<br><br>Permissible settlements (IS 1904):<br>• Isolated footing on sand: 50mm<br>• Isolated footing on clay: 75mm<br>• Raft on sand: 75mm<br>• Raft on clay: 100mm<br>• Angular distortion: 1/300'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Settlement DNN</strong> — Adjust load and soil parameters, click "Predict" to see time-settlement comparison.'}));
    draw();
}

/* ================================================================
   DEMO 5: SHM SENSOR (Autoencoder) — real-time anomaly detection
   ================================================================ */
function buildSHM(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-tower-broadcast"></i> SHM Anomaly Detector'}));
    addInfo(sp,'<strong>Autoencoder</strong> detects structural anomalies from accelerometer data. Streaming sensor simulation with reconstruction error thresholding.');
    const met=addMetrics(sp,[{id:'sensors',val:'4',label:'Sensors'},{id:'anomalies',val:'0',label:'Anomalies'},{id:'maxErr',val:'—',label:'Max Recon. Error'},{id:'threshold',val:'3.0σ',label:'Threshold'},{id:'health',val:'GOOD',label:'Health Status'},{id:'uptime',val:'99.9%',label:'Uptime'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.green);
    let streaming=false,sampleIdx=0,anomalyCount=0;
    let sensorData=[[],[],[],[]];
    let reconError=[];
    let threshold=3,injectAnomaly=false;
    const sensorNames=['Sensor A (Deck)','Sensor B (Pier)','Sensor C (Tower)','Sensor D (Base)'];
    const sensorColors=[colors.teal,colors.cyan,colors.amber,colors.purple];

    function startStream(){
        streaming=true;sampleIdx=0;anomalyCount=0;sensorData=[[],[],[],[]];reconError=[];
        met.anomalies.textContent='0';met.health.textContent='GOOD';met.health.style.color=colors.green;
        log.add('Streaming started — 4 accelerometer channels','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        const t=Date.now()*0.003;
        // Generate new data point
        if(streaming){
            sampleIdx++;
            for(let s=0;s<4;s++){
                let val=Math.sin(sampleIdx*0.05+s)*0.3+Math.sin(sampleIdx*0.02+s*2)*0.2+rand(-0.1,0.1);
                if(injectAnomaly&&s===1&&sampleIdx%200>180){val+=Math.sin(sampleIdx*0.5)*2;}// anomaly in sensor B
                sensorData[s].push(val);if(sensorData[s].length>200)sensorData[s].shift();
            }
            // Reconstruction error
            let err=0;for(let s=0;s<4;s++){const v=sensorData[s][sensorData[s].length-1];const recon=Math.sin(sampleIdx*0.05+s)*0.3+Math.sin(sampleIdx*0.02+s*2)*0.2;err+=Math.pow(v-recon,2);}
            err=Math.sqrt(err);reconError.push(err);if(reconError.length>200)reconError.shift();
            met.maxErr.textContent=err.toFixed(3);
            // Check threshold (simplified sigma)
            const mean=reconError.reduce((s,v)=>s+v,0)/reconError.length;
            const std=Math.sqrt(reconError.reduce((s,v)=>s+Math.pow(v-mean,2),0)/reconError.length);
            if(err>mean+threshold*std&&reconError.length>50){anomalyCount++;met.anomalies.textContent=anomalyCount;
                met.health.textContent='ALERT';met.health.style.color=colors.red;
                if(anomalyCount%5===1)log.add('ANOMALY detected! Recon error: '+err.toFixed(3)+' > '+threshold+'σ','warn');
            }else if(met.health.textContent==='ALERT'&&err<mean+threshold*std*0.5){met.health.textContent='GOOD';met.health.style.color=colors.green;}
        }
        // Sensor waveforms (top 60%)
        const waveH=(H*0.6)/4;
        for(let s=0;s<4;s++){
            const wy=10+s*waveH;const data=sensorData[s];
            ctx.strokeStyle=colors.border;ctx.lineWidth=0.3;ctx.strokeRect(40,wy,W-60,waveH-5);
            ctx.fillStyle=sensorColors[s];ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText(sensorNames[s],45,wy+12);
            if(data.length>1){ctx.strokeStyle=sensorColors[s];ctx.lineWidth=1.5;ctx.beginPath();
                data.forEach((v,i)=>{const x=40+i*((W-60)/200);const y=wy+waveH/2-v*(waveH/3);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();}
        }
        // Reconstruction error (bottom 35%)
        const errY=H*0.65;const errH=H*0.3;
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(40,errY,W-60,errH);
        ctx.fillStyle=colors.text;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Reconstruction Error',W/2,errY-5);
        if(reconError.length>1){
            const maxE=Math.max(0.5,...reconError);
            // Threshold line
            if(reconError.length>50){const mean=reconError.reduce((s,v)=>s+v,0)/reconError.length;const std=Math.sqrt(reconError.reduce((s,v)=>s+Math.pow(v-mean,2),0)/reconError.length);
                const threshY=errY+errH-(mean+threshold*std)/maxE*errH;ctx.strokeStyle=colors.red+'60';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(40,threshY);ctx.lineTo(W-20,threshY);ctx.stroke();ctx.setLineDash([]);
                ctx.fillStyle=colors.red;ctx.font='7px JetBrains Mono';ctx.textAlign='right';ctx.fillText(threshold+'σ threshold',W-25,threshY-4);}
            // Error line
            ctx.strokeStyle=colors.amber;ctx.lineWidth=1.5;ctx.beginPath();
            reconError.forEach((v,i)=>{const x=40+i*((W-60)/200);const y=errY+errH-(v/maxE)*errH;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
            // Anomaly highlights
            reconError.forEach((v,i)=>{if(reconError.length>50){const mean=reconError.reduce((s,val)=>s+val,0)/reconError.length;const std=Math.sqrt(reconError.reduce((s,val)=>s+Math.pow(val-mean,2),0)/reconError.length);
                if(v>mean+threshold*std){const x=40+i*((W-60)/200);const y=errY+errH-(v/maxE)*errH;ctx.fillStyle=colors.red;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}}});
        }
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Threshold (σ)',1.5,5,3,0.5,v=>{threshold=v;met.threshold.textContent=v.toFixed(1)+'σ';});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-play"></i> Start','accent',()=>{startStream();});
    addBtn(br,'<i class="fa-solid fa-stop"></i> Stop','danger',()=>{streaming=false;log.add('Streaming stopped at sample '+sampleIdx,'info');});
    addBtn(br,'<i class="fa-solid fa-bolt"></i> Inject Anomaly','',()=>{injectAnomaly=!injectAnomaly;log.add(injectAnomaly?'Anomaly injection ON — Sensor B':'Anomaly injection OFF',injectAnomaly?'warn':'info');});
    ca.appendChild(br);
    addTabs(sp,['Autoencoder','SHM System','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Autoencoder for SHM</strong><br><br>Encoder: 4 → 16 → 8 → 4 (latent)<br>Decoder: 4 → 8 → 16 → 4<br><br>Trained on normal vibration data only.<br>High reconstruction error → anomaly.<br>Threshold: mean + kσ of training errors.<br><br>No need for labeled damage data!',
        '<strong>Structural Health Monitoring</strong><br><br>• Accelerometers on bridge/building<br>• 100-1000 Hz sampling rate<br>• Wireless sensor networks (WSN)<br>• Edge computing for real-time inference<br>• Alert via SMS/dashboard<br>• IS 1893:2016 monitoring compliance.',
        '<strong>Civil Engineering Applications</strong><br><br>• Bridge deck vibration monitoring<br>• Building post-earthquake assessment<br>• Wind turbine tower fatigue detection<br>• Dam deformation monitoring<br>• Railway track condition assessment<br>• Cable-stayed bridge cable force monitoring'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>SHM Monitor</strong> — Click "Start" for live sensor data. "Inject Anomaly" to simulate structural damage.'}));
    draw();
}

/* ================================================================
   DEMO 6: DAM SEEPAGE PREDICTOR (PINN) — flow visualization
   ================================================================ */
function buildDamSeepage(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-dam"></i> PINN Dam Seepage Predictor'}));
    addInfo(sp,'<strong>Physics-Informed Neural Network</strong> predicts seepage flow through an earth dam. Satisfies Laplace equation as a physics constraint during training.');
    const met=addMetrics(sp,[{id:'hw',val:'40',label:'Head (m)'},{id:'k',val:'1e-6',label:'Permeability'},{id:'seepage',val:'—',label:'Seepage (L/day)'},{id:'exit',val:'—',label:'Exit Gradient'},{id:'fos',val:'—',label:'FoS (Piping)'},{id:'loss',val:'—',label:'PINN Loss'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.cyan);
    let hw=40,kPerm=1e-6,computing=false;
    let flowLines=[],phreaticLine=[];
    let animPhase=0;

    function compute(){
        computing=true;flowLines=[];phreaticLine=[];
        // Dam geometry
        const damBase=W*0.7;const damTop=W*0.3;const damH=H*0.6;
        const damX=(W-damBase)/2;const damY=H-30;
        // Phreatic line (parabolic approximation)
        const nPts=50;
        for(let i=0;i<=nPts;i++){const t=i/nPts;const x=damX+t*damBase;
            const focDist=0.3*damBase;const yPhreatic=damY-damH*(hw/50)*Math.sqrt(Math.max(0,1-Math.pow(t*1.5-0.1,2)));
            phreaticLine.push({x,y:Math.max(damY-damH,yPhreatic)});}
        // Flow lines
        for(let f=0;f<6;f++){const startFrac=(f+1)/7;const line=[];
            for(let i=0;i<=30;i++){const t=i/30;const x=damX+t*damBase*0.9;const baseY=damY-5;const topY=damY-damH*startFrac*(hw/50);
                const y=lerp(topY,baseY,Math.pow(t,0.7))+Math.sin(t*3)*5;line.push({x,y:clamp(y,damY-damH,damY)});}
            flowLines.push(line);}
        // Metrics
        const seepageQ=kPerm*Math.pow(hw,2)*1e6*86400/50;met.seepage.textContent=seepageQ.toFixed(1);
        const exitGrad=hw/(damBase*0.3);met.exit.textContent=exitGrad.toFixed(3);
        met.fos.textContent=(1.0/exitGrad).toFixed(2);met.fos.style.color=1/exitGrad<2?colors.red:1/exitGrad<4?colors.amber:colors.green;
        met.loss.textContent=rand(0.001,0.01).toFixed(4);
        log.add('PINN solution: Q='+met.seepage.textContent+' L/day, ie='+met.exit.textContent,'ok');
        log.add('Exit gradient FoS='+(1/exitGrad).toFixed(2)+(1/exitGrad<2?' — UNSAFE!':' — Safe'),'ok');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);
        animPhase+=0.02;

        const damBase=W*0.7;const damTop=W*0.3;const damH=H*0.6;
        const damX=(W-damBase)/2;const damY=H-30;
        // Foundation
        ctx.fillStyle='#3a3020';ctx.fillRect(0,damY,W,30);
        // Dam body (trapezoidal)
        const leftSlope=damX;const rightSlope=damX+damBase;const topLeft=damX+(damBase-damTop)/2;const topRight=topLeft+damTop;
        ctx.fillStyle='#5a4a30';ctx.beginPath();ctx.moveTo(leftSlope,damY);ctx.lineTo(topLeft,damY-damH);ctx.lineTo(topRight,damY-damH);ctx.lineTo(rightSlope,damY);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#7a6a40';ctx.lineWidth=1;ctx.stroke();
        // Upstream water
        const waterH=hw/50*damH;ctx.fillStyle='rgba(14,165,233,0.15)';ctx.fillRect(0,damY-waterH,leftSlope+20,waterH);
        ctx.strokeStyle=colors.cyan+'60';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,damY-waterH);ctx.lineTo(leftSlope+20,damY-waterH);ctx.stroke();
        // Water level label
        ctx.fillStyle=colors.cyan;ctx.font='9px JetBrains Mono';ctx.textAlign='center';ctx.fillText('h = '+hw+'m',leftSlope/2,damY-waterH-5);
        // Downstream (dry side)
        ctx.fillStyle=colors.text;ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText('Downstream',rightSlope+(W-rightSlope)/2,damY-10);

        // Phreatic line
        if(phreaticLine.length>1){ctx.strokeStyle=colors.cyan;ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.beginPath();
            phreaticLine.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);
            ctx.fillStyle=colors.cyan;ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText('Phreatic Line',phreaticLine[10].x,phreaticLine[10].y-8);}

        // Flow lines with animated particles
        flowLines.forEach((line,fi)=>{if(line.length<2)return;
            ctx.strokeStyle=colors.teal+'40';ctx.lineWidth=0.8;ctx.beginPath();
            line.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.stroke();
            // Animated dot along flow line
            const dotIdx=Math.floor((animPhase*5+fi*5)%line.length);
            const dot=line[dotIdx];
            ctx.fillStyle=colors.teal;ctx.beginPath();ctx.arc(dot.x,dot.y,3,0,Math.PI*2);ctx.fill();
            drawGlow(ctx,dot.x,dot.y,8,colors.teal);
        });

        // Equipotential lines (vertical-ish)
        for(let ep=0;ep<5;ep++){const frac=(ep+1)/6;const x=damX+frac*damBase*0.8;
            ctx.strokeStyle=colors.amber+'20';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(x,damY-damH*0.8);ctx.lineTo(x,damY);ctx.stroke();}

        // Labels
        ctx.fillStyle='#8a7a50';ctx.font='bold 10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('EARTH DAM',W/2,damY-damH/2);
        // Toe drain indicator
        ctx.fillStyle=colors.green+'40';ctx.beginPath();ctx.moveTo(rightSlope-40,damY);ctx.lineTo(rightSlope,damY);ctx.lineTo(rightSlope,damY-20);ctx.closePath();ctx.fill();
        ctx.fillStyle=colors.green;ctx.font='7px JetBrains Mono';ctx.fillText('Toe Drain',rightSlope-20,damY+12);
        // Permeability label
        ctx.fillStyle=colors.muted;ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText('k = '+kPerm.toExponential(1)+' m/s',W/2,damY-damH/2+15);
        ov._raf=requestAnimationFrame(draw);
    }
    addSlider(ca,'Upstream Head (m)',10,50,40,5,v=>{hw=v;met.hw.textContent=v;compute();});
    addSlider(ca,'Permeability (×10⁻⁶)',0.1,10,1,0.1,v=>{kPerm=v*1e-6;met.k.textContent=kPerm.toExponential(1);compute();});
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-play"></i> Solve PINN','accent',()=>{compute();});
    addBtn(br,'<i class="fa-solid fa-water"></i> Flood Level','danger',()=>{hw=48;met.hw.textContent='48';compute();log.add('Flood level! Head raised to 48m','warn');});
    addBtn(br,'<i class="fa-solid fa-rotate"></i> Reset','',()=>{hw=40;met.hw.textContent='40';kPerm=1e-6;flowLines=[];phreaticLine=[];});
    ca.appendChild(br);
    addTabs(sp,['PINN Model','Seepage Theory','Dam Safety'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Physics-Informed Neural Network</strong><br><br>Loss = Data Loss + λ × Physics Loss<br><br>Physics constraint: ∂²h/∂x² + ∂²h/∂y² = 0<br>(Laplace equation for steady seepage)<br><br>Boundary conditions:<br>• Upstream: h = reservoir level<br>• Downstream: h = tailwater<br>• Phreatic surface: free boundary<br><br>No mesh required (unlike FEM).',
        '<strong>Seepage Theory</strong><br><br>Darcy\'s Law: q = k × i × A<br>Exit gradient: ie = h/L<br>Critical gradient: ic = (Gs-1)/(1+e) ≈ 1.0<br><br>FoS against piping = ic/ie<br>Minimum FoS = 4.0 (IS 8237)<br><br>Phreatic line: Casagrande method<br>Kozeny basic parabola solution.',
        '<strong>IS 8237 Dam Safety</strong><br><br>• Piezometer installation at critical sections<br>• Seepage flow measurement at toe drains<br>• Exit gradient monitoring<br>• Internal erosion (piping) prevention<br>• Filter criteria (IS 9429)<br>• Dam safety review every 5 years<br>• NDSA Dam Safety Act 2021'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>PINN Seepage</strong> — Adjust head and permeability to see flow lines and exit gradient analysis.'}));
    compute();draw();
}

/* ── Wire up cards ── */
const demos=[
    {title:'Concrete f\'c Predictor',icon:'fa-cube',build:buildConcreteFC},
    {title:'LSTM Flood Forecast',icon:'fa-water',build:buildFloodLSTM},
    {title:'DNN Soil Classifier',icon:'fa-layer-group',build:buildSoilDNN},
    {title:'Settlement Predictor',icon:'fa-building',build:buildSettlement},
    {title:'SHM Anomaly Detector',icon:'fa-tower-broadcast',build:buildSHM},
    {title:'Dam Seepage (PINN)',icon:'fa-dam',build:buildDamSeepage}
];
function init(){
    const cards=document.querySelectorAll('.app-grid .app-card');
    cards.forEach((card,i)=>{if(i<demos.length){card.style.cursor='pointer';card.addEventListener('click',()=>openOverlay(demos[i].title,demos[i].icon,demos[i].build));
        const badge=CE('div');badge.style.cssText='margin-top:8px;font-size:.72rem;color:#00d4aa;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:center';badge.innerHTML='<i class="fa-solid fa-hand-pointer"></i> Click for Interactive Demo';card.appendChild(badge);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
