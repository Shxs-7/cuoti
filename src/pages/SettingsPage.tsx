import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import { useUIStore } from '@/stores/ui.store';
import { backupService, type BackupFile } from '@/services/backup.service';
import { questionService } from '@/services/question.service';
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
      toast('数据恢复成功', 'success');
      loadInfo();
    } catch {
      toast('恢复失败', 'error');
    }
    setPendingImport(null);
  };

  const handleClearAll = () => {
    const req = indexedDB.deleteDatabase('cuoti-db');
    req.onsuccess = () => {
      toast('所有数据已清空，请刷新页面', 'info');
      setTimeout(() => window.location.reload(), 1500);
    };
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

      {/* Auto Backup */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">自动备份</h3>
        <p className="text-xs text-gray-400 mb-2">数据变更后自动保存到浏览器本地存储，防止数据丢失</p>
        {(() => {
          const info = autoBackupService.getBackupInfo();
          return info ? (
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">上次备份</span><span>{info.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">大小</span><span>{info.size}</span></div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">暂无自动备份</div>
          );
        })()}
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
          ? `将导入 ${pendingImport.data.categories.length} 分类, ${pendingImport.data.folders.length} 文件夹, ${pendingImport.data.questions.length} 题目。当前数据将被覆盖，确认？`
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
    </div>
  );
}
