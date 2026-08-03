import{f as B,u as D,b as G,r as x,j as s}from"./index-nX_fvUp0.js";import{j as k,J,C as F}from"./journal.service-C1BOkG5b.js";import{q as T}from"./question.service-Dt-kdg1r.js";import{r as M}from"./review.service-jnKSMg22.js";import{k as O}from"./knowledge.service-XHx0tWmG.js";import{B as N}from"./Button-Dd3mvEiq.js";import"./tag.service-CEnM-Ijd.js";const I=B("ai"),P="cuoti-ai-apikey",K="cuoti-ai-url",U="cuoti-ai-model",Q="https://api.deepseek.com/v1/chat/completions",Y="deepseek-chat",W=25e3;async function _(n,i,a=W){const l=new AbortController,e=setTimeout(()=>l.abort(),a);try{return await fetch(n,{...i,signal:l.signal})}finally{clearTimeout(e)}}async function H(){const[n,i,a]=await Promise.all([k.getAll(),T.getRecent(20),O.getAll()]),l=i.map(o=>`- 【${o.title||"无标题"}】难度${o.difficulty}/5 标签：${Array.isArray(o.tags)?o.tags.join("、"):"无"}，我的错误答案：${o.wrongAnswer||"未记录"}`).join(`
`)||"暂无错题",e=n.filter(o=>o.wrongReasons).slice(-15).map(o=>`- 【${o.date} ${o.category}】${o.wrongReasons}`).join(`
`)||"暂无错因记录",c=a.slice(0,15).map(o=>`- ${o.title}`).join(`
`)||"暂无知识点";return`## 最近错题（${i.length} 道）
${l}

## 日记错因（${n.length} 条）
${e}

## 已记录知识点
${c}`}function L(n){const i=new Map;for(const a of n){if(!a.wrongReasons)continue;const l=a.wrongReasons.split(/[。；;，,\n]+/).map(e=>e.trim()).filter(e=>e.length>=2);for(const e of l)i.set(e,(i.get(e)??0)+1)}return[...i.entries()].map(([a,l])=>({text:a,count:l})).sort((a,l)=>l.count-a.count).slice(0,5)}const h={getApiKey(){return localStorage.getItem(P)||""},setApiKey(n){localStorage.setItem(P,n)},getApiUrl(){return localStorage.getItem(K)||Q},setApiUrl(n){localStorage.setItem(K,n)},getApiModel(){return localStorage.getItem(U)||Y},setApiModel(n){localStorage.setItem(U,n)},isConfigured(){return!!this.getApiKey()},async summarize(){var a,l,e;const n=await this.localSummary(),i=this.getApiKey();if(!i)return n;try{const[c,o,p,f]=await Promise.all([k.getAll(),M.getStats(),T.getRecent(30),O.getAll()]),y=p.map(r=>`【${r.title||"无标题"}】难度${r.difficulty}/5 标签：${Array.isArray(r.tags)?r.tags.join("、"):"无"}
我的错误答案：${r.wrongAnswer||"未记录"}`).join(`
`),g={};for(const r of c){const m=r.category||"未分类";(g[m]=g[m]||[]).push(r.wrongReasons||"")}const t=Object.entries(g).map(([r,m])=>{const S=m.filter(Boolean);return S.length?`${r}（${S.length} 条）：
${S.slice(0,5).map(R=>`- ${R}`).join(`
`)}`:`${r}：暂无错因记录`}).join(`

`),d=L(c).map(r=>`${r.text}（出现 ${r.count} 次）`).join("、")||"暂无",A=c.length?c.slice(0,30).map(r=>`【${r.date}】${r.category}
学习内容：${r.content||"无"}
错因分析：${r.wrongReasons||"无"}`).join(`

---

`):"暂无日记记录。",v=f.map(r=>{var m;return`【${r.title}】${((m=r.content)==null?void 0:m.slice(0,100))||""}`}).join(`
`),E=`你是一位公务员考试辅导专家。请重点分析以下学习数据，并给出针对性建议：

## 学习日记（最近 ${c.length} 条）
${A}

## 日记里的高频错因
${d||"暂无"}

## 错因按模块汇总
${t||"暂无"}

## 最近错题（共${o.total}题，掌握度${o.avgMastery}%）
${y}

## 知识点
${v}

请按要求回答：
1. 分析最近错题：哪些模块/知识点反复出错、共性错误是什么
2. 分析日记里的频繁错误：反复出现的错因和薄弱环节
3. 给出下一步学习计划和每日复习建议

用中文，简洁有条理，分点回答。`,j=await _(this.getApiUrl(),{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({model:this.getApiModel(),messages:[{role:"system",content:"你是公考辅导专家，回答简洁有条理，用中文。"},{role:"user",content:E}],max_tokens:1500,temperature:.7})});if(!j.ok)return I.warn("AI API error: "+await j.text()),n+`

⚠️ AI 云分析失败（检查 Key/地址/模型），以上为本地分析结果。`;const $=(e=(l=(a=(await j.json()).choices)==null?void 0:a[0])==null?void 0:l.message)==null?void 0:e.content;return $||n}catch(c){return I.warn("AI request failed",c),n+`

⚠️ AI 云分析超时或网络错误，以上为本地分析结果。`}},async ask(n){var a,l,e;const i=this.getApiKey();if(!i)throw new Error("请先在 ⚙️ 里配置 API Key");try{const o=`你是公务员考试辅导专家。以下是用户的学习数据摘要：

${await H()}

用户的问题：${n}

请结合这些数据给出具体、可操作的回答，用中文，分点，简洁。`,p=await _(this.getApiUrl(),{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({model:this.getApiModel(),messages:[{role:"system",content:"你是公考辅导专家，回答简洁有条理，用中文。"},{role:"user",content:o}],max_tokens:1e3,temperature:.7})});if(!p.ok)throw new Error("AI 接口错误："+(await p.text()).slice(0,200));const y=(e=(l=(a=(await p.json()).choices)==null?void 0:a[0])==null?void 0:l.message)==null?void 0:e.content;if(!y)throw new Error("AI 返回内容为空");return y}catch(c){throw I.warn("AI ask failed",c),new Error(c instanceof Error?c.message:"请求失败")}},async localSummary(){try{const[n,i,a,l]=await Promise.all([k.getAll(),M.getStats(),T.getRecent(200),O.getAll()]),e=[];e.push(`📊 学习总览：共 ${i.total} 道错题，${n.length} 篇日记，${l.length} 个知识点，平均掌握度 ${i.avgMastery}%，待复习 ${i.needReview} 题`);const c={};for(const t of n)c[t.category||"未分类"]=(c[t.category||"未分类"]||0)+1;const o={};for(const t of a)if(Array.isArray(t.tags))for(const d of t.tags)o[d]=(o[d]||0)+1;const p=Object.entries(o).sort((t,d)=>d[1]-t[1]).slice(0,8);e.push(""),e.push("📈 六大模块记录：");for(const t of J){const d=c[t]||0,A=F[t]||"📝";e.push(`${A} ${t}：${d} 条日记${d>0?`（占比 ${Math.round(d/n.length*100)}%）`:""}`)}if(e.push(""),e.push("🔍 最近错题："),a.length===0)e.push("暂无错题，建议先添加错题");else{for(const t of a.slice(0,8)){const d=t.wrongAnswer?`｜错答：${t.wrongAnswer.slice(0,40)}`:"",A=Array.isArray(t.tags)&&t.tags.length?`｜标签：${t.tags.join("、")}`:"";e.push(`• ${t.title||"无标题"}（难度${t.difficulty}/5）${A}${d}`)}a.length>8&&e.push(`…共 ${a.length} 道最近错题`)}if(e.push(""),e.push("🏷️ 高频错题标签（薄弱点）："),p.length===0)e.push("暂无标签数据，建议给错题添加标签");else for(const[t,d]of p)e.push(`• ${t}：${d} 题`);e.push(""),e.push("⚠️ 日记高频错因：");const f=L(n);if(f.length===0)e.push("暂无错因记录，建议在日记中记录每日错因");else for(const t of f)e.push(`• ${t.text}（出现 ${t.count} 次）`);e.push(""),e.push("📝 近期错因明细：");const y=n.filter(t=>t.wrongReasons).slice(0,8).map(t=>`【${t.date} ${t.category}】${t.wrongReasons}`);y.length===0?e.push("暂无"):e.push(y.join(`
`)),e.push(""),e.push("💡 建议：");const g=[];i.needReview>0&&g.push(`有 ${i.needReview} 道题需要复习（掌握度<60%或超过3天未复习）`),n.length===0&&g.push("坚持写学习日记，记录每日错因"),p.length>0&&g.push(`重点关注薄弱点：${p.slice(0,3).map(t=>t[0]).join("、")}`),f.length>0&&g.push(`反复出现的错因：${f.slice(0,3).map(t=>t.text).join("；")}，建议针对性专项练习`),i.avgMastery<50&&g.push("整体掌握度偏低，建议增加复习频率"),g.length===0&&g.push("整体状态不错，保持节奏，定期复习");for(const t of g)e.push(`• ${t}`);return e.join(`
`)}catch(n){return I.warn("localSummary error",n),"📊 分析数据失败，请稍后重试。"}}};function ae(){const{setTitle:n}=D(),i=G(u=>u.toast),[a,l]=x.useState(h.getApiKey()),[e,c]=x.useState(h.getApiUrl()),[o,p]=x.useState(h.getApiModel()),[f,y]=x.useState(!1),[g,t]=x.useState(""),[d,A]=x.useState(!1),[v,E]=x.useState(""),[j,b]=x.useState(""),[$,r]=x.useState(!1),[m,S]=x.useState({total:0,reviewed:0,avgMastery:0,needReview:0,journalCount:0});x.useEffect(()=>{n("AI 分析"),R(),C()},[]);const R=async()=>{try{const[u,w]=await Promise.all([M.getStats(),k.getAll()]);S({...u,journalCount:w.length})}catch{}},q=()=>{h.setApiKey(a.trim()),h.setApiUrl(e.trim()||h.getApiUrl()),h.setApiModel(o.trim()||h.getApiModel()),i("设置已保存","success"),y(!1),C()},C=async()=>{A(!0),t("");try{const u=await h.summarize();t(u)}catch(u){t("分析失败: "+(u instanceof Error?u.message:""))}finally{A(!1)}},z=async()=>{const u=v.trim();if(!(!u||$)){if(!h.isConfigured()){b("⚠️ 提问需要先配置云端 AI（点右上 ⚙️ 填 API 地址、Key 和模型）。不配置也能使用上方的自动分析。");return}r(!0),b("");try{const w=await h.ask(u);b(w)}catch(w){b("提问失败："+(w instanceof Error?w.message:String(w)))}finally{r(!1)}}};return s.jsxs("div",{className:"space-y-4 pb-6",children:[s.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[s.jsxs("div",{className:"bg-white rounded-xl p-3 shadow-sm",children:[s.jsx("div",{className:"text-xl font-bold text-primary-600",children:m.total}),s.jsx("div",{className:"text-xs text-gray-500",children:"总错题"})]}),s.jsxs("div",{className:"bg-white rounded-xl p-3 shadow-sm",children:[s.jsxs("div",{className:"text-xl font-bold text-green-600",children:[m.avgMastery,"%"]}),s.jsx("div",{className:"text-xs text-gray-500",children:"掌握度"})]}),s.jsxs("div",{className:"bg-white rounded-xl p-3 shadow-sm",children:[s.jsx("div",{className:"text-xl font-bold text-purple-600",children:m.journalCount}),s.jsx("div",{className:"text-xs text-gray-500",children:"日记数"})]}),s.jsxs("div",{className:"bg-white rounded-xl p-3 shadow-sm",children:[s.jsx("div",{className:"text-xl font-bold text-orange-500",children:m.needReview}),s.jsx("div",{className:"text-xs text-gray-500",children:"待复习"})]})]}),f&&s.jsxs("div",{className:"bg-white rounded-xl p-4 shadow-sm space-y-3",children:[s.jsx("h3",{className:"text-sm font-semibold",children:"⚙️ AI 云分析设置（可选）"}),s.jsx("p",{className:"text-xs text-gray-400",children:"已内置本地智能分析，无需配置即可使用。 如需更深入的 AI 分析，可填 OpenAI/DeepSeek 兼容 API。"}),s.jsxs("div",{children:[s.jsx("label",{className:"text-xs text-gray-500 mb-1 block",children:"API 地址"}),s.jsx("input",{value:e,onChange:u=>c(u.target.value),placeholder:"https://api.deepseek.com/v1/chat/completions",className:"w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400"})]}),s.jsxs("div",{children:[s.jsx("label",{className:"text-xs text-gray-500 mb-1 block",children:"API Key"}),s.jsx("input",{value:a,onChange:u=>l(u.target.value),type:"password",placeholder:"sk-...",className:"w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400"})]}),s.jsxs("div",{children:[s.jsx("label",{className:"text-xs text-gray-500 mb-1 block",children:"模型名称"}),s.jsx("input",{value:o,onChange:u=>p(u.target.value),placeholder:"deepseek-chat（OpenAI 用 gpt-4o-mini 等）",className:"w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400"})]}),s.jsx(N,{size:"sm",className:"w-full",onClick:q,children:"保存并分析"})]}),s.jsxs("div",{className:"flex gap-2",children:[s.jsx(N,{className:"flex-1",onClick:C,disabled:d,children:d?"分析中...":"🔄 重新分析"}),s.jsx(N,{variant:"ghost",size:"sm",onClick:()=>y(!f),children:"⚙️"})]}),d&&s.jsxs("div",{className:"text-center py-8 text-gray-400",children:[s.jsx("div",{className:"text-3xl mb-2",children:"🤖"}),s.jsx("div",{className:"text-sm",children:"正在分析你的学习数据..."})]}),g&&!d&&s.jsxs("div",{className:"bg-white rounded-xl p-4 shadow-sm",children:[s.jsx("h3",{className:"text-sm font-semibold text-gray-700 mb-2",children:"📊 分析结果"}),s.jsx("div",{className:"text-sm whitespace-pre-wrap leading-relaxed",children:g})]}),s.jsxs("div",{className:"bg-white rounded-xl p-4 shadow-sm space-y-3",children:[s.jsx("h3",{className:"text-sm font-semibold text-gray-700",children:"💬 向 AI 提问"}),s.jsx("textarea",{value:v,onChange:u=>E(u.target.value),rows:2,className:"w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 resize-y",placeholder:"例如：我最近资料分析总是算错，应该怎么练？"}),s.jsx(N,{size:"sm",className:"w-full",onClick:z,disabled:$||!v.trim(),children:$?"思考中...":"发送问题"}),!h.isConfigured()&&s.jsx("p",{className:"text-xs text-gray-400",children:'未配置云端 AI 时，上方"自动分析"为本地智能分析，可直接使用。'}),j&&s.jsx("div",{className:"text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-3",children:j})]})]})}export{ae as AIPage};
