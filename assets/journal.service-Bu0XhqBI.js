import{d as r,s as o,e as s,f as c}from"./index-Bw_yAs64.js";const l=["资料分析","言语理解","类比推理","定义判断","图形推理","逻辑判断"],d={资料分析:"📊",言语理解:"📖",类比推理:"🔄",定义判断:"📋",图形推理:"🎨",逻辑判断:"🧩"},u=c("journal"),g={async getAll(){return r.journal.reverse().sortBy("date")},async getByDate(t){return r.journal.where("date").equals(t).toArray()},async getByCategory(t){return r.journal.where("category").equals(t).reverse().sortBy("date")},async getById(t){return r.journal.get(t)},async create(t){const a=Date.now(),e={id:s(),...t,createdAt:a,updatedAt:a};return await r.journal.add(e),o.syncOne("journal",e),u.info("Journal created",{date:t.date,category:t.category}),e},async update(t,a){await r.journal.update(t,{...a,updatedAt:Date.now()});const e=await r.journal.get(t);e&&o.syncOne("journal",e)},async remove(t){await r.journal.delete(t),await o.markDeleted("journal",t)},async getStats(){const t=await r.journal.toArray(),a={},e={};for(const n of t)a[n.category]=(a[n.category]||0)+1,e[n.date]=(e[n.date]||0)+1;return{total:t.length,byCategory:a,byDate:e,entries:t}},async exportForAI(){const t=await r.journal.reverse().sortBy("date");return t.length===0?"暂无日记记录。":t.map(a=>`【${a.date}】${a.category}
学习内容：${a.content||"无"}
错因分析：${a.wrongReasons||"无"}
标签：${a.tags.join("、")||"无"}`).join(`

---

`)}};export{d as C,l as J,g as j};
