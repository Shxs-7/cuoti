import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { db } from '@/db/database';
import { backupService, type BackupFile } from '@/services/backup.service';
import { questionService } from '@/services/question.service';
import { syncService } from '@/services/sync.service';
import { autoBackupService } from '@/services/autobackup.service';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { APP_NAME, APP_VERSION } from '@/lib/constants';

export function SettingsPage() {
  const { setTitle } = useAppStore();
  const toast = useUIStore(s => s.toast);
  const [storage, setStorage] = useState({ usage: '', quota: '', percent: 0 });
  const [totalQuestions, setTotalQuestions] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Import confirmation
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);

  // Clear confirmation
  const [showClear, setShowClear] = useState(false);
  const [autoBackupInfo, setAutoBackupInfo] = useState<{ date: string; size: string } | null>(null);
  const [showRestore, setShowRestore] = useState(false);

  useEffect(() => {
    setTitle('设置');
    loadInfo();
  }, []);

  const loadInfo = async () => {
    const [s, count] = await Promise.all([
      backupService.getStorageInfo(),
      questionService.getTotalCount(),
    ]);
    setStorage(s);
    setTotalQuestions(count);
    setAutoBackupInfo(autoBackupService.getBackupInfo());
  };

  const handleExport = async () => {
    try {
      await backupService.shareBackup();
    } catch {
      await backupService.downloadBackup();
    }
    toast('备份导出成功', 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const backup = await backupService.importData(file);
      setPendingImport(backup);
    } catch {
      toast('导入失败，文件格式不正确', 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    try {
      await backupService.restoreData(pendingImport);
      // 导入后立即把数据推到云端
      syncService.fullSync();
      toast('数据恢复成功', 'success');
      loadInfo();
    } catch {
      toast('恢复失败', 'error');
    }
    setPendingImport(null);
  };

  const handleClearAll = async () => {
    try {
      // db.delete() 会关闭连接并删除数据库，比 deleteDatabase 更可靠
      await db.delete();
      localStorage.removeItem('cuoti-autobackup');
      toast('所有数据已清空，请刷新页面', 'info');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast('清空失败', 'error');
    }
    setShowClear(false);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* App info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">关于</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">应用</span><span>{APP_NAME}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">版本</span><span>{APP_VERSION}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">总错题数</span><span className="font-semibold text-primary-600">{totalQuestions}</span></div>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">存储空间</h3>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-500">已用</span>
          <span>{storage.usage} / {storage.quota} ({storage.percent}%)</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${storage.percent > 80 ? 'bg-red-500' : 'bg-primary-500'}`}
            style={{ width: `${Math.min(storage.percent, 100)}%` }}
          />
        </div>
        {storage.percent > 80 && (
          <div className="text-xs text-red-500 mt-1.5">⚠️ 存储空间不足，建议导出备份后清理</div>
        )}
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">数据备份</h3>
        <p className="text-xs text-gray-400">导出所有数据为 JSON 文件，可随时导入恢复</p>
        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={handleExport}>
            📤 导出备份
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
            📥 导入备份
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Auto backup */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">🛡️ 自动备份</h3>
        <p className="text-xs text-gray-400">数据变化后自动备份到本地浏览器，每 5 分钟兜底保存一次</p>
        {autoBackupInfo ? (
          <div className="text-xs text-gray-500">最近备份：{autoBackupInfo.date}（{autoBackupInfo.size}）</div>
        ) : (
          <div className="text-xs text-gray-400">暂无自动备份</div>
        )}
        <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowRestore(true)} disabled={!autoBackupInfo}>
          ♻️ 从自动备份恢复
        </Button>
      </div>

      {/* Cloud Sync */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">☁️ 云同步</h3>
        <p className="text-xs text-gray-400">数据保存在 Supabase 云端，多设备自动同步</p>
        <div className="text-xs text-gray-500 space-y-1">
          <div>设备 ID：<span className="font-mono text-[10px] bg-gray-100 px-1 rounded">{syncService.deviceId.slice(0, 8)}...</span></div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={async () => {
            toast('同步中...', 'info');
            try {
              await syncService.fullSync();
              toast('同步完成', 'success');
            } catch { toast('同步失败', 'error'); }
          }}>🔄 立即同步</Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => {
            navigator.clipboard.writeText(syncService.deviceId);
            toast('设备 ID 已复制', 'success');
          }}>📋 复制设备 ID</Button>
        </div>
        <p className="text-[10px] text-gray-300">所有设备的数据会自动合并同步，删除操作也会同步到其他设备</p>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-red-600">危险操作</h3>
        <Button variant="danger" className="w-full" onClick={() => setShowClear(true)}>
          🗑 清空所有数据
        </Button>
      </div>

      {/* Install instructions */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-700 mb-1">💡 添加到主屏幕</h3>
        <p className="text-xs text-blue-600">
          在 Safari 中打开此网页，点击底部分享按钮，选择「添加到主屏幕」，即可像 App 一样使用。
        </p>
      </div>

      {/* Import confirm */}
      <ConfirmDialog
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="确认导入"
        message={pendingImport
          ? `将导入 ${pendingImport.data.categories.length} 分类, ${pendingImport.data.folders.length} 文件夹, ${pendingImport.data.questions.length} 题目, ${pendingImport.data.knowledgePoints?.length ?? 0} 知识点, ${pendingImport.data.journal?.length ?? 0} 条日记。当前数据将被覆盖，确认？`
          : ''}
        confirmText="导入"
        danger
      />

      {/* Clear confirm */}
      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={handleClearAll}
        title="清空所有数据"
        message="确定要删除所有数据吗？此操作无法恢复！"
        confirmText="清空"
        danger
      />

      {/* Restore auto backup confirm */}
      <ConfirmDialog
        open={showRestore}
        onClose={() => setShowRestore(false)}
        onConfirm={async () => {
          const ok = await autoBackupService.restore();
          if (ok) {
            syncService.fullSync();
            toast('自动备份已恢复', 'success');
          } else {
            toast('恢复失败', 'error');
          }
          setShowRestore(false);
          loadInfo();
        }}
        title="从自动备份恢复"
        message="将用最近一次自动备份覆盖当前所有数据，确认？"
        confirmText="恢复"
        danger
      />
    </div>
  );
}
