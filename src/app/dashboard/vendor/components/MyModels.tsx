'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Trash2, Eye, FileBox, CheckCircle, XCircle, X } from 'lucide-react';

interface ModelAsset {
  id: string;
  name: string;
  file_path: string;
  original_filename: string | null;
  preview_url: string | null;
  created_at: string;
}

interface MyModelsProps {
  vendorId: string;
}

export default function MyModels({ vendorId }: MyModelsProps) {
  const [models, setModels] = useState<ModelAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewModel, setPreviewModel] = useState<ModelAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 上传相关状态
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const loadModels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data?.data?.models || []);
      }
    } catch (error) {
      console.error('Load models error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除模型"${name}"吗？此操作不可恢复。`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert('删除失败，请重试');
      }
    } catch {
      alert('删除失败，请重试');
    } finally {
      setDeletingId(null);
    }
  };

  // 上传处理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFiles(e.target.files);
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      setUploadStatus('error');
      setUploadMessage('只支持 .glb 或 .gltf 格式的文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMessage('文件大小不能超过 50MB');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      // 保存模型元数据
      const modelName = file.name.replace(/\.(glb|gltf)$/i, '');
      const filePath = `models/${vendorId}/${Date.now()}_${file.name}`;

      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName,
          filePath,
          fileSize: file.size,
          originalFilename: file.name,
        }),
      });

      if (!res.ok) throw new Error('保存模型记录失败');

      setUploadStatus('success');
      setUploadMessage('模型上传成功！');
      await loadModels();

      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
        setShowUpload(false);
      }, 2000);
    } catch {
      setUploadStatus('error');
      setUploadMessage('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '未知大小';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">我的模型</h2>
          <p className="text-sm text-gray-500 mt-1">共 {models.length} 个模型</p>
        </div>
        <Button onClick={() => { setShowUpload(!showUpload); setUploadStatus('idle'); setUploadMessage(''); }}>
          <Upload className="h-4 w-4 mr-2" />
          上传模型
        </Button>
      </div>

      {/* 上传区域（折叠） */}
      {showUpload && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">上传新模型</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>支持 .glb 和 .gltf 格式，文件大小不超过 50MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="model-file-upload"
                className="hidden"
                accept=".glb,.gltf"
                onChange={handleChange}
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-3">
                {uploadStatus === 'idle' && (
                  <>
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="text-gray-700 font-medium">拖拽文件到此处，或</p>
                    <Button
                      type="button"
                      disabled={uploading}
                      onClick={() => document.getElementById('model-file-upload')?.click()}
                    >
                      {uploading ? '上传中...' : '选择文件'}
                    </Button>
                    <p className="text-sm text-gray-500">GLB / GLTF · 最大 50MB</p>
                  </>
                )}
                {uploadStatus === 'success' && (
                  <div className="flex flex-col items-center gap-2 text-green-600">
                    <CheckCircle className="h-10 w-10" />
                    <p className="font-semibold">{uploadMessage}</p>
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="flex flex-col items-center gap-2 text-red-600">
                    <XCircle className="h-10 w-10" />
                    <p className="font-semibold">{uploadMessage}</p>
                    <Button variant="outline" onClick={() => setUploadStatus('idle')}>
                      重新上传
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 模型列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileBox className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">还没有上传任何模型</p>
            <p className="text-gray-400 text-sm mt-1">点击右上角"上传模型"按钮开始上传</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <Card key={model.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* 预览图 / 占位 */}
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  {model.preview_url ? (
                    <img
                      src={model.preview_url}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileBox className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                {/* 模型信息 */}
                <h3 className="font-semibold text-gray-900 truncate" title={model.name}>
                  {model.name}
                </h3>
                {model.original_filename && (
                  <p className="text-xs text-gray-400 truncate mt-0.5" title={model.original_filename}>
                    {model.original_filename}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDate(model.created_at)}</p>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewModel(model)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    预览
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={deletingId === model.id}
                    onClick={() => handleDelete(model.id, model.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {deletingId === model.id ? '删除中...' : '删除'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 预览弹窗 */}
      {previewModel && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewModel(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-lg font-semibold">{previewModel.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setPreviewModel(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              {/* 预览图或占位 */}
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {previewModel.preview_url ? (
                  <img
                    src={previewModel.preview_url}
                    alt={previewModel.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <FileBox className="h-16 w-16" />
                    <p className="text-sm">暂无预览图</p>
                  </div>
                )}
              </div>

              {/* 模型详情 */}
              <div className="space-y-2 text-sm">
                {previewModel.original_filename && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">文件名</span>
                    <span className="font-medium">{previewModel.original_filename}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">存储路径</span>
                  <span className="font-mono text-xs text-gray-600 max-w-[250px] truncate" title={previewModel.file_path}>
                    {previewModel.file_path}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">上传时间</span>
                  <span>{formatDate(previewModel.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
