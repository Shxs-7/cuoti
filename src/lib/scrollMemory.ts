// 记录/恢复列表页的滚动位置：从详情页返回时保持原来的浏览位置
const scrollMap = new Map<string, number>();

export function saveScroll(key: string): void {
  const el = document.querySelector('main');
  if (el) scrollMap.set(key, el.scrollTop);
}

export function restoreScroll(key: string): void {
  const saved = scrollMap.get(key);
  if (saved === undefined) return;
  requestAnimationFrame(() => {
    const el = document.querySelector('main');
    if (el) el.scrollTop = saved;
  });
}
