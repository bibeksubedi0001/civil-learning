/* ================================================================
   CHAPTER 5 — INTERACTIVE APPLICATION DEMOS (LLM / NLP)
   6 demos — ENHANCED v2 with typing animations, chat interfaces,
   streaming text, and document analysis simulations
   ================================================================ */
(function(){
'use strict';
const CE=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e};
const rand=(a,b)=>Math.random()*(b-a)+a;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
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
   DEMO 1: INSPECTION REPORT GENERATOR — typing animation
   ================================================================ */
function buildInspectionReport(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-file-lines"></i> LLM Report Generator'}));
    addInfo(sp,'<strong>GPT-4</strong> generates structural inspection reports from field observations. Watch the text stream in real-time with highlighted engineering terms and code references.');
    const met=addMetrics(sp,[{id:'tokens',val:'0',label:'Tokens Generated'},{id:'speed',val:'—',label:'Tokens/sec'},{id:'refs',val:'0',label:'Code References'},{id:'findings',val:'0',label:'Findings'},{id:'severity',val:'—',label:'Max Severity'},{id:'cost',val:'—',label:'Est. Cost ($)'}]);
    const log=addLog(sp);
    let particles=makeParticles(10,W,H,colors.teal);
    let reportLines=[],charIdx=0,lineIdx=0,typing=false,totalTokens=0;
    const templates=[
        ['STRUCTURAL INSPECTION REPORT','','Project: RC Frame Building — Block A','Date: '+new Date().toLocaleDateString(),'Inspector: AI-Assisted (GPT-4)','','--- EXECUTIVE SUMMARY ---','','Visual inspection reveals moderate deterioration','in beam-column joints at Level 2. Carbonation','depth measured at 18mm exceeds cover (25mm).','Refer IS 456:2000 Cl. 26.4.2.1 for minimum','cover requirements.','','--- FINDINGS ---','','1. SPALLING at Column C3-L2:','   - Area: 300mm x 200mm','   - Depth: 15mm (rebar partially exposed)','   - Severity: MODERATE (Grade 2)','   - Action: Repair per IS 15988:2013','','2. CRACK at Beam B2-B3 (L2):','   - Width: 0.35mm (exceeds 0.2mm limit)','   - Pattern: Flexural, mid-span','   - Severity: SIGNIFICANT (Grade 3)','   - Action: Structural assessment required','','3. EFFLORESCENCE on Retaining Wall RW-1:','   - Coverage: 2.5 sq.m','   - Severity: MINOR (Grade 1)','   - Action: Monitor, treat with sealant','','--- RECOMMENDATIONS ---','','1. Priority repair of Column C3-L2','2. Load test Beam B2-B3 per IS 456 Cl. 17.6','3. Cathodic protection survey for parking area','4. Re-inspection in 6 months','','Cost Estimate: Rs 4,50,000 (Level 2 repairs)'],
        ['BRIDGE INSPECTION REPORT','','Structure: RCC T-Beam Bridge (NH-44)','Span: 3 x 15m, Year: 1985','Condition Rating: 4/9 (POOR)','','--- DECK CONDITION ---','','Wearing surface shows alligator cracking over','40% of deck area. Expansion joints at Pier P2','show 35mm gap (design: 25mm). Drainage spouts','blocked at 3 locations per IRC:SP:35.','','--- SUBSTRUCTURE ---','','1. PIER P1: Scour at toe, exposed footing','   - Scour depth: 1.2m below design level','   - Severity: CRITICAL (IRC:SP:35 Grade 5)','   - Action: Immediate scour protection','','2. ABUTMENT A2: Diagonal crack 0.5mm','   - Pattern: Shear crack at bearing seat','   - Severity: SIGNIFICANT','   - Action: Structural retrofit per IRC:SP:40','','3. BEARINGS: Elastomeric pad displaced 15mm','   - 2 of 6 bearings tilted beyond 3 degrees','   - Severity: MODERATE','   - Action: Replace during next maintenance','','--- LOAD RATING ---','','Current capacity: IRC Class A — 70%','Restricted to single-lane operation.','Full rehabilitation recommended within 2 years.','','Cost Estimate: Rs 2.8 Crore']
    ];

    function startGeneration(templateIdx){
        reportLines=templates[templateIdx];charIdx=0;lineIdx=0;typing=true;totalTokens=0;
        met.tokens.textContent='0';met.refs.textContent='0';met.findings.textContent='0';
        log.add('LLM generation started (GPT-4 Turbo)...','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        // Terminal-style text rendering
        const pad={l:25,t:20};const lineH=16;const maxVisibleLines=Math.floor((H-40)/lineH);
        const startLine=Math.max(0,lineIdx-maxVisibleLines+3);

        for(let i=startLine;i<=Math.min(lineIdx,reportLines.length-1);i++){
            const y=pad.t+(i-startLine)*lineH;if(y>H-20)break;
            const line=reportLines[i];const displayLine=i<lineIdx?line:line.substring(0,charIdx);

            // Syntax highlighting
            if(displayLine.startsWith('---')){ctx.fillStyle=colors.teal;ctx.font='bold 11px JetBrains Mono';}
            else if(displayLine.match(/^\d+\./)){ctx.fillStyle=colors.amber;ctx.font='11px JetBrains Mono';}
            else if(displayLine.includes('CRITICAL')||displayLine.includes('SIGNIFICANT')){ctx.fillStyle=colors.red;ctx.font='bold 11px JetBrains Mono';}
            else if(displayLine.includes('MODERATE')){ctx.fillStyle=colors.amber;ctx.font='11px JetBrains Mono';}
            else if(displayLine.includes('MINOR')){ctx.fillStyle=colors.green;ctx.font='11px JetBrains Mono';}
            else if(displayLine.includes('IS ')||displayLine.includes('IRC')||displayLine.includes('NBC')){ctx.fillStyle=colors.cyan;ctx.font='11px JetBrains Mono';}
            else if(displayLine.startsWith('   ')){ctx.fillStyle=colors.text;ctx.font='11px JetBrains Mono';}
            else if(displayLine===displayLine.toUpperCase()&&displayLine.length>3){ctx.fillStyle='#fff';ctx.font='bold 12px JetBrains Mono';}
            else{ctx.fillStyle=colors.text;ctx.font='11px JetBrains Mono';}

            ctx.textAlign='left';ctx.fillText(displayLine,pad.l,y);
        }
        // Blinking cursor
        if(typing&&Math.floor(Date.now()/500)%2===0){const y=pad.t+(Math.min(lineIdx,reportLines.length-1)-startLine)*lineH;
            const cursorX=pad.l+ctx.measureText(lineIdx<reportLines.length?reportLines[lineIdx].substring(0,charIdx):'').width;
            ctx.fillStyle=colors.teal;ctx.fillRect(cursorX,y-12,2,14);}

        // Advance typing
        if(typing&&lineIdx<reportLines.length){
            charIdx+=2;// 2 chars per frame
            if(charIdx>=reportLines[lineIdx].length){
                totalTokens+=reportLines[lineIdx].split(/\s+/).length;
                // Count special items
                if(reportLines[lineIdx].includes('IS ')||reportLines[lineIdx].includes('IRC'))met.refs.textContent=parseInt(met.refs.textContent)+1;
                if(reportLines[lineIdx].match(/^\d+\.\s/))met.findings.textContent=parseInt(met.findings.textContent)+1;
                if(reportLines[lineIdx].includes('CRITICAL')){met.severity.textContent='CRITICAL';met.severity.style.color=colors.red;}
                else if(reportLines[lineIdx].includes('SIGNIFICANT')&&met.severity.textContent!=='CRITICAL'){met.severity.textContent='SIGNIFICANT';met.severity.style.color=colors.red;}
                if(reportLines[lineIdx].includes('Cost'))met.cost.textContent=reportLines[lineIdx].split(':')[1]||'—';
                charIdx=0;lineIdx++;met.tokens.textContent=totalTokens;met.speed.textContent=Math.floor(rand(35,65));
            }
            if(lineIdx>=reportLines.length){typing=false;log.add('Report generation complete. '+totalTokens+' tokens.','ok');}
        }
        // Token counter animation
        const tokenBarW=200;const tokenBarX=W-tokenBarW-20;const tokenBarY=H-30;
        ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(tokenBarX-5,tokenBarY-5,tokenBarW+10,20);
        const pct=totalTokens/300;ctx.fillStyle=colors.teal+'40';ctx.fillRect(tokenBarX,tokenBarY,tokenBarW*pct,10);ctx.fillStyle=colors.teal;ctx.fillRect(tokenBarX,tokenBarY,2,10);
        ctx.fillStyle=colors.text;ctx.font='8px JetBrains Mono';ctx.textAlign='right';ctx.fillText(totalTokens+' tokens',tokenBarX+tokenBarW,tokenBarY-2);
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-building"></i> Building Report','accent',()=>{startGeneration(0);});
    addBtn(br,'<i class="fa-solid fa-bridge"></i> Bridge Report','',()=>{startGeneration(1);});
    addBtn(br,'<i class="fa-solid fa-stop"></i> Stop','danger',()=>{typing=false;log.add('Generation stopped at '+totalTokens+' tokens','warn');});
    ca.appendChild(br);
    addSlider(ca,'Temperature',0,1,0.3,0.1,v=>{});
    addSlider(ca,'Max Tokens',100,500,300,50,v=>{});
    addTabs(sp,['LLM Pipeline','Prompt Engineering','Standards'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Report Generation Pipeline</strong><br><br>1. Field data → structured JSON input<br>2. RAG retrieval of relevant IS/IRC codes<br>3. GPT-4 generation with code-aware prompt<br>4. Post-processing: severity grading, cost estimation<br>5. Template conformance check<br>6. Human review and sign-off.',
        '<strong>Prompt Engineering</strong><br><br>System: "You are a senior structural engineer..."<br><br>Key techniques:<br>• Few-shot examples of past reports<br>• Chain-of-thought for severity assessment<br>• Code reference injection via RAG<br>• Output format constraints (JSON schema)<br>• Temperature 0.3 for consistency.',
        '<strong>Referenced Standards</strong><br><br>• IS 456:2000 — Plain & reinforced concrete<br>• IS 15988:2013 — Repair & rehabilitation<br>• IRC:SP:35 — Bridge inspection manual<br>• IRC:SP:40 — Bridge rehabilitation<br>• IS 13920 — Ductile detailing<br>• NBC 2016 — National Building Code'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>LLM Report</strong> — Click a report type to watch GPT-4 generate it with syntax highlighting.'}));
    draw();
}

/* ================================================================
   DEMO 2: BUILDING CODE Q&A — chat-style interface
   ================================================================ */
function buildCodeQA(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-comments"></i> Code Compliance Q&A'}));
    addInfo(sp,'<strong>RAG-powered</strong> Q&A system for building codes (IS 456, IS 1893, NBC). Ask questions and get context-aware answers with clause references.');
    const met=addMetrics(sp,[{id:'chunks',val:'0',label:'RAG Chunks'},{id:'sim',val:'—',label:'Top Similarity'},{id:'tokens',val:'0',label:'Response Tokens'},{id:'latency',val:'—',label:'Latency (ms)'},{id:'sources',val:'0',label:'Sources Cited'},{id:'conf',val:'—',label:'Answer Conf.'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.cyan);
    let messages=[];let typing=false,currentResponse='',charPos=0;
    const qaDB=[
        {q:'What is minimum cover for moderate exposure?',a:'Per IS 456:2000, Table 16:\n\nMinimum concrete cover for MODERATE exposure:\n• Beams: 30mm\n• Slabs: 25mm\n• Columns: 40mm\n\nFor severe exposure, increase by 5mm.\nCover ensures corrosion protection and fire resistance per Cl. 26.4.2.',chunks:5,sim:0.92,sources:3},
        {q:'Seismic zone factor for Delhi?',a:'Per IS 1893:2016, Table 3:\n\nDelhi falls in SEISMIC ZONE IV.\nZone Factor Z = 0.24\n\nDesign horizontal acceleration:\nAh = (Z/2) x (I/R) x (Sa/g)\n\nFor residential building (I=1, R=5):\nAh = 0.24/2 x 1/5 x 2.5 = 0.06g\n\nSeismic weight at each floor level\nper Cl. 7.4.',chunks:4,sim:0.89,sources:2},
        {q:'Max water-cement ratio for RCC?',a:'Per IS 456:2000, Table 5:\n\nMax w/c ratio by exposure:\n• Mild: 0.55\n• Moderate: 0.50\n• Severe: 0.45\n• Very Severe: 0.45\n• Extreme: 0.40\n\nMin cement content: 300-360 kg/m3\ndepending on exposure.\nRefer Cl. 8.2.4.1 for mix design.',chunks:3,sim:0.95,sources:2},
        {q:'What is the minimum reinforcement in slabs?',a:'Per IS 456:2000, Cl. 26.5.2.1:\n\nMinimum reinforcement in slabs:\n• Fe 250 steel: 0.15% of bD\n• Fe 415/500 steel: 0.12% of bD\n\nwhere b = width, D = total depth.\n\nMaximum spacing:\n• Main bars: 3d or 300mm (whichever less)\n• Distribution: 5d or 450mm\nwhere d = effective depth.',chunks:4,sim:0.91,sources:2}
    ];
    let currentQA=null;

    function askQuestion(qIdx){
        currentQA=qaDB[qIdx];
        messages.push({role:'user',text:currentQA.q});
        typing=true;currentResponse='';charPos=0;
        met.chunks.textContent=currentQA.chunks;met.sim.textContent=currentQA.sim.toFixed(2);met.sources.textContent=currentQA.sources;
        met.conf.textContent=Math.round(currentQA.sim*100)+'%';
        log.add('RAG query: retrieved '+currentQA.chunks+' chunks (top sim='+currentQA.sim+')','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        // Chat messages
        let y=20;
        messages.forEach(msg=>{
            const isUser=msg.role==='user';const bgColor=isUser?'rgba(14,165,233,0.1)':'rgba(0,212,170,0.08)';const borderColor=isUser?colors.cyan:colors.teal;
            const maxW=W*0.75;const lineH=14;const lines=msg.text.split('\n');
            const msgH=lines.length*lineH+20;
            const mx=isUser?W-maxW-20:20;

            ctx.fillStyle=bgColor;ctx.strokeStyle=borderColor+'40';ctx.lineWidth=1;
            ctx.beginPath();ctx.roundRect(mx,y,maxW,msgH,6);ctx.fill();ctx.stroke();

            // Role label
            ctx.fillStyle=borderColor;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';
            ctx.fillText(isUser?'YOU':'AI ASSISTANT',mx+10,y+12);

            // Message text
            lines.forEach((line,li)=>{
                if(line.includes('IS ')||line.includes('IRC')||line.includes('Cl.')){ctx.fillStyle=colors.cyan;}
                else if(line.includes('ZONE')||line===line.toUpperCase()&&line.length>5){ctx.fillStyle=colors.amber;}
                else if(line.startsWith('•')){ctx.fillStyle=colors.teal;}
                else{ctx.fillStyle=colors.text;}
                ctx.font='10px JetBrains Mono';ctx.fillText(line,mx+10,y+24+li*lineH);
            });
            y+=msgH+10;
        });

        // Typing animation for current response
        if(typing&&currentQA){
            const displayText=currentQA.a.substring(0,charPos);
            const lines=displayText.split('\n');const lineH=14;const maxW=W*0.75;const msgH=lines.length*lineH+25;
            const mx=20;

            ctx.fillStyle='rgba(0,212,170,0.08)';ctx.strokeStyle=colors.teal+'40';ctx.lineWidth=1;
            ctx.beginPath();ctx.roundRect(mx,y,maxW,msgH,6);ctx.fill();ctx.stroke();
            ctx.fillStyle=colors.teal;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';ctx.fillText('AI ASSISTANT',mx+10,y+12);
            lines.forEach((line,li)=>{
                if(line.includes('IS ')||line.includes('Cl.')){ctx.fillStyle=colors.cyan;}
                else if(line.startsWith('•')){ctx.fillStyle=colors.teal;}
                else{ctx.fillStyle=colors.text;}
                ctx.font='10px JetBrains Mono';ctx.fillText(line,mx+10,y+24+li*lineH);
            });
            // Cursor
            if(Math.floor(Date.now()/500)%2===0){const lastLine=lines[lines.length-1]||'';const cursorX=mx+10+ctx.measureText(lastLine).width;ctx.fillStyle=colors.teal;ctx.fillRect(cursorX,y+12+(lines.length-1)*lineH,2,12);}

            charPos+=2;met.tokens.textContent=Math.floor(charPos/4);met.latency.textContent=Math.floor(rand(200,800));
            if(charPos>=currentQA.a.length){typing=false;messages.push({role:'assistant',text:currentQA.a});log.add('Response complete: '+met.tokens.textContent+' tokens','ok');}
        }
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-shield-halved"></i> Min. Cover?','accent',()=>{askQuestion(0);});
    addBtn(br,'<i class="fa-solid fa-house-crack"></i> Zone Factor?','',()=>{askQuestion(1);});
    addBtn(br,'<i class="fa-solid fa-droplet"></i> Max W/C?','',()=>{askQuestion(2);});
    addBtn(br,'<i class="fa-solid fa-bars"></i> Min. Rebar?','',()=>{askQuestion(3);});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{messages=[];typing=false;met.tokens.textContent='0';});
    ca.appendChild(br);
    addTabs(sp,['RAG Pipeline','Embeddings','Codes'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>RAG Architecture</strong><br><br>1. <strong>Indexing:</strong> IS/IRC PDFs → chunks → embeddings<br>2. <strong>Query:</strong> User question → embedding<br>3. <strong>Retrieval:</strong> Vector similarity search (FAISS)<br>4. <strong>Augmentation:</strong> Top-k chunks + question → prompt<br>5. <strong>Generation:</strong> GPT-4 produces answer<br>6. <strong>Citation:</strong> Clause references extracted.',
        '<strong>Text Embeddings</strong><br><br>• Model: text-embedding-3-small (OpenAI)<br>• Dimension: 1536<br>• Chunk size: 512 tokens (overlap 50)<br>• Index: FAISS IVF-PQ<br>• Corpus: 12 IS codes, 5 IRC codes, NBC 2016<br>• Total chunks: ~15,000',
        '<strong>Supported Codes</strong><br><br>• IS 456:2000 — RC structures<br>• IS 1893:2016 — Seismic design<br>• IS 800:2007 — Steel structures<br>• IS 13920 — Ductile detailing<br>• IS 2950 — Raft foundations<br>• IRC:6 — Loads on bridges<br>• NBC 2016 — National Building Code'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Code Q&A</strong> — Click a question to see RAG-powered response with clause references.'}));
    draw();
}

/* ================================================================
   DEMO 3: HYDROLOGY LOG SUMMARIZER — flowing water + NLP
   ================================================================ */
function buildHydrologyLog(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-water"></i> Hydrology Log Summarizer'}));
    addInfo(sp,'<strong>BERT</strong> summarizes verbose field hydrology logs into concise technical summaries. Watch the NLP pipeline: tokenization → attention → summary generation.');
    const met=addMetrics(sp,[{id:'input',val:'0',label:'Input Words'},{id:'output',val:'0',label:'Summary Words'},{id:'ratio',val:'—',label:'Compression'},{id:'entities',val:'0',label:'Entities Found'},{id:'sentiment',val:'—',label:'Assessment'},{id:'time',val:'—',label:'Processing (ms)'}]);
    const log=addLog(sp);
    let particles=makeParticles(12,W,H,colors.cyan);
    let waterY=0;
    let inputText='',summaryText='',typing=false,charPos=0;
    const fieldLogs=[
        {input:'Site visit conducted on 15/03/2024 at Chambal River gauging station GS-04. Water level observed at 4.2m above datum, which is approximately 0.8m above the seasonal average for March. Flow velocity measured at three points across the cross-section using current meter: left bank 0.4 m/s, center 1.8 m/s, right bank 0.6 m/s. Estimated discharge 485 cubic meters per second. Upstream reservoir (Gandisagar Dam) releasing 200 cumecs through spillway. Turbidity visually high due to recent rainfall (45mm recorded at nearby AWS in past 48 hours). Bank erosion observed on right bank near chainage 2+400, approximately 3m lateral recession since last visit. Flood marks from 2023 monsoon visible at 8.5m elevation. Recommended installation of bank protection works.',
        summary:'Chambal River GS-04 (15/03/24): Level 4.2m (+0.8m above avg). Discharge 485 m3/s. Velocity: 0.4-1.8 m/s (L-C-R). Gandisagar release 200 cumecs. High turbidity post 45mm rain. Right bank erosion 3m at Ch.2+400. 2023 flood mark 8.5m. Bank protection recommended.',entities:['Chambal River','GS-04','Gandisagar Dam','Ch.2+400'],sentiment:'Moderate Risk'},
        {input:'Groundwater monitoring well MW-07 located in alluvial aquifer (quaternary deposits) measured on 22/01/2024. Static water level: 12.4m below ground level (bgl). Previous reading (Dec 2023): 11.8m bgl. Decline of 0.6m in one month indicates excessive pumping from nearby agricultural wells. EC measured: 1850 micro-S/cm (above BIS limit of 1500). pH: 7.8 (within limits). Temperature: 24.5 deg C. Aquifer test conducted: transmissivity 450 sq.m/day, storativity 0.08. Recommended reduction in pumping schedule and artificial recharge through percolation pit. Nearest recharge structure (check dam) located 800m upstream, not functioning due to siltation.',
        summary:'MW-07 alluvial aquifer (22/01/24): SWL 12.4m bgl (0.6m decline/month). EC 1850 uS/cm (exceeds BIS). T=450 m2/d, S=0.08. Excessive pumping identified. Nearest check dam (800m) non-functional (silted). Recommend: reduce pumping + artificial recharge via percolation pit.',entities:['MW-07','BIS','Check Dam'],sentiment:'High Concern'}
    ];
    let currentLog=null;

    function processLog(idx){
        currentLog=fieldLogs[idx];inputText=currentLog.input;summaryText='';typing=true;charPos=0;
        met.input.textContent=inputText.split(/\s+/).length;met.output.textContent='0';
        met.entities.textContent=currentLog.entities.length;met.sentiment.textContent=currentLog.sentiment;
        met.sentiment.style.color=currentLog.sentiment.includes('High')?colors.red:colors.amber;
        log.add('Processing field log ('+met.input.textContent+' words)...','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        // Animated water background
        waterY+=0.02;
        for(let x=0;x<W;x+=3){const y=H-20+Math.sin(x*0.02+waterY)*5+Math.sin(x*0.05+waterY*1.5)*3;
            ctx.fillStyle='rgba(14,165,233,0.03)';ctx.fillRect(x,y,3,H-y);}
        drawParticles(ctx,particles,W,H);

        const midX=W/2;
        // Input (left half)
        ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(10,10,midX-20,H-20);ctx.strokeStyle=colors.border;ctx.lineWidth=1;ctx.strokeRect(10,10,midX-20,H-20);
        ctx.fillStyle=colors.cyan;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('INPUT — Field Log',20,30);

        if(inputText){
            ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';
            const words=inputText.split(' ');let line='',ly=48;
            words.forEach(word=>{const test=line+word+' ';if(ctx.measureText(test).width>midX-50){ctx.fillText(line,20,ly);ly+=13;line=word+' ';}else{line=test;}});
            if(line)ctx.fillText(line,20,ly);
            // Highlight entities
            if(currentLog){currentLog.entities.forEach(ent=>{const idx=inputText.indexOf(ent);if(idx>=0){// simplified highlight
                ctx.fillStyle=colors.amber+'20';/* entity highlight marker */}});}
        }
        // Arrow
        ctx.fillStyle=colors.teal;ctx.font='20px Inter';ctx.textAlign='center';ctx.fillText('→',midX,H/2);
        ctx.fillStyle=colors.teal;ctx.font='9px JetBrains Mono';ctx.fillText('BERT Summarizer',midX,H/2+18);

        // Output (right half)
        ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(midX+10,10,midX-20,H-20);ctx.strokeStyle=colors.teal+'40';ctx.lineWidth=1;ctx.strokeRect(midX+10,10,midX-20,H-20);
        ctx.fillStyle=colors.teal;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('OUTPUT — Summary',midX+20,30);

        if(typing&&currentLog){
            const displayText=currentLog.summary.substring(0,charPos);
            ctx.fillStyle=colors.text;ctx.font='10px JetBrains Mono';
            const words=displayText.split(' ');let line='',ly=48;
            words.forEach(word=>{const test=line+word+' ';if(ctx.measureText(test).width>midX-50){ctx.fillText(line,midX+20,ly);ly+=14;line=word+' ';}else{line=test;}});
            if(line)ctx.fillText(line,midX+20,ly);
            // Cursor
            if(Math.floor(Date.now()/500)%2===0){ctx.fillStyle=colors.teal;ctx.fillRect(midX+20+ctx.measureText(line).width,ly-10,2,12);}

            charPos+=3;met.output.textContent=Math.floor(charPos/5);
            const inW=parseInt(met.input.textContent);const outW=parseInt(met.output.textContent);
            if(outW>0)met.ratio.textContent=Math.round(outW/inW*100)+'%';
            met.time.textContent=Math.floor(rand(150,400));
            if(charPos>=currentLog.summary.length){typing=false;met.output.textContent=currentLog.summary.split(/\s+/).length;log.add('Summary generated: '+met.ratio.textContent+' compression ratio','ok');}
        } else if(!typing&&currentLog){
            ctx.fillStyle=colors.text;ctx.font='10px JetBrains Mono';
            const words=currentLog.summary.split(' ');let line='',ly=48;
            words.forEach(word=>{const test=line+word+' ';if(ctx.measureText(test).width>midX-50){ctx.fillText(line,midX+20,ly);ly+=14;line=word+' ';}else{line=test;}});
            if(line)ctx.fillText(line,midX+20,ly);
        }
        // NLP pipeline visualization (bottom)
        const pipeY=H-35;const steps=['Tokenize','Encode','Attend','Decode','Summary'];const stepW=W/(steps.length+1);
        steps.forEach((step,i)=>{const sx=30+i*stepW;const active=typing&&charPos>(i*currentLog?.summary.length/5||0);
            ctx.fillStyle=active?colors.teal+'30':colors.border;ctx.fillRect(sx,pipeY,stepW-10,20);ctx.strokeStyle=active?colors.teal:colors.muted;ctx.lineWidth=0.5;ctx.strokeRect(sx,pipeY,stepW-10,20);
            ctx.fillStyle=active?colors.teal:colors.muted;ctx.font='8px JetBrains Mono';ctx.textAlign='center';ctx.fillText(step,sx+(stepW-10)/2,pipeY+13);
            if(i<steps.length-1){ctx.fillStyle=colors.muted;ctx.fillText('→',sx+stepW-5,pipeY+13);}
        });
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-water"></i> River Log','accent',()=>{processLog(0);});
    addBtn(br,'<i class="fa-solid fa-droplet"></i> GW Log','',()=>{processLog(1);});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{inputText='';summaryText='';currentLog=null;typing=false;});
    ca.appendChild(br);
    addTabs(sp,['BERT Model','Entity Recognition','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>BERT Extractive Summarization</strong><br><br>1. Tokenize input (WordPiece, 512 max)<br>2. Encode with BERT-base (12 layers)<br>3. Score each sentence for importance<br>4. Select top-k sentences<br>5. Reorder chronologically<br><br>Compression ratio: 60-70% reduction.<br>Fine-tuned on 2000 hydrology field reports.',
        '<strong>Named Entity Recognition</strong><br><br>Entities extracted by NER model:<br>• <span style="color:'+colors.amber+'">■</span> Location (river, station, chainage)<br>• <span style="color:'+colors.cyan+'">■</span> Measurement (level, velocity, EC)<br>• <span style="color:'+colors.teal+'">■</span> Infrastructure (dam, well, check dam)<br>• <span style="color:'+colors.purple+'">■</span> Standard reference (BIS, IS code)<br><br>F1 score: 0.88 on test set.',
        '<strong>Water Resources Applications</strong><br><br>• Summarize daily gauge readings<br>• Extract key parameters from field books<br>• Generate weekly/monthly reports<br>• Identify abnormal readings automatically<br>• CWC flood bulletin summarization<br>• Integration with WIMS/SWDES databases'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Log Summarizer</strong> — Click a log type to watch BERT compress it. Left = input, Right = summary.'}));
    draw();
}

/* ================================================================
   DEMO 4: SPEC REVIEW (BERT Comparison) — diff highlighting
   ================================================================ */
function buildSpecReview(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-file-contract"></i> BERT Spec Reviewer'}));
    addInfo(sp,'<strong>BERT semantic similarity</strong> compares project specifications against IS code requirements. Highlights compliance gaps and deviations.');
    const met=addMetrics(sp,[{id:'clauses',val:'0',label:'Clauses Checked'},{id:'comply',val:'0',label:'Compliant'},{id:'deviate',val:'0',label:'Deviations'},{id:'score',val:'—',label:'Compliance %'},{id:'critical',val:'0',label:'Critical Gaps'},{id:'time',val:'—',label:'Analysis (ms)'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.amber);
    let checkResults=[],animIdx=0,checking=false;
    const checks=[
        {spec:'Concrete cover: 20mm for all members',code:'IS 456 Cl.26.4: Min cover 30mm (moderate)',status:'FAIL',sim:0.78,severity:'critical'},
        {spec:'W/C ratio not exceeding 0.50',code:'IS 456 Table 5: Max w/c 0.50 (moderate)',status:'PASS',sim:0.95,severity:'ok'},
        {spec:'Minimum cement content 320 kg/m3',code:'IS 456 Table 5: Min 300 kg/m3 (moderate)',status:'PASS',sim:0.92,severity:'ok'},
        {spec:'Rebar spacing 200mm c/c in slab',code:'IS 456 Cl.26.5: Max spacing 3d or 300mm',status:'PASS',sim:0.88,severity:'ok'},
        {spec:'Development length 40d for Fe500',code:'IS 456 Cl.26.2: Ld = 47d for Fe500 in M20',status:'FAIL',sim:0.82,severity:'critical'},
        {spec:'Column ties at 150mm spacing',code:'IS 13920 Cl.7.3: Max 100mm in critical zone',status:'FAIL',sim:0.71,severity:'critical'},
        {spec:'Beam depth 500mm for 6m span',code:'IS 456 Cl.23.2: Min L/d ratio check',status:'WARN',sim:0.65,severity:'review'},
        {spec:'Grade M25 for residential building',code:'IS 456 Table 5: Min M20 for moderate exposure',status:'PASS',sim:0.90,severity:'ok'}
    ];

    function startCheck(){
        checkResults=[];animIdx=0;checking=true;met.clauses.textContent='0';met.comply.textContent='0';met.deviate.textContent='0';met.critical.textContent='0';
        log.add('Starting BERT semantic compliance check...','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        // Header
        ctx.fillStyle=colors.text;ctx.font='bold 11px JetBrains Mono';ctx.textAlign='center';
        ctx.fillText('PROJECT SPEC',W*0.25,20);ctx.fillText('SIM',W*0.52,20);ctx.fillText('IS CODE REQUIREMENT',W*0.78,20);
        ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(10,28);ctx.lineTo(W-10,28);ctx.stroke();

        // Check results
        const lineH=40;let comply=0,deviate=0,critical=0;
        checkResults.forEach((r,i)=>{const y=35+i*lineH;
            const bgColor=r.status==='PASS'?'rgba(34,197,94,0.05)':r.status==='FAIL'?'rgba(239,68,68,0.06)':'rgba(245,158,11,0.05)';
            ctx.fillStyle=bgColor;ctx.fillRect(10,y,W-20,lineH-5);

            // Spec text
            ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';ctx.textAlign='left';
            ctx.fillText(r.spec,15,y+15);

            // Similarity badge
            const simColor=r.sim>0.9?colors.green:r.sim>0.7?colors.amber:colors.red;
            ctx.fillStyle=simColor+'30';ctx.fillRect(W*0.48,y+3,45,20);
            ctx.fillStyle=simColor;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='center';
            ctx.fillText(Math.round(r.sim*100)+'%',W*0.505,y+16);

            // Code text
            ctx.fillStyle=colors.cyan;ctx.font='9px JetBrains Mono';ctx.textAlign='left';
            ctx.fillText(r.code,W*0.55,y+15);

            // Status badge
            const statusColor=r.status==='PASS'?colors.green:r.status==='FAIL'?colors.red:colors.amber;
            ctx.fillStyle=statusColor;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='right';
            ctx.fillText(r.status,W-20,y+15);

            // Severity indicator
            if(r.severity==='critical'){const t=Date.now()*0.005;ctx.fillStyle=colors.red+Math.floor((Math.sin(t)+1)*40).toString(16).padStart(2,'0');ctx.beginPath();ctx.arc(W-45,y+12,4,0,Math.PI*2);ctx.fill();}

            if(r.status==='PASS')comply++;else{deviate++;if(r.severity==='critical')critical++;}
        });

        // Animate checking
        if(checking&&animIdx<checks.length){
            if(Date.now()%300<50){checkResults.push(checks[animIdx]);animIdx++;
                met.clauses.textContent=checkResults.length;
                const c=checkResults.filter(r=>r.status==='PASS').length;const d=checkResults.length-c;const cr=checkResults.filter(r=>r.severity==='critical').length;
                met.comply.textContent=c;met.comply.style.color=colors.green;met.deviate.textContent=d;met.deviate.style.color=d>0?colors.red:colors.green;
                met.critical.textContent=cr;met.critical.style.color=cr>0?colors.red:colors.green;
                met.score.textContent=Math.round(c/checkResults.length*100)+'%';
                met.time.textContent=Math.floor(rand(50,200));
                log.add('Checked: '+checks[animIdx-1].spec.substring(0,40)+'... → '+checks[animIdx-1].status,'ok');
            }
            if(animIdx>=checks.length){checking=false;log.add('Compliance check complete: '+met.score.textContent+' compliant','ok');}
        }
        // Summary bar (bottom)
        if(checkResults.length){
            const barY=H-25;const passW=(checkResults.filter(r=>r.status==='PASS').length/checkResults.length)*(W-40);
            const failW=(checkResults.filter(r=>r.status==='FAIL').length/checkResults.length)*(W-40);
            const warnW=(checkResults.filter(r=>r.status==='WARN').length/checkResults.length)*(W-40);
            ctx.fillStyle=colors.green+'40';ctx.fillRect(20,barY,passW,15);
            ctx.fillStyle=colors.red+'40';ctx.fillRect(20+passW,barY,failW,15);
            ctx.fillStyle=colors.amber+'40';ctx.fillRect(20+passW+failW,barY,warnW,15);
        }
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-play"></i> Check Compliance','accent',()=>{startCheck();});
    addBtn(br,'<i class="fa-solid fa-forward"></i> Show All','',()=>{checkResults=[...checks];animIdx=checks.length;checking=false;met.clauses.textContent=checks.length;const c=checks.filter(r=>r.status==='PASS').length;met.comply.textContent=c;met.deviate.textContent=checks.length-c;met.score.textContent=Math.round(c/checks.length*100)+'%';met.critical.textContent=checks.filter(r=>r.severity==='critical').length;});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{checkResults=[];animIdx=0;checking=false;});
    ca.appendChild(br);
    addTabs(sp,['BERT Similarity','Compliance','Standards'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>BERT Semantic Similarity</strong><br><br>1. Encode project spec clause → vector<br>2. Encode IS code requirement → vector<br>3. Cosine similarity = compliance measure<br><br>• >90%: Likely compliant<br>• 70-90%: Review needed<br>• <70%: Probable deviation<br><br>Fine-tuned on 5000 spec-code pairs.',
        '<strong>Compliance Check Results</strong><br><br>• <span style="color:'+colors.green+'">PASS</span>: Spec meets/exceeds IS code<br>• <span style="color:'+colors.amber+'">WARN</span>: Marginal, needs review<br>• <span style="color:'+colors.red+'">FAIL</span>: Non-compliant deviation<br><br>Critical deviations flagged with pulsing dot.<br>Structural safety items prioritized.',
        '<strong>Referenced Standards</strong><br><br>• IS 456:2000 — Concrete design<br>• IS 13920 — Ductile detailing<br>• IS 1893:2016 — Seismic design<br>• IS 800:2007 — Steel design<br>• IRC codes — Bridge design<br>• NBC 2016 — Building code'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Spec Reviewer</strong> — Click "Check Compliance" to see BERT compare specs against IS codes.'}));
    draw();
}

/* ================================================================
   DEMO 5: SITE COMMUNICATION ASSISTANT — message translation
   ================================================================ */
function buildSiteComm(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-language"></i> Site Communication Assistant'}));
    addInfo(sp,'<strong>LLM</strong> translates technical site instructions between engineers, supervisors, and workers. Handles Hindi-English code-switching with technical term preservation.');
    const met=addMetrics(sp,[{id:'msgs',val:'0',label:'Messages'},{id:'lang',val:'—',label:'Language'},{id:'terms',val:'0',label:'Tech Terms'},{id:'accuracy',val:'—',label:'Translation Acc.'},{id:'tone',val:'—',label:'Formality'},{id:'tokens',val:'0',label:'Tokens'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.purple);
    let messages=[],typing=false,charPos=0,currentMsg=null;
    const conversations=[
        {role:'Engineer',msg:'Column C3 shows 0.5mm crack at beam-column junction. Apply epoxy injection per IS 15988. Ensure crack width monitoring continues.',lang:'English',tone:'Formal',terms:['epoxy injection','IS 15988','crack width','beam-column junction']},
        {role:'LLM Translation',msg:'Column C3 mein beam-column joint par 0.5mm crack hai. IS 15988 ke mutabik epoxy injection lagana hai. Crack width monitoring jaari rakhna.',lang:'Hinglish',tone:'Informal',terms:['epoxy injection','IS 15988','crack width']},
        {role:'Supervisor',msg:'Shuttering for Level-3 slab ready. RCC checklist needed before pour. Bar bending schedule verified by site engineer.',lang:'English',tone:'Semi-Formal',terms:['shuttering','RCC checklist','bar bending schedule','pour']},
        {role:'LLM Translation',msg:'Level-3 slab ka shuttering tayyar hai. Pour se pehle RCC checklist chahiye. Bar bending schedule site engineer ne verify kiya hai.',lang:'Hinglish',tone:'Informal',terms:['shuttering','RCC checklist','bar bending schedule','pour']},
        {role:'Safety Officer',msg:'ALERT: Excavation depth exceeds 1.5m at Grid F4. Install shoring immediately per IS 3764. No worker to enter unsupported trench.',lang:'English',tone:'Urgent',terms:['shoring','IS 3764','excavation','unsupported trench']},
        {role:'LLM Translation',msg:'KHATARNAK: Grid F4 par khudai 1.5m se zyada ho gayi. Turant IS 3764 ke mutabik shoring lagao. Bina support ke koi mazdoor nahi utrega.',lang:'Hinglish',tone:'Urgent',terms:['shoring','IS 3764','khudai']}
    ];
    let msgIdx=0;

    function sendNext(){
        if(msgIdx>=conversations.length)return;
        currentMsg=conversations[msgIdx];typing=true;charPos=0;msgIdx++;
        log.add(currentMsg.role+' → '+currentMsg.lang,'info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        // Chat display
        let y=15;
        messages.forEach((msg,i)=>{const isTranslation=msg.role.includes('LLM');const bgColor=isTranslation?'rgba(168,85,247,0.08)':'rgba(14,165,233,0.08)';const accentColor=isTranslation?colors.purple:colors.cyan;
            const maxW=W*0.8;const lineH=14;const words=msg.msg.split(' ');let lines=[''];
            words.forEach(word=>{const test=lines[lines.length-1]+word+' ';if(test.length>60){lines.push(word+' ');}else{lines[lines.length-1]=test;}});
            const msgH=lines.length*lineH+30;const mx=isTranslation?W-maxW-10:10;
            ctx.fillStyle=bgColor;ctx.strokeStyle=accentColor+'30';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(mx,y,maxW,msgH,6);ctx.fill();ctx.stroke();
            // Role badge
            ctx.fillStyle=accentColor;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';ctx.fillText(msg.role+' ['+msg.lang+']',mx+10,y+14);
            // Tone badge
            if(msg.tone==='Urgent'){ctx.fillStyle=colors.red+'30';ctx.fillRect(mx+maxW-60,y+4,55,14);ctx.fillStyle=colors.red;ctx.font='bold 8px JetBrains Mono';ctx.fillText('URGENT',mx+maxW-55,y+13);}
            // Message text
            ctx.fillStyle=colors.text;ctx.font='10px JetBrains Mono';
            lines.forEach((line,li)=>{ctx.fillText(line,mx+10,y+28+li*lineH);});
            // Highlighted terms
            if(msg.terms){msg.terms.forEach(term=>{const termLower=term.toLowerCase();lines.forEach((line,li)=>{if(line.toLowerCase().includes(termLower)){const idx=line.toLowerCase().indexOf(termLower);const before=line.substring(0,idx);const tx=mx+10+ctx.measureText(before).width;const tw=ctx.measureText(term).width;ctx.fillStyle=colors.amber+'15';ctx.fillRect(tx,y+17+li*lineH,tw,14);}});});}
            y+=msgH+8;
        });

        // Typing animation
        if(typing&&currentMsg){
            const displayText=currentMsg.msg.substring(0,charPos);const isTranslation=currentMsg.role.includes('LLM');
            const bgColor=isTranslation?'rgba(168,85,247,0.08)':'rgba(14,165,233,0.08)';const accentColor=isTranslation?colors.purple:colors.cyan;
            const maxW=W*0.8;const mx=isTranslation?W-maxW-10:10;
            const words=displayText.split(' ');let lines=[''];words.forEach(word=>{const test=lines[lines.length-1]+word+' ';if(test.length>60)lines.push(word+' ');else lines[lines.length-1]=test;});
            const msgH=lines.length*14+30;
            ctx.fillStyle=bgColor;ctx.strokeStyle=accentColor+'30';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(mx,y,maxW,msgH,6);ctx.fill();ctx.stroke();
            ctx.fillStyle=accentColor;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='left';ctx.fillText(currentMsg.role+' ['+currentMsg.lang+']',mx+10,y+14);
            ctx.fillStyle=colors.text;ctx.font='10px JetBrains Mono';lines.forEach((line,li)=>{ctx.fillText(line,mx+10,y+28+li*14);});
            // Cursor
            if(Math.floor(Date.now()/500)%2===0){const lastLine=lines[lines.length-1]||'';ctx.fillStyle=accentColor;ctx.fillRect(mx+10+ctx.measureText(lastLine).width,y+17+(lines.length-1)*14,2,12);}
            charPos+=2;met.tokens.textContent=Math.floor(charPos/4);
            if(charPos>=currentMsg.msg.length){typing=false;messages.push(currentMsg);met.msgs.textContent=messages.length;met.lang.textContent=currentMsg.lang;met.terms.textContent=currentMsg.terms.length;met.accuracy.textContent=Math.floor(rand(92,98))+'%';met.tone.textContent=currentMsg.tone;log.add('Message delivered: '+currentMsg.role,'ok');}
        }
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-paper-plane"></i> Send Next','accent',()=>{sendNext();});
    addBtn(br,'<i class="fa-solid fa-forward"></i> All Messages','',()=>{messages=[...conversations];msgIdx=conversations.length;typing=false;met.msgs.textContent=messages.length;});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{messages=[];msgIdx=0;typing=false;met.msgs.textContent='0';});
    ca.appendChild(br);
    addTabs(sp,['Translation','Code-Switching','Safety'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>LLM Translation Pipeline</strong><br><br>1. Detect source language/register<br>2. Extract technical terms (preserve)<br>3. Translate with context awareness<br>4. Adapt formality level for audience<br>5. Validate technical accuracy<br><br>Supports: English ↔ Hindi ↔ Hinglish<br>Technical term preservation: 98%.',
        '<strong>Hindi-English Code-Switching</strong><br><br>Construction sites use mixed language:<br>• Technical terms stay in English<br>  (shuttering, RCC, pour, curing)<br>• Instructions in local language<br>• IS code references in English<br><br>LLM preserves code-switched terms<br>while ensuring comprehension.',
        '<strong>Safety Communication</strong><br><br>Critical for multi-lingual sites:<br>• Emergency alerts in all languages<br>• Safety briefing translation<br>• Toolbox talk generation<br>• Incident report translation<br>• IS 3764: Safety in excavation<br>• IS 7969: Safety on construction sites'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Site Comm</strong> — Click "Send Next" to see engineer ↔ worker message translation with term highlighting.'}));
    draw();
}

/* ================================================================
   DEMO 6: GEO NARRATIVE GENERATOR — progressive text + profile
   ================================================================ */
function buildGeoNarration(d){
    const{ctx,W,H,sidePanel:sp,ctrlArea:ca,overlay:ov}=d;
    sp.appendChild(Object.assign(CE('div','app-demo-panel__title'),{innerHTML:'<i class="fa-solid fa-mountain"></i> Geotechnical Narrative AI'}));
    addInfo(sp,'<strong>Fine-tuned GPT</strong> generates geotechnical narratives from borehole data. Watch the soil profile build alongside the AI-written description.');
    const met=addMetrics(sp,[{id:'depth',val:'0',label:'Depth (m)'},{id:'layers',val:'0',label:'Layers'},{id:'tokens',val:'0',label:'Tokens'},{id:'bearing',val:'—',label:'Est. Bearing'},{id:'gwl',val:'—',label:'GW Level'},{id:'class',val:'—',label:'Site Class'}]);
    const log=addLog(sp);
    let particles=makeParticles(8,W,H,colors.amber);
    let layers=[],narrative='',charPos=0,generating=false;
    const profiles=[
        {layers:[{name:'Fill',depth:1.5,color:'#5a4a3a',spt:5,desc:'Loose brown fill with brick fragments'},{name:'Silty Clay',depth:4,color:'#6a5a40',spt:8,desc:'Medium stiff grey-brown silty clay, CI-CH'},{name:'Fine Sand',depth:8,color:'#8a7a50',spt:22,desc:'Medium dense fine sand with silt, SP-SM'},{name:'Stiff Clay',depth:12,color:'#4a3a2a',spt:18,desc:'Stiff grey clay with kankar nodules, CH'},{name:'Weathered Rock',depth:15,color:'#7a7a8a',spt:50,desc:'Highly weathered sandstone, refusal at 15m'}],gwl:3.5,
        narrative:'GEOTECHNICAL NARRATIVE — BH-01\n\nThe subsurface exploration at BH-01 reveals a typical alluvial profile overlying weathered rock.\n\nThe top 1.5m comprises loose FILL material (N=5) with brick fragments, indicating previous construction activity. This layer is unsuitable for foundation support.\n\nUnderlying the fill, a 2.5m thick medium-stiff SILTY CLAY (CI-CH) layer extends to 4.0m depth (N=8). Moisture content ranges 28-35%. This layer will exhibit consolidation settlement under sustained loading.\n\nFrom 4.0m to 8.0m, FINE SAND (SP-SM) of medium density (N=22) provides better bearing characteristics. This layer is potentially liquefiable under seismic loading (Zone IV, IS 1893).\n\nA STIFF CLAY layer with kankar nodules (N=18) extends from 8.0m to 12.0m depth. The presence of kankar indicates a semi-arid depositional environment.\n\nWeathered SANDSTONE encountered at 12.0m, with refusal at 15.0m (N>50).\n\nGROUNDWATER encountered at 3.5m bgl.\n\nRECOMMENDATION: Pile foundation to weathered rock, or raft on sand layer with ground improvement.'},
        {layers:[{name:'Topsoil',depth:0.5,color:'#4a3a20',spt:2,desc:'Dark brown organic topsoil'},{name:'Marine Clay',depth:6,color:'#3a3a4a',spt:3,desc:'Very soft grey marine clay, CH'},{name:'Sandy Silt',depth:9,color:'#6a6a50',spt:12,desc:'Loose to medium sandy silt, ML'},{name:'Dense Sand',depth:14,color:'#7a7a40',spt:35,desc:'Dense coarse sand with gravel, SW-GW'},{name:'Hard Clay',depth:18,color:'#3a2a2a',spt:40,desc:'Very stiff to hard brown clay, CH'}],gwl:1.0,
        narrative:'GEOTECHNICAL NARRATIVE — BH-02 (Coastal Site)\n\nBH-02 reveals a challenging coastal profile requiring special foundation treatment.\n\nThin TOPSOIL (0.5m, N=2) overlies 5.5m of very soft MARINE CLAY (N=3, CH classification). This highly compressible layer (Cc=0.45, e0=1.8) will cause significant long-term consolidation settlement. Undrained shear strength estimated at 15 kPa — inadequate for shallow foundations.\n\nSANDY SILT (ML) from 6.0m to 9.0m (N=12) shows marginal improvement. Susceptible to piping under hydraulic gradient.\n\nDENSE SAND (SW-GW, N=35) from 9.0m to 14.0m provides excellent bearing capacity. Suitable founding level for piled foundations.\n\nVery stiff to hard CLAY at 14.0m+ (N=40) confirms competent bearing stratum.\n\nGROUNDWATER at 1.0m bgl — dewatering required for excavation.\n\nRECOMMENDATION: Driven piles to dense sand (9m+). Preloading with PVD for ground improvement if raft considered.'}
    ];
    let currentProfile=null;

    function startGeneration(idx){
        currentProfile=profiles[idx];layers=currentProfile.layers;narrative='';charPos=0;generating=true;
        met.layers.textContent=layers.length;met.gwl.textContent=currentProfile.gwl+'m';met.depth.textContent=layers[layers.length-1].depth;
        const maxSPT=Math.max(...layers.map(l=>l.spt));met.bearing.textContent=maxSPT>30?'High':maxSPT>15?'Medium':'Low';
        met.class.textContent=layers.some(l=>l.spt<5)?'D (Soft)':'C (Medium)';
        log.add('Starting narrative generation for '+layers.length+' layers...','info');
    }
    function draw(){
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
        drawParticles(ctx,particles,W,H);

        // Soil profile (left 30%)
        const profW=W*0.3;const pad={t:30,b:30};const profH=H-pad.t-pad.b;
        if(layers.length){
            const maxDepth=layers[layers.length-1].depth;
            ctx.fillStyle=colors.text;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='center';ctx.fillText('BOREHOLE LOG',profW/2,15);
            // Depth scale
            for(let d=0;d<=maxDepth;d+=2){const y=pad.t+(d/maxDepth)*profH;ctx.fillStyle=colors.muted;ctx.font='8px JetBrains Mono';ctx.textAlign='right';ctx.fillText(d+'m',25,y+3);ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(profW-10,y);ctx.stroke();}
            // Layers
            let prevDepth=0;layers.forEach(l=>{const y1=pad.t+(prevDepth/maxDepth)*profH;const y2=pad.t+(l.depth/maxDepth)*profH;
                ctx.fillStyle=l.color;ctx.fillRect(30,y1,80,y2-y1);ctx.strokeStyle='rgba(255,255,255,.15)';ctx.lineWidth=0.5;ctx.strokeRect(30,y1,80,y2-y1);
                // Label
                ctx.fillStyle=colors.text;ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText(l.name,115,y1+(y2-y1)/2+3);
                // SPT bar
                const sptW=l.spt/50*40;ctx.fillStyle=l.spt>30?colors.green:l.spt>15?colors.amber:colors.red;ctx.fillRect(115,y1+(y2-y1)/2+6,sptW,6);ctx.fillStyle=colors.muted;ctx.font='7px JetBrains Mono';ctx.fillText('N='+l.spt,115+sptW+3,y1+(y2-y1)/2+12);
                prevDepth=l.depth;
            });
            // GWL marker
            if(currentProfile){const gwlY=pad.t+(currentProfile.gwl/maxDepth)*profH;ctx.strokeStyle=colors.cyan;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(28,gwlY);ctx.lineTo(profW-10,gwlY);ctx.stroke();ctx.setLineDash([]);
                ctx.fillStyle=colors.cyan;ctx.font='8px JetBrains Mono';ctx.textAlign='left';ctx.fillText('GWL '+currentProfile.gwl+'m',115,gwlY-3);}
        }
        // Narrative (right 70%)
        const textX=profW+20;const textW=W-profW-30;
        ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(textX-5,5,textW+10,H-10);ctx.strokeStyle=colors.border;ctx.lineWidth=0.5;ctx.strokeRect(textX-5,5,textW+10,H-10);
        ctx.fillStyle=colors.teal;ctx.font='bold 10px JetBrains Mono';ctx.textAlign='left';ctx.fillText('AI NARRATIVE',textX,20);

        if(generating&&currentProfile){
            const displayText=currentProfile.narrative.substring(0,charPos);
            ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';
            const lines=displayText.split('\n');let ly=38;
            lines.forEach(line=>{
                // Syntax highlighting
                if(line.includes('RECOMMENDATION')||line.includes('NARRATIVE')){ctx.fillStyle=colors.teal;ctx.font='bold 10px JetBrains Mono';}
                else if(line.includes('GROUNDWATER')){ctx.fillStyle=colors.cyan;ctx.font='bold 9px JetBrains Mono';}
                else if(line.includes('IS ')){ctx.fillStyle=colors.amber;ctx.font='9px JetBrains Mono';}
                else{ctx.fillStyle=colors.text;ctx.font='9px JetBrains Mono';}
                // Word wrap
                const words=line.split(' ');let wrapLine='';
                words.forEach(word=>{const test=wrapLine+word+' ';if(ctx.measureText(test).width>textW-20){ctx.fillText(wrapLine,textX,ly);ly+=13;wrapLine=word+' ';}else{wrapLine=test;}});
                if(wrapLine){ctx.fillText(wrapLine,textX,ly);ly+=13;}
                if(line==='')ly+=5;
            });
            // Cursor
            if(Math.floor(Date.now()/500)%2===0){ctx.fillStyle=colors.teal;ctx.fillRect(textX,ly-10,2,12);}
            charPos+=3;met.tokens.textContent=Math.floor(charPos/4);
            if(charPos>=currentProfile.narrative.length){generating=false;log.add('Narrative generation complete','ok');}
        }
        ov._raf=requestAnimationFrame(draw);
    }
    const br=CE('div','app-demo-btn-row');
    addBtn(br,'<i class="fa-solid fa-mountain"></i> Alluvial Site','accent',()=>{startGeneration(0);});
    addBtn(br,'<i class="fa-solid fa-water"></i> Coastal Site','',()=>{startGeneration(1);});
    addBtn(br,'<i class="fa-solid fa-trash"></i> Clear','danger',()=>{layers=[];narrative='';generating=false;currentProfile=null;});
    ca.appendChild(br);
    addSlider(ca,'Temperature',0,1,0.4,0.1,v=>{});
    addTabs(sp,['Model','Training Data','Applications'],idx=>{const lc=sp.querySelector('.lc');if(!lc)return;lc.innerHTML=[
        '<strong>Fine-tuned GPT for Geotech</strong><br><br>Base: GPT-3.5-Turbo<br>Fine-tuning: 2000 borehole log + narrative pairs<br>Input: structured JSON (layers, SPT, GWL)<br>Output: professional geotechnical narrative<br><br>BLEU score: 0.72 vs human expert<br>Technical accuracy: 94% (reviewed by PE).',
        '<strong>Training Data Sources</strong><br><br>• CPWD soil investigation reports<br>• NHAI project SI reports<br>• Metro rail geotechnical reports<br>• Dam foundation investigation data<br>• Research borehole databases<br><br>Augmented with IS 1892 terminology<br>and standard descriptive phrases.',
        '<strong>Engineering Applications</strong><br><br>• Rapid report generation for routine SI<br>• Standardize narrative quality across projects<br>• Junior engineer training tool<br>• Multi-language report generation<br>• Integration with gINT/AGS data formats<br>• Quality control: AI vs expert comparison'
    ][idx];});
    sp.appendChild(Object.assign(CE('div','app-demo-info lc'),{innerHTML:'<strong>Geo Narrator</strong> — Click a site type to see AI generate a narrative alongside the borehole profile.'}));
    draw();
}

/* ── Wire up cards ── */
const demos=[
    {title:'Inspection Report Generator',icon:'fa-file-lines',build:buildInspectionReport},
    {title:'Building Code Q&A',icon:'fa-comments',build:buildCodeQA},
    {title:'Hydrology Log Summarizer',icon:'fa-water',build:buildHydrologyLog},
    {title:'Spec Review Assistant',icon:'fa-file-contract',build:buildSpecReview},
    {title:'Site Communication',icon:'fa-language',build:buildSiteComm},
    {title:'Geotechnical Narrative',icon:'fa-mountain',build:buildGeoNarration}
];
function init(){
    const cards=document.querySelectorAll('.ch5-app-grid .ch5-app-card');
    cards.forEach((card,i)=>{if(i<demos.length){card.style.cursor='pointer';card.addEventListener('click',()=>openOverlay(demos[i].title,demos[i].icon,demos[i].build));
        const badge=CE('div');badge.style.cssText='margin-top:8px;font-size:.72rem;color:#00d4aa;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:center';badge.innerHTML='<i class="fa-solid fa-hand-pointer"></i> Click for Interactive Demo';card.appendChild(badge);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
