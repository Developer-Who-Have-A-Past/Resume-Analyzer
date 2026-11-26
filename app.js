(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- sample content (clearly marked placeholders) ---------- */
const SAMPLE_SRC = `# Ashish Kumar
your.email@example.com | +91 90000 00000 | github.com/yourname | linkedin.com/in/yourname

## Summary
MCA student and frontend / full-stack developer who builds web apps with React and Next.js. Looking for a software trainee role where I can ship features and keep learning.

## Education
### IILM University | MCA | 2025 - 2027
- CGPA: 7.33
### IGNOU | BCA | 2020 - 2025
- CGPA: 6.66

## Skills
Frontend: ReactJS, Next.js, JavaScript, HTML5, CSS3
Languages: Java, C, C++
Databases: MySQL, MongoDB
Tools: Git, GitHub

## Projects
### AI-Powered Interior Designing System | Next.js, MySQL
- Built an interior designing system with AI suggestions using Next.js and MySQL.
- Responsible for building the web interface and database.
### Music Emotion Recognition | Python, TensorFlow, Librosa, Flask
- Developed a model that recognises emotion in music using audio features extracted with Librosa.
- Served the trained model through a Flask web app.
`;
const SAMPLE_JD = `Sample job description (replace with yours)

Software Trainee - Web Development

We are looking for a software trainee to join our product team. You will build and maintain responsive web applications using React and JavaScript, work with REST APIs, and write SQL queries against relational databases.

Requirements
- Good knowledge of JavaScript, HTML and CSS, plus React or a similar framework
- Familiarity with Node.js, REST APIs and Git
- Basic understanding of SQL and databases
- Exposure to TypeScript, Docker or AWS is a plus
- Knowledge of data structures and algorithms
- Strong communication and problem solving skills; comfortable working in an agile team
- You will write clean, tested code and take part in code reviews`;

/* ---------- state ---------- */
const ta = $('#src'), jdTa = $('#jd');
let tpl = 'classic', hist = [], lastVal = '', typingTimer = null, model = null;
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k,v); return true; } catch(e){ return false; } }
};
ta.value = store.get('rl_src') || SAMPLE_SRC;
jdTa.value = store.get('rl_jd') ?? SAMPLE_JD;
tpl = store.get('rl_tpl') || 'classic';
$('#tpl').value = tpl;
lastVal = ta.value;

/* ---------- parser ---------- */
const kindOf = t => {
  t = t.toLowerCase();
  if (/summar|objective|profile|about/.test(t)) return 'summary';
  if (/educat|academ/.test(t)) return 'education';
  if (/skill|technolog|tools/.test(t)) return 'skills';
  if (/experience|employment|work|intern/.test(t)) return 'experience';
  if (/project/.test(t)) return 'projects';
  if (/cert|course|licen/.test(t)) return 'certs';
  if (/achiev|award|honou?r|activit/.test(t)) return 'achievements';
  return 'other';
};
function headParts(s){
  const p = s.split('|').map(x => x.trim()).filter(x => x !== '');
  if (p.length <= 1) return {t:p[0]||'', m:'', d:''};
  if (p.length === 2) return {t:p[0], m:'', d:p[1]};
  return {t:p[0], m:p.slice(1,-1).join(' | '), d:p[p.length-1]};
}
function parse(src){
  const m = {name:'', nameLn:0, contact:[], sections:[]};
  let sec = null, ent = null;
  src.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\s+$/,'');
    if (!line.trim()) return;
    const ln = i + 1;
    if (/^#\s+/.test(line)) { m.name = line.replace(/^#\s+/,'').trim(); m.nameLn = ln; return; }
    if (/^##\s+/.test(line)) { const title = line.replace(/^##\s+/,'').trim(); sec = {title, kind:kindOf(title), items:[], ln}; m.sections.push(sec); ent = null; return; }
    if (!sec) { m.contact.push(...line.split('|').map(x => x.trim()).filter(Boolean)); return; }
    if (/^###\s+/.test(line)) { ent = {t:'entry', head:headParts(line.replace(/^###\s+/,'')), items:[], ln}; sec.items.push(ent); return; }
    const host = ent ? ent.items : sec.items;
    const b = line.match(/^\s*[-*\u2022]\s+(.*)$/);
    if (b) { host.push({t:'bullet', text:b[1].trim(), ln}); return; }
    const kv = line.match(/^([A-Za-z][\w &\/+.()-]{0,30}):\s+(.+)$/);
    if (kv) { host.push({t:'kv', k:kv[1], v:kv[2], ln}); return; }
    host.push({t:'text', text:line.trim(), ln});
  });
  return m;
}
const walk = (items, fn) => items.forEach(it => { fn(it); if (it.t === 'entry') walk(it.items, fn); });

/* ---------- paper rendering ---------- */
const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const plain = s => String(s).replace(/\*\*(.+?)\*\*/g, '$1');
function renderItems(items){
  let h = '', ul = false;
  const close = () => { if (ul) { h += '</ul>'; ul = false; } };
  items.forEach(it => {
    if (it.t === 'bullet') { if (!ul) { h += '<ul>'; ul = true; } h += `<li>${inl(it.text)}</li>`; return; }
    close();
    if (it.t === 'kv') h += `<p class="kv"><b>${inl(it.k)}:</b> ${inl(it.v)}</p>`;
    else if (it.t === 'text') h += `<p>${inl(it.text)}</p>`;
    else if (it.t === 'entry') {
      const e = it.head;
      h += `<div class="entry"><div class="eh"><span>${inl(e.t)}</span>${e.d ? `<span class="r">${inl(e.d)}</span>` : ''}</div>${e.m ? `<div class="meta">${inl(e.m)}</div>` : ''}${renderItems(it.items)}</div>`;
    }
  });
  close();
  return h;
}
function renderPaper(m){
  let h = `<h1>${inl(m.name || 'Your Name')}</h1>`;
  if (m.contact.length) h += `<div class="contact">${m.contact.map(c => `<span>${inl(c)}</span>`).join('')}</div>`;
  m.sections.forEach(s => { h += `<h2>${inl(s.title)}</h2>${renderItems(s.items)}`; });
  return h;
}
const PAGE_H = 1123, PAGE_W = 794;
function fitPaper(){
  const paper = $('#paper'), box = $('#sheetbox'), sc = $('#scroll');
  const avail = Math.max(240, sc.clientWidth - 32);
  const s = Math.min(1, avail / PAGE_W);
  const h = paper.offsetHeight;
  paper.style.transform = `scale(${s})`;
  box.style.width = (PAGE_W * s) + 'px';
  box.style.height = (h * s) + 'px';
  const pages = Math.max(1, Math.ceil((h - 2) / PAGE_H));
  const chip = $('#pages');
  chip.textContent = pages === 1 ? '1 page' : pages + ' pages';
  chip.classList.toggle('warn', pages > 1);
  chip.title = pages > 1 ? 'Most recruiters expect one page for early-career resumes' : 'Fits on one A4 page';
  let b = '';
  for (let k = 1; k < pages; k++) b += `<div style="position:absolute;left:0;right:0;top:${k*PAGE_H}px;border-top:1px dashed #d9534f"></div>`;
  $('#pbks').innerHTML = b;
  return pages;
}
function renderPreview(){
  model = parse(ta.value);
  $('#paperBody').innerHTML = renderPaper(model);
  $('#paper').className = 'paper ' + tpl;
  const pages = fitPaper();
  if (!$('#tex').hidden) $('#tex').textContent = toLatex(model);
  return pages;
}

