import{d as a,e as o,f as s}from"./index-DXvUpU5J.js";const u=["资料分析","言语理解","类比推理","定义判断","图形推理","逻辑判断"],l={资料分析:"📊",言语理解:"📖",类比推理:"🔄",定义判断:"📋",图形推理:"🎨",逻辑判断:"🧩"},c=s("journal"),d={async getAll(){return a.journal.reverse().sortBy("date")},async getByDate(t){return a.journal.where("date").equals(t).toArray()},async getByCategory(t){return a.journal.where("category").equals(t).reverse().sortBy("date")},async getById(t){return a.journal.get(t)},async create(t){const e=Date.now(),r={id:o(),...t,createdAt:e,updatedAt:e};return await a.journal.add(r),c.info("Journal created",{date:t.date,category:t.category}),r},async update(t,e){await a.journal.update(t,{...e,updatedAt:Date.now()})},async remove(t){await a.journal.delete(t)},async getStats(){const t=await a.journal.toArray(),e={},r={};for(const n of t)e[n.category]=(e[n.category]||0)+1,r[n.date]=(r[n.date]||0)+1;return{total:t.length,byCategory:e,byDate:r,entries:t}},async exportForAI(){const t=await a.journal.reverse().sortBy("date");return t.length===0?"暂无日记记录。":t.map(e=>`【${e.date}】${e.category}
学习内容：${e.content||"无"}
错因分析：${e.wrongReasons||"无"}
标签：${e.tags.join("、")||"无"}`).join(`

---

`)}};export{l as C,u as J,d as j};