/* ---------- LaTeX ---------- */
const TEXMAP = {'\\':'\\textbackslash{}','&':'\\&','%':'\\%','$':'\\$','#':'\\#','_':'\\_','{':'\\{','}':'\\}','~':'\\textasciitilde{}','^':'\\textasciicircum{}'};
const texEsc = s => s.replace(/[\\&%$#_{}~^]/g, c => TEXMAP[c]);
const texIn = s => s.split(/\*\*(.+?)\*\*/g).map((p,i) => i % 2 ? '\\textbf{' + texEsc(p) + '}' : texEsc(p)).join('');
function texItems(items){
  let o = '', ul = false;
  const close = () => { if (ul) { o += '\\end{itemize}\n'; ul = false; } };
  items.forEach(it => {
    if (it.t === 'bullet') { if (!ul) { o += '\\begin{itemize}[leftmargin=1.3em,itemsep=1pt,topsep=2pt,parsep=0pt]\n'; ul = true; } o += '  \\item ' + texIn(it.text) + '\n'; return; }
    close();
    if (it.t === 'kv') o += '\\textbf{' + texEsc(it.k) + ':} ' + texIn(it.v) + '\\\\\n';
    else if (it.t === 'text') o += texIn(it.text) + '\n\n';
    else if (it.t === 'entry') {
      const e = it.head;
      o += '\\vspace{4pt}\\noindent\\textbf{' + texIn(e.t) + '}' + (e.d ? '\\hfill ' + texIn(e.d) : '') + '\\\\\n';
      if (e.m) o += '\\textit{' + texIn(e.m) + '}\n';
      o += texItems(it.items);
    }
  });
  close();
  return o;
}
function toLatex(m){
  let o = '\\documentclass[10pt,a4paper]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n\\usepackage[margin=0.7in]{geometry}\n\\usepackage{enumitem}\n\\usepackage{titlesec}\n\\usepackage[hidelinks]{hyperref}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0pt}\n\\titleformat{\\section}{\\normalsize\\bfseries\\scshape}{}{0em}{}[\\titlerule]\n\\titlespacing*{\\section}{0pt}{10pt}{5pt}\n\n\\begin{document}\n\n';
  o += '\\begin{center}\n  {\\LARGE\\bfseries ' + texIn(m.name || 'Your Name') + '}\\\\[4pt]\n  ' + m.contact.map(texIn).join(' $|$ ') + '\n\\end{center}\n\n';
  m.sections.forEach(s => { o += '\\section*{' + texIn(s.title) + '}\n' + texItems(s.items) + '\n'; });
  return o + '\\end{document}\n';
}

/* ---------- PDF (real text, ATS friendly) ---------- */
const pdfSan = s => String(s).replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2022]/g,'');
function buildPDF(m){
  if (!window.jspdf) throw new Error('The PDF library did not load. Check your connection and reload.');
  const doc = new window.jspdf.jsPDF({unit:'pt', format:'a4'});
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = tpl === 'compact' ? 34 : 44, CW = W - 2*M;
  const fam = tpl === 'classic' ? 'times' : 'helvetica', bs = tpl === 'compact' ? 9 : 10, lh = 1.28;
  let y = M;
  const need = h => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const S = s => pdfSan(plain(s));
  function para(t, o = {}){
    const size = o.size || bs, x = o.x ?? M, w = o.w ?? CW;
    doc.setFont(fam, o.style || 'normal'); doc.setFontSize(size);
    doc.splitTextToSize(S(t), w).forEach(l => {
      need(size*lh);
      if (o.align === 'center') doc.text(l, W/2, y + size*.85, {align:'center'}); else doc.text(l, x, y + size*.85);
      y += size*lh;
    });
    y += o.gap || 0;
  }
  function items(list){
    list.forEach(it => {
      if (it.t === 'bullet') {
        doc.setFont(fam,'normal'); doc.setFontSize(bs);
        const ls = doc.splitTextToSize(S(it.text), CW - 16);
        ls.forEach((l,i) => { need(bs*lh); if (i === 0) doc.text('\u2022', M + 4, y + bs*.85); doc.text(l, M + 14, y + bs*.85); y += bs*lh; });
      } else if (it.t === 'kv') {
        doc.setFont(fam,'bold'); doc.setFontSize(bs);
        const label = S(it.k) + ': ', lw = doc.getTextWidth(label);
        doc.setFont(fam,'normal');
        const ls = doc.splitTextToSize(S(it.v), CW - lw);
        ls.forEach((l,i) => { need(bs*lh); if (i === 0) { doc.setFont(fam,'bold'); doc.text(label, M, y + bs*.85); doc.setFont(fam,'normal'); } doc.text(l, M + lw, y + bs*.85); y += bs*lh; });
      } else if (it.t === 'text') para(it.text, {gap:2});
      else if (it.t === 'entry') {
        const e = it.head; y += 3;
        doc.setFont(fam,'normal'); doc.setFontSize(bs);
        const rw = e.d ? doc.getTextWidth(S(e.d)) + 12 : 0;
        doc.setFont(fam,'bold');
        const ls = doc.splitTextToSize(S(e.t), CW - rw);
        ls.forEach((l,i) => { need(bs*lh); doc.setFont(fam,'bold'); doc.text(l, M, y + bs*.85); if (i === 0 && e.d) { doc.setFont(fam,'normal'); doc.text(S(e.d), W - M, y + bs*.85, {align:'right'}); } y += bs*lh; });
        if (e.m) para(e.m, {style:'italic'});
        items(it.items);
      }
    });
  }
  para(m.name || 'Your Name', {size:tpl === 'compact' ? 18 : 21, style:'bold', align:'center', gap:2});
  if (m.contact.length) para(m.contact.join('  |  '), {size:bs - .5, align:'center', gap:4});
  m.sections.forEach(s => {
    y += 7; need(30);
    doc.setFont(fam,'bold'); doc.setFontSize(bs + .5);
    doc.text(S(s.title).toUpperCase(), M, y + bs*.85); y += bs*lh + 1;
    doc.setLineWidth(.6); doc.line(M, y, W - M, y); y += 5;
    items(s.items);
  });
  return doc.output('arraybuffer');
}

/* ---------- local analyser ---------- */
const SOFT = ['communication','problem solving','teamwork','leadership','time management','analytical','collaboration'];
const TECH = ['javascript','typescript','react','next.js','node.js','vue.js','angular','svelte','redux','html','css','sass','tailwind css','bootstrap','jquery','java','python','c++','c#','php','ruby','kotlin','swift','sql','mysql','postgresql','mongodb','redis','sqlite','firebase','nosql','graphql','rest api','aws','azure','gcp','docker','kubernetes','git','github','gitlab','ci/cd','jenkins','linux','devops','agile','scrum','jira','figma','postman','flask','django','spring boot','spring','hibernate','fastapi','tensorflow','pytorch','pandas','numpy','scikit-learn','machine learning','deep learning','nlp','data structures','algorithms','oop','microservices','unit testing','jest','junit','selenium','tdd','responsive design','websocket','jwt','oauth','android','flutter','react native','salesforce','power bi','tableau','excel','code review'];
const SYN = {'reactjs':'react','react.js':'react','nextjs':'next.js','nodejs':'node.js','node':'node.js','expressjs':'express.js','vuejs':'vue.js','vue':'vue.js','js':'javascript','ts':'typescript','html5':'html','css3':'css','mongo':'mongodb','postgres':'postgresql','k8s':'kubernetes','restful api':'rest api','restful apis':'rest api','rest apis':'rest api','cicd':'ci/cd','object oriented programming':'oop','object oriented':'oop','dsa':'data structures','tailwind':'tailwind css','amazon web services':'aws','google cloud':'gcp','ml':'machine learning','scikit learn':'scikit-learn','code reviews':'code review','problem-solving':'problem solving'};
const PRETTY = {'next.js':'Next.js','node.js':'Node.js','vue.js':'Vue.js','express.js':'Express.js','javascript':'JavaScript','typescript':'TypeScript','mysql':'MySQL','mongodb':'MongoDB','postgresql':'PostgreSQL','github':'GitHub','gitlab':'GitLab','graphql':'GraphQL','tensorflow':'TensorFlow','pytorch':'PyTorch','devops':'DevOps','nosql':'NoSQL','rest api':'REST API','ci/cd':'CI/CD','oop':'OOP','nlp':'NLP','tdd':'TDD','jwt':'JWT','aws':'AWS','gcp':'GCP','sql':'SQL','html':'HTML','css':'CSS','php':'PHP','fastapi':'FastAPI','scikit-learn':'scikit-learn','power bi':'Power BI','react native':'React Native','jquery':'jQuery','sqlite':'SQLite','junit':'JUnit','oauth':'OAuth','websocket':'WebSocket'};
const pretty = t => PRETTY[t] || t.replace(/\b[a-z]/g, c => c.toUpperCase());
const normTxt = s => s.toLowerCase().replace(/(\w)-(\w)/g, '$1 $2');
const termKeys = [...new Set([...TECH, ...SOFT, ...Object.keys(SYN)].map(normTxt))].sort((a,b) => b.length - a.length);
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
const TERM_RE = new RegExp('(^|[^\\w.+#/])(' + termKeys.map(reEsc).join('|') + ')(?![\\w+#]|\\.\\w)', 'gi');
function termsIn(text){
  const out = new Map(), t = normTxt(text);
  for (const m of t.matchAll(TERM_RE)) {
    const raw = m[2].toLowerCase();
    const key = SYN[raw] || SYN[raw.replace(/ /g,'-')] || raw;
    out.set(key, (out.get(key) || 0) + 1);
  }
  return out;
}
const STOP = new Set('a,about,above,after,all,also,an,and,any,are,as,at,be,because,been,before,being,between,both,but,by,can,candidate,company,could,do,does,each,etc,experience,for,from,good,great,have,has,help,highly,how,if,in,including,into,is,it,its,job,join,knowledge,like,looking,may,more,most,must,need,new,not,of,on,one,or,other,our,out,over,preferred,required,requirements,responsibilities,role,should,skills,strong,such,team,than,that,the,their,them,then,there,these,they,this,through,under,understanding,use,using,web,well,what,when,where,which,while,who,will,with,within,work,working,you,your,years,year,ability,able,across,build,building,develop,development,ensure,plus,related,based,high,make,part,responsible,support,time,ideal,opportunity,degree,bachelor,master,equivalent,least,minimum,qualifications,sample,replace,description,basic,comfortable,familiarity,exposure,against,write,maintain,take,trainee,software,product,applications,application,clean,queries,relational,similar,framework,databases,database'.split(','));
const stem = w => w.replace(/(ing|ed|es|s)$/,'');
const ACTION = new Set('achieved,analyzed,analysed,architected,automated,built,collaborated,configured,created,debugged,delivered,deployed,designed,developed,directed,documented,drove,engineered,enhanced,established,executed,implemented,improved,increased,integrated,launched,led,maintained,managed,migrated,modernized,optimized,organized,owned,performed,pioneered,planned,presented,produced,programmed,reduced,refactored,released,researched,resolved,reviewed,scaled,shipped,simplified,solved,streamlined,tested,trained,tuned,updated,wrote,served,evaluated,extracted,applied,processed,constructed,utilized,leveraged,recognized,recognised,designed'.split(','));
const WEAK = /\b(responsible for|worked on|helped( to)?|assisted|duties|tasks? included|various|etc\.?|handled|involved in|participated in)\b/i;

function analyze(src, jd, pages){
  const m = parse(src);
  const all = src.replace(/^#+\s+/gm,' ');
  const issues = [], words = (all.match(/\b[\w'+#.-]+\b/g) || []).length;
  // keywords
  let kw = null;
  const jdT = jd.trim();
  if (jdT.length > 40) {
    const jt = termsIn(jdT), rt = termsIn(all);
    if (['mysql','postgresql','sqlite'].some(k => rt.has(k))) rt.set('sql', 1);
    const jtWords = new Set([...jt.keys()].join(' ').split(/[^a-z]+/));
    const matched = [], missing = [];
    [...jt.entries()].sort((a,b) => b[1] - a[1]).forEach(([k,c]) => (rt.has(k) ? matched : missing).push({k, c}));
    const jdWords = new Map();
    (normTxt(jdT).match(/[a-z][a-z+#]{3,}/g) || []).forEach(w => { if (!STOP.has(w) && !jtWords.has(w) && !termKeys.includes(w) && !jt.has(w)) jdWords.set(w, (jdWords.get(w)||0) + 1); });
    const resStems = new Set((normTxt(all).match(/[a-z][a-z+#]{2,}/g) || []).map(stem));
    const other = [...jdWords.entries()].filter(([,c]) => c >= 2).sort((a,b) => b[1] - a[1]).slice(0,8).map(([k]) => ({k, hit:resStems.has(stem(k))}));
    const tw = matched.reduce((a,x) => a + 2, 0), tt = (matched.length + missing.length) * 2;
    const ow = other.filter(x => x.hit).length, ot = other.length;
    const pct = (tt + ot) ? Math.round(100 * (tw + ow) / (tt + ot)) : 0;
    kw = {pct, matched, missing, other};
    if (missing.length) issues.push({sev: missing.length > 3 ? 'bad' : 'warn', text:`${missing.length} keyword${missing.length>1?'s':''} from the job description are missing: ${missing.slice(0,5).map(x => pretty(x.k)).join(', ')}${missing.length>5?'...':''}`});
  }
  // sections
  const kinds = new Set(m.sections.map(s => s.kind));
  let sPts = 0, sMax = 0;
  const chk = (ok, good, bad, sev = 'bad', w = 1, ln) => { sMax += w; if (ok) { sPts += w; } else issues.push({sev, text:bad, ln}); };
  chk(!!m.name, '', 'Add your name as "# Your Name" on the first line.', 'bad', 1, 1);
  chk(kinds.has('education'), '', 'Add an Education section.');
  chk(kinds.has('skills'), '', 'Add a Skills section. Recruiters and ATS scan it first.');
  chk(kinds.has('experience') || kinds.has('projects'), '', 'Add an Experience, Internship or Projects section.');
  chk(kinds.has('summary'), '', 'Add a 2 to 3 line Summary tailored to the role.', 'warn', .6);
  // bullets
  const bl = [];
  m.sections.forEach(s => { if (!['skills','education','summary'].includes(s.kind)) walk(s.items, it => { if (it.t === 'bullet') bl.push(it); }); });
  let bSum = 0, noVerb = [], noNum = 0, longB = [], weak = [];
  bl.forEach(b => {
    const fw = b.text.replace(/^[^A-Za-z]+/,'').split(/\s+/)[0].toLowerCase();
    const isW = WEAK.test(b.text);
    const verb = (ACTION.has(fw) || (/ed$/.test(fw) && fw.length > 3)) && !isW;
    const num = /\d|%/.test(b.text);
    const wc = b.text.split(/\s+/).length, lenOk = wc >= 6 && wc <= 30;
    bSum += (verb ? .4 : 0) + (num ? .35 : 0) + (lenOk ? .25 : 0);
    if (isW) weak.push(b); else if (!verb) noVerb.push(b);
    if (!num) noNum++;
    if (!lenOk) longB.push(b);
  });
  const bScore = bl.length ? Math.round(100 * bSum / bl.length) : 0;
  if (!bl.length) issues.push({sev:'bad', text:'No bullet points found. Describe what you built and the result, one "- " line each.'});
  weak.slice(0,3).forEach(b => issues.push({sev:'warn', text:`Weak phrasing: "${b.text.slice(0,60)}${b.text.length>60?'...':''}". Start with a strong verb such as Built, Designed or Reduced.`, ln:b.ln}));
  noVerb.slice(0,2).forEach(b => issues.push({sev:'warn', text:`Start with an action verb: "${b.text.slice(0,56)}${b.text.length>56?'...':''}"`, ln:b.ln}));
  if (bl.length && noNum / bl.length > .6) issues.push({sev:'warn', text:`${noNum} of ${bl.length} bullets have no number. Add scale, speed, accuracy or users where you can.`});
  longB.filter(b => b.text.split(/\s+/).length > 30).slice(0,2).forEach(b => issues.push({sev:'warn', text:'This bullet is over 30 words. Split or trim it.', ln:b.ln}));
  // format
  const ct = m.contact.join(' ');
  let fPts = 0, fMax = 0;
  const f = (ok, text, sev = 'warn', ln) => { fMax++; if (ok) fPts++; else issues.push({sev, text, ln}); };
  f(/[\w.+-]+@[\w-]+\.[\w.]+/.test(ct), 'Add an email address to the contact line.', 'bad', m.nameLn + 1);
  f(/\+?\d[\d\s().-]{8,}/.test(ct), 'Add a phone number to the contact line.', 'warn', m.nameLn + 1);
  f(/github\.com|linkedin\.com|portfolio|\.dev|\.io/i.test(ct), 'Add a GitHub, LinkedIn or portfolio link.', 'warn', m.nameLn + 1);
  f(words >= 180 && words <= 700, words < 180 ? 'The resume is short (' + words + ' words). Add detail about your projects.' : 'The resume is long (' + words + ' words). Trim to the strongest points.');
  f(pages <= 1, 'The resume runs to ' + pages + ' pages. Aim for one page at this stage.');
  const ph = src.match(/\[[^\]\n]{1,40}\]/g);
  f(!ph, 'Replace the [bracketed] placeholders before you send this.', 'bad');
  f(!/example\.com|yourname|90000 00000/i.test(ct), 'Replace the sample contact details with your own.', 'bad', m.nameLn + 1);
  const fScore = Math.round(100 * fPts / fMax), sScore = Math.round(100 * sPts / sMax);
  const subs = {sections:sScore, bullets:bScore, format:fScore};
  let score;
  if (kw) { subs.keywords = kw.pct; score = .35*kw.pct + .25*bScore + .2*sScore + .2*fScore; }
  else score = .4*bScore + .3*sScore + .3*fScore;
  const rank = {bad:0, warn:1, ok:2};
  issues.sort((a,b) => rank[a.sev] - rank[b.sev]);
  return {score:Math.round(score), subs, kw, issues, words, bullets:bl.length};
}

/* ---------- local analysis UI ---------- */
const colFor = v => v >= 75 ? 'var(--good)' : v >= 50 ? 'var(--warn)' : 'var(--bad)';
function ring(v, size = 84){
  const r = size/2 - 7, c = 2*Math.PI*r, mid = size/2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Score ${v} out of 100"><circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="${colFor(v)}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c*v/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${mid} ${mid})"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size*.3}" font-weight="600" fill="var(--ink)">${v}</text></svg>`;
}
const bar = (label, v) => `<div class="bar"><span>${esc(label)}</span><div class="trk"><i style="width:${v}%;background:${colFor(v)}"></i></div><b>${v}</b></div>`;
const LABELS = {keywords:'Keyword match', bullets:'Bullet strength', sections:'Structure', format:'Format and ATS'};
let lastA = null;
function renderLocal(){
  const pages = Math.max(1, Math.ceil(($('#paper').offsetHeight - 2) / PAGE_H));
  const jd = jdTa.value;
  const a = lastA = analyze(ta.value, jd, pages);
  const verdict = a.score >= 80 ? 'Strong' : a.score >= 60 ? 'Good, with gaps' : a.score >= 40 ? 'Needs work' : 'Early draft';
  let h = `<div class="score">${ring(a.score)}<div class="t"><b>${verdict}</b>${a.kw ? 'Scored against your job description' : 'General score. Add a job description for a match score.'}<br>${a.words} words, ${a.bullets} bullets</div></div>`;
  h += `<div style="margin-top:14px"><h3>Breakdown</h3><div class="bars">${Object.keys(LABELS).filter(k => a.subs[k] != null).map(k => bar(LABELS[k], a.subs[k])).join('')}</div></div>`;
  if (a.kw) {
    h += `<div style="margin-top:14px"><h3>Missing keywords</h3>`;
    h += a.kw.missing.length ? `<div class="chips">${a.kw.missing.map(x => `<button class="chip miss" data-act="addkw" data-k="${esc(x.k)}" title="Add to Skills. Only do this if you have the skill.">+ ${esc(pretty(x.k))}</button>`).join('')}</div><p class="hint" style="margin-top:6px">Click a keyword to add it to your Skills section. Add only skills you really have.</p>` : `<p class="hint">Every tool and skill named in the job description appears in your resume.</p>`;
    if (a.kw.matched.length) h += `<h3 style="margin-top:12px">Matched</h3><div class="chips">${a.kw.matched.map(x => `<span class="chip hit">${esc(pretty(x.k))}</span>`).join('')}</div>`;
    const om = a.kw.other.filter(x => !x.hit);
    if (om.length) h += `<h3 style="margin-top:12px">Other terms the job repeats</h3><div class="chips">${om.map(x => `<span class="chip">${esc(x.k)}</span>`).join('')}</div>`;
    h += `</div>`;
  }
  h += `<div style="margin-top:14px"><h3>Things to fix</h3>`;
  h += a.issues.length ? `<ul class="issues">${a.issues.slice(0,12).map(i => `<li class="${i.sev}"><span>${esc(i.text)}</span>${i.ln ? `<button class="link" data-act="jump" data-ln="${i.ln}">Line ${i.ln}</button>` : '<span></span>'}</li>`).join('')}</ul>` : `<p class="hint">No structural problems found.</p>`;
  h += `</div>`;
  $('#local').innerHTML = h;
  const has = jd.trim().length > 40;
  $('#jdState').textContent = has ? 'Job description added' : 'No job description';
  $('#tabJd').textContent = has ? 'Job description \u2022' : 'Job description';
  $('#bClearJd').hidden = !has;
}

/* ---------- editor plumbing ---------- */
function gutter(){
  const n = ta.value.split('\n').length;
  let s = ''; for (let i = 1; i <= n; i++) s += i + '\n';
  $('#gut').textContent = s;
  $('#stat').textContent = n + ' lines';
}
let saveT = null;
function persist(){
  clearTimeout(saveT);
  saveT = setTimeout(() => { const ok = store.set('rl_src', ta.value) && store.set('rl_jd', jdTa.value) && store.set('rl_tpl', tpl); $('#saved').textContent = ok ? 'Saved in this browser' : 'Not saved (storage unavailable)'; }, 400);
}
let anT = null;
function refresh(full){
  gutter(); renderPreview(); persist();
  clearTimeout(anT); anT = setTimeout(renderLocal, full ? 0 : 280);
}
function setSrc(v, rec = true){
  if (rec && ta.value !== v) { hist.push(ta.value); if (hist.length > 60) hist.shift(); }
  ta.value = v; lastVal = v; $('#bUndo').disabled = !hist.length; refresh(true);
}
ta.addEventListener('input', () => {
  if (!typingTimer) { hist.push(lastVal); if (hist.length > 60) hist.shift(); $('#bUndo').disabled = false; }
  clearTimeout(typingTimer); typingTimer = setTimeout(() => { typingTimer = null; }, 1200);
  lastVal = ta.value; refresh(false);
});
ta.addEventListener('scroll', () => { $('#gut').scrollTop = ta.scrollTop; });
jdTa.addEventListener('input', () => { persist(); clearTimeout(anT); anT = setTimeout(renderLocal, 350); });
$('#bUndo').onclick = () => { if (!hist.length) return; const v = hist.pop(); ta.value = v; lastVal = v; typingTimer = null; $('#bUndo').disabled = !hist.length; refresh(true); };
$('#tpl').onchange = e => { tpl = e.target.value; refresh(true); };
$('#wrapChk').onchange = e => { $('#edRes').classList.toggle('wrap', e.target.checked); };
$('#bClearJd').onclick = () => { jdTa.value = ''; persist(); renderLocal(); };

function showTab(which){
  const res = which === 'res';
  $('#edRes').hidden = !res; $('#edJd').hidden = res;
  $('#tabRes').setAttribute('aria-pressed', res); $('#tabJd').setAttribute('aria-pressed', !res);
  (res ? ta : jdTa).focus({preventScroll:true});
}
$('#tabRes').onclick = () => showTab('res');
$('#tabJd').onclick = () => showTab('jd');
function setView(v){
  $('#ws').dataset.view = v;
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v));
  requestAnimationFrame(fitPaper);
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setView(b.dataset.v));
$('#vPrev').onclick = () => { $('#tex').hidden = true; $('#scroll').hidden = false; $('#vPrev').setAttribute('aria-pressed', true); $('#vTex').setAttribute('aria-pressed', false); fitPaper(); };
$('#vTex').onclick = () => { $('#tex').hidden = false; $('#scroll').hidden = true; $('#tex').textContent = toLatex(model); $('#vPrev').setAttribute('aria-pressed', false); $('#vTex').setAttribute('aria-pressed', true); };
window.addEventListener('resize', () => requestAnimationFrame(fitPaper));

function jumpTo(ln){
  setView('edit'); showTab('res');
  const lines = ta.value.split('\n'); let start = 0;
  for (let i = 0; i < ln - 1 && i < lines.length; i++) start += lines[i].length + 1;
  const end = start + (lines[ln-1] || '').length;
  ta.focus({preventScroll:true}); ta.setSelectionRange(start, end);
  ta.scrollTop = Math.max(0, (ln - 4) * 20); $('#gut').scrollTop = ta.scrollTop;
}
function addKeyword(k){
  const lines = ta.value.split('\n');
  const si = lines.findIndex(l => /^##\s+.*(skill|technolog|tools)/i.test(l));
  const name = pretty(k);
  if (si < 0) { setSrc(ta.value.replace(/\s*$/, '') + '\n\n## Skills\nAlso familiar with: ' + name + '\n'); return; }
  let ei = lines.length; for (let i = si + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { ei = i; break; }
  while (ei > si + 1 && !lines[ei-1].trim()) ei--;
  const ai = lines.findIndex((l,i) => i > si && i < ei && /^Also familiar with:/i.test(l));
  if (ai >= 0) lines[ai] += ', ' + name; else lines.splice(ei, 0, 'Also familiar with: ' + name);
  setSrc(lines.join('\n'));
  toast(name + ' added to Skills. Remove it if it is not true.');
}
let toastT;
function toast(t){ const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3200); }

/* ---------- AI ---------- */
let sampleFn = null, ctl = null;
let ai = {status:'idle', edits:[]};
const hasClaude = typeof claude !== 'undefined';
const useCap = async n => { try { return hasClaude ? await claude.use(n) : null; } catch(e){ return null; } };
let dl = null;
const needKey = () => !hasClaude && !store.get('rl_key');
function parseLooseJSON(t){
  const tries = [t, (t.match(/```(?:json)?\s*([\s\S]*?)```/) || [])[1], t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)];
  for (const s of tries) { if (!s) continue; try { return JSON.parse(s); } catch(e){} }
  throw {code:'invalid_json', message:'No JSON found', text:t};
}
function makeKeySample(){
  const call = async (input, opts = {}) => {
    const key = store.get('rl_key');
    if (!key) throw {code:'not_granted', message:'No API key'};
    const messages = typeof input === 'string' ? [{role:'user', content:input}] : input;
    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {method:'POST', signal:opts.signal,
        headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:store.get('rl_model') || 'claude-sonnet-5-5', max_tokens:8000, messages})});
    } catch (e) { throw {code: e && e.name === 'AbortError' ? 'cancelled' : 'upstream_error', message:String(e && e.message)}; }
    if (!r.ok) throw {code: r.status === 401 || r.status === 403 ? 'not_granted' : r.status === 429 ? 'rate_limited' : r.status === 413 ? 'prompt_too_large' : 'upstream_error', message:'HTTP ' + r.status};
    const j = await r.json();
    const text = (j.content || []).map(c => c.text || '').join('');
    if (!text.trim()) throw {code:'empty_completion', message:'empty'};
    if (opts.onText) opts.onText({text, delta:text});
    return {text, truncated:j.stop_reason === 'max_tokens'};
  };
  call.json = async (input, opts) => { const {text} = await call(input, opts); return parseLooseJSON(text); };
  return call;
}
(async () => {
  sampleFn = await useCap('sample');
  dl = await useCap('downloads');
  if (!sampleFn) sampleFn = makeKeySample();
  $('#bKey').hidden = hasClaude && !!sampleFn;
})();
$('#bKey').onclick = () => { $('#keyIn').value = store.get('rl_key') || ''; $('#modelIn').value = store.get('rl_model') || 'claude-sonnet-5-5'; $('#keyMsg').textContent = ''; open('#mKey'); };
$('#keySave').onclick = () => { const k = $('#keyIn').value.trim(); if (!k) { $('#keyMsg').textContent = 'Paste a key first.'; return; } store.set('rl_key', k); store.set('rl_model', $('#modelIn').value.trim() || 'claude-sonnet-5-5'); $('#keyMsg').textContent = 'Saved in this browser.'; };
$('#keyDel').onclick = () => { try { localStorage.removeItem('rl_key'); } catch(e){} $('#keyIn').value = ''; $('#keyMsg').textContent = 'Key removed.'; };

const MARKUP = 'The resume uses this markup: "# Name" on line 1; one contact line; "## Section"; "### Title | Detail | Date" for an entry; "- " for bullets; "Label: a, b, c" for skills lines; **bold** inline.';
function buildPrompt(mode, src, jd){
  const hasJd = jd.trim().length > 40;
  const common = `You are a senior technical recruiter and ATS specialist helping an early-career candidate.\n${MARKUP}\n\nHard rules:\n- Never invent employers, degrees, dates, grades, tools or achievements that the resume does not support.\n- Where a number would strengthen a bullet and you do not know it, write a bracketed placeholder such as [X%] or [N users] for the candidate to fill in.\n- Keep each rewritten line concise (under 28 words per bullet).\n- Every edit has "find" (a complete existing line copied exactly, character for character, including the "- " or "### " prefix) and "replace" (the complete new line, same markup). To add a new line, set "find" to the existing line it should follow and "replace" to that same line, a newline, then the new line.\n- Only propose edits that improve the resume. No more than ${mode === 'tailor' ? 12 : 8} edits, most valuable first.\n`;
  const shape = `Reply with only JSON of this shape:\n{"score": 0-100 overall quality${hasJd ? ' and fit for the job' : ''},"verdict":"one sentence","scores":{"ats":0-100,"content":0-100,"impact":0-100,"keywords":0-100,"clarity":0-100},"strengths":["up to 4 short points"],"weaknesses":["up to 5 short points"],"keyword_gaps":[{"term":"","advice":"how to cover it truthfully, or say skip if the candidate likely lacks it"}],"edits":[{"reason":"why","find":"","replace":""}]}`;
  const task = mode === 'tailor'
    ? 'Task: tailor this resume to the job description. Mirror the job\'s own wording where it is true for the candidate, lead with the most relevant skills and projects, rewrite the Summary for this role, and tighten weak bullets. Do not add skills the candidate does not appear to have; list those under keyword_gaps instead.'
    : 'Task: review this resume as an ATS and a hiring manager would' + (hasJd ? ', also judging fit for the job description' : '') + '. Judge structure, impact, clarity and keywords, then propose line edits that fix the biggest problems.';
  return `${common}\n${task}\n\n${shape}\n\n=== RESUME ===\n${src.slice(0, 20000)}\n${hasJd ? '\n=== JOB DESCRIPTION ===\n' + jd.slice(0, 8000) : ''}`;
}
const arr = (x, n) => (Array.isArray(x) ? x : []).map(v => typeof v === 'string' ? v : (v && (v.text || v.point || v.term)) || '').filter(Boolean).slice(0, n);
const clamp = v => { v = Math.round(Number(v)); return isFinite(v) ? Math.max(0, Math.min(100, v)) : null; };
function normAI(d){
  d = d || {};
  return {
    score:clamp(d.score), verdict:String(d.verdict || ''),
    scores:Object.fromEntries(['ats','content','impact','keywords','clarity'].map(k => [k, clamp(d.scores && d.scores[k])]).filter(([,v]) => v != null)),
    strengths:arr(d.strengths, 4), weaknesses:arr(d.weaknesses, 5),
    gaps:(Array.isArray(d.keyword_gaps) ? d.keyword_gaps : []).slice(0,10).map(g => typeof g === 'string' ? {term:g, advice:''} : {term:String(g.term || ''), advice:String(g.advice || '')}).filter(g => g.term),
    edits:(Array.isArray(d.edits) ? d.edits : []).filter(e => e && typeof e.find === 'string' && typeof e.replace === 'string' && e.find.trim() && e.find !== e.replace).slice(0, 14).map((e,i) => ({id:i, reason:String(e.reason || ''), find:e.find, replace:e.replace, status:'pending'}))
  };
}
const AIERR = {not_granted:'The API key is missing or was rejected. Check it under AI settings.', rate_limited:'Too many requests or usage limit reached. Try again in a few minutes.', session_expired:'Your session expired. Sign in again.', invalid_json:'Claude replied in a format this page could not read. Try again.', refused:'Claude declined this input. Check the resume text and try again.', empty_completion:'Claude returned nothing. Try again.', prompt_too_large:'The resume or job description is too long. Shorten it and try again.', sampling_disabled:'Claude is not available for this account.', upstream_error:'The connection dropped. Try again.'};
async function runAI(mode){
  if (!sampleFn) return;
  if (needKey()) { $('#bKey').click(); return; }
  const jd = jdTa.value;
  if (mode === 'tailor' && jd.trim().length < 40) { ai = {status:'error', msg:'Paste a job description in the Job description tab first, then tailor.', edits:[]}; renderAI(); return; }
  ctl = new AbortController();
  ai = {status:'loading', msg: mode === 'tailor' ? 'Tailoring your resume to the job' : 'Reviewing your resume', edits:[]}; renderAI();
  $('#bReview').disabled = $('#bTailor').disabled = true;
  try {
    const d = await sampleFn.json(buildPrompt(mode, ta.value, jd), {signal:ctl.signal, onText:({text}) => { const el = $('#aiProg'); if (el) el.textContent = 'Writing suggestions (' + text.length + ' characters)'; }});
    ai = {status:'done', mode, ...normAI(d)};
  } catch (e) {
    ai = e && e.code === 'cancelled' ? {status:'idle', edits:[]} : {status:'error', msg:AIERR[e && e.code] || 'Something went wrong. Try again.', edits:[]};
  } finally { $('#bReview').disabled = $('#bTailor').disabled = false; }
  renderAI();
}
function renderAI(){
  const o = $('#aiOut'), s = ai;
  if (s.status === 'idle') { o.innerHTML = ''; return; }
  if (s.status === 'loading') { o.innerHTML = `<div class="loading"><span class="spin"></span><span id="aiProg">${esc(s.msg)}. This can take up to a minute.</span><button class="btn sm" data-act="stop">Stop</button></div>`; return; }
  if (s.status === 'error') { o.innerHTML = `<p class="err">${esc(s.msg)}</p>`; return; }
  let h = '';
  if (s.score != null) h += `<div class="score">${ring(s.score, 72)}<div class="t"><b>${s.mode === 'tailor' ? 'Fit after review' : 'AI score'}</b>${esc(s.verdict)}</div></div>`;
  const keys = Object.keys(s.scores);
  if (keys.length) h += `<div class="bars" style="margin-top:12px">${keys.map(k => bar({ats:'ATS readiness',content:'Content',impact:'Impact',keywords:'Keywords',clarity:'Clarity'}[k], s.scores[k])).join('')}</div>`;
  if (s.strengths.length) h += `<h3 style="margin-top:14px">Strengths</h3><ul class="list">${s.strengths.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (s.weaknesses.length) h += `<h3 style="margin-top:14px">To improve</h3><ul class="list">${s.weaknesses.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (s.gaps.length) h += `<h3 style="margin-top:14px">Keyword gaps</h3><ul class="list">${s.gaps.map(g => `<li><b>${esc(g.term)}</b>${g.advice ? ': ' + esc(g.advice) : ''}</li>`).join('')}</ul>`;
  const pend = s.edits.filter(e => e.status === 'pending').length;
  if (s.edits.length) {
    h += `<div class="row" style="margin:14px 0 8px;align-items:center"><h3 style="margin:0">Suggested changes (${s.edits.length})</h3><span style="flex:1"></span>${pend ? `<button class="btn sm primary" data-act="applyall">Apply all ${pend}</button>` : ''}<button class="btn sm" data-act="undo" ${hist.length ? '' : 'disabled'}>Undo last</button></div><div class="edits">`;
    h += s.edits.map(e => {
      const st = {pending:'', applied:'Applied', skipped:'Skipped', stale:'Could not find this line. Copy it by hand.'}[e.status];
      const ph = /\[[^\]\n]{1,30}\]/.test(e.replace);
      return `<div class="edit ${e.status}"><div class="why">${esc(e.reason || 'Suggested edit')}</div><div class="diff"><div class="del">${esc(e.find)}</div><div class="add">${esc(e.replace)}</div></div><div class="act">${e.status === 'pending' ? `<button class="btn sm primary" data-act="apply" data-id="${e.id}">Apply</button><button class="btn sm" data-act="skip" data-id="${e.id}">Skip</button>` : ''}<button class="btn sm" data-act="copy" data-id="${e.id}">Copy new text</button>${ph && e.status === 'pending' ? '<span class="st">Fill in the [brackets] after applying</span>' : `<span class="st">${st}</span>`}</div></div>`;
    }).join('') + '</div>';
  } else h += `<p class="hint" style="margin-top:12px">No line edits were suggested.</p>`;
  o.innerHTML = h;
}
function applyEdit(e){
  let s = ta.value; const idx = s.indexOf(e.find);
  if (idx >= 0) s = s.slice(0, idx) + e.replace + s.slice(idx + e.find.length);
  else {
    const L = s.split('\n'), F = e.find.split('\n').map(x => x.trim());
    let hit = -1;
    for (let i = 0; i + F.length <= L.length; i++) if (F.every((f,j) => L[i+j].trim() === f)) { hit = i; break; }
    if (hit < 0) return false;
    L.splice(hit, F.length, ...e.replace.split('\n')); s = L.join('\n');
  }
  ta.value = s; lastVal = s; return true;
}
function applyOne(id, snap = true){
  const e = ai.edits.find(x => x.id === id); if (!e || e.status !== 'pending') return;
  const before = ta.value;
  if (applyEdit(e)) { if (snap) { hist.push(before); } e.status = 'applied'; if (/\[[^\]\n]{1,30}\]/.test(e.replace) && snap) toast('Applied. Replace the [bracketed] value with your real number.'); }
  else e.status = 'stale';
  if (snap) { $('#bUndo').disabled = !hist.length; refresh(true); renderAI(); }
}
async function copyText(t){ try { await navigator.clipboard.writeText(t); return true; } catch(e){ return false; } }

$('#an').addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = +b.dataset.id;
  if (act === 'jump') jumpTo(+b.dataset.ln);
  else if (act === 'addkw') addKeyword(b.dataset.k);
  else if (act === 'stop') ctl && ctl.abort();
  else if (act === 'apply') applyOne(id);
  else if (act === 'skip') { const e = ai.edits.find(x => x.id === id); if (e) e.status = 'skipped'; renderAI(); }
  else if (act === 'applyall') {
    const before = ta.value; hist.push(before);
    ai.edits.filter(e => e.status === 'pending').forEach(e => applyOne(e.id, false));
    $('#bUndo').disabled = false; refresh(true); renderAI(); toast('Applied. Check any [bracketed] values.');
  }
  else if (act === 'undo') { $('#bUndo').click(); ai.edits.forEach(e => { if (e.status === 'applied') e.status = 'pending'; }); renderAI(); }
  else if (act === 'copy') { const e = ai.edits.find(x => x.id === id); if (e) toast(await copyText(e.replace) ? 'Copied.' : 'Copy was blocked. Select the green text instead.'); }
});
$('#bReview').onclick = () => runAI('review');
$('#bTailor').onclick = () => runAI('tailor');

/* ---------- import ---------- */
const open = id => $(id).classList.add('open'), close = id => $(id).classList.remove('open');
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('.modal').classList.remove('open'));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open')); });
$('#bImport').onclick = () => { $('#impMsg').textContent = ''; open('#mImport'); };
$('#impFile').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#impText').value = String(r.result).slice(0, 60000); }; r.readAsText(f); };
$('#impRaw').onclick = () => {
  const t = $('#impText').value.trim(); if (!t) { $('#impMsg').textContent = 'Paste some text first.'; return; }
  setSrc(t); close('#mImport'); toast('Imported. Add # and ## markers to structure it.');
};
$('#impAI').onclick = async () => {
  const t = $('#impText').value.trim(); if (!t) { $('#impMsg').textContent = 'Paste some text first.'; return; }
  if (!sampleFn) return;
  if (needKey()) { close('#mImport'); $('#bKey').click(); return; }
  const btn = $('#impAI'); btn.disabled = true; $('#impMsg').textContent = 'Converting. This can take up to a minute.';
  try {
    const { text } = await sampleFn(`Convert the resume text below into this markup and reply with only the converted resume, no commentary and no code fences.\n${MARKUP}\nRules: keep every fact, date and number exactly; do not add, remove or embellish anything; put contact details on one line separated by " | "; use sections named Summary, Education, Skills, Experience, Projects, Certifications or Achievements as they apply; for each education, job or project use a "### Title | Detail | Date" line.\n\n=== RESUME TEXT ===\n${t.slice(0, 30000)}`, {cache:false});
    setSrc(text.replace(/^```\w*\n?|```\s*$/g, '').trim() + '\n'); close('#mImport'); toast('Imported. Review the result.');
  } catch (e) { $('#impMsg').textContent = AIERR[e && e.code] || 'Conversion failed. Try "Use text as it is".'; }
  finally { btn.disabled = false; }
};

/* ---------- export ---------- */
const MIME = {pdf:'application/pdf', html:'text/html', txt:'text/plain', md:'text/markdown'};
async function save(filename, data){
  const msg = $('#xMsg');
  try {
    if (dl) { const r = await dl.save({filename, data}); msg.textContent = r.status === 'saved' ? filename + ' saved.' : ''; return; }
    const blob = new Blob([data], {type:MIME[filename.split('.').pop()] || 'application/octet-stream'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000); msg.textContent = filename + ' downloaded.';
  } catch (e) { msg.textContent = e && e.code === 'declined' ? 'Save cancelled.' : 'Could not save the file. Try another browser.'; }
}
const fname = () => (model.name || 'resume').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume';
$('#bExport').onclick = () => { $('#xMsg').textContent = ''; open('#mExport'); };
$('#xPdf').onclick = () => { try { save(fname() + '-resume.pdf', buildPDF(model)); } catch (e) { $('#xMsg').textContent = e.message; } };
$('#xTex').onclick = () => save(fname() + '-resume-tex.txt', toLatex(model));
$('#xMd').onclick = () => save(fname() + '-resume.md', ta.value);
$('#xHtml').onclick = () => save(fname() + '-resume.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(model.name || 'Resume')}</title><style>body{margin:0;background:#eee}${PAPER_CSS}.paper{margin:0 auto}</style></head><body><div class="paper ${tpl}">${$('#paperBody').innerHTML}</div></body></html>`);
$('#xCopy').onclick = async () => { $('#xMsg').textContent = await copyText(toLatex(model)) ? 'LaTeX copied. Paste it into main.tex on Overleaf.' : 'Copy was blocked here. Open the LaTeX view and select the code.'; };

/* ---------- paper styles ---------- */
const PAPER_CSS = `
.paper{width:794px;min-height:1123px;box-sizing:border-box;padding:48px 54px;background:#fff;color:#111;position:relative;font-size:13.5px;line-height:1.38}
.paper *{box-sizing:border-box}
.paper h1{margin:0;font-size:28px;line-height:1.1;text-align:center;font-weight:700}
.paper .contact{text-align:center;font-size:12px;margin-top:6px;color:#333}
.paper .contact span+span::before{content:"|";margin:0 8px;color:#999}
.paper h2{margin:16px 0 6px;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1.2px solid #111;padding-bottom:2px;font-weight:700}
.paper .entry{margin-top:7px}
.paper .eh{display:flex;justify-content:space-between;gap:12px;font-weight:700}
.paper .eh .r{font-weight:400;white-space:nowrap}
.paper .meta{font-style:italic}
.paper ul{margin:3px 0 0;padding-left:18px}
.paper li{margin:1px 0}
.paper p{margin:3px 0}
.paper.classic{font-family:'Source Serif 4',Georgia,'Times New Roman',serif}
.paper.modern{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:13px}
.paper.modern h1{text-align:left;font-size:30px;color:#0e6b8c}
.paper.modern .contact{text-align:left}
.paper.modern h2{color:#0e6b8c;border-bottom-color:#0e6b8c}
.paper.compact{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:12px;padding:36px 44px;line-height:1.3}
.paper.compact h1{font-size:24px}
.paper.compact h2{margin:11px 0 4px}
`;
$('#paperCss').textContent = PAPER_CSS;

/* ---------- boot ---------- */
gutter(); renderPreview(); renderLocal(); renderAI();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitPaper(); renderLocal(); });
})();
