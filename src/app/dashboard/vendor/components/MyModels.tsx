'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash2, Eye, FileBox, X } from 'lucide-react';
import ModelUploadArea from './ModelUploadArea';

const Configurator3D = dynamic(
  () => import('@/components/3d/Configurator3D'),
  { ssr: false }
);

interface ModelAsset {
  id: string;
  name: string;
  file_path: string;
  file_url?: string | null;
  original_filename: string | null;
  preview_url: string | null;
  created_at: string;
}

interface MyModelsProps {
  vendorId: string;
}

function resolveModelUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
  const normalized = path.replace(/^\/+/, '');

  if (normalized.startsWith('3d-models/')) {
    return `${baseUrl}/${normalized}`;
  }

  if (normalized.startsWith('models/')) {
    return `${baseUrl}/3d-models/${normalized.slice('models/'.length)}`;
  }

  return `${baseUrl}/3d-models/${normalized}`;
}

export default function MyModels({ vendorId }: MyModelsProps) {
  const [models, setModels] = useState<ModelAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewModel, setPreviewModel] = useState<ModelAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const previewModelUrl = previewModel?.file_url || resolveModelUrl(previewModel?.file_path);

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">我的模型</h2>
          <p className="text-sm text-gray-500 mt-1">共 {models.length} 个模型</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          上传模型
        </Button>
      </div>

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

      {/* 预览弹窗 - Portal 到 body 保证遮罩全屏覆盖 */}
      {previewModel && createPortal(
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
              {/* 3D 预览 */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {previewModelUrl ? (
                  <Configurator3D
                    modelUrl={previewModelUrl}
                    config={{ color: '#ffffff', roughness: 0.3, metalness: 0.1 }}
                    className="h-full w-full"
                    preserveMaterials
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FileBox className="h-16 w-16" />
                      <p className="text-sm">模型地址不可用，无法预览 3D</p>
                    </div>
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
        </div>,
        document.body
      )}

      {showUploadModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">上传新模型</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowUploadModal(false)}
                aria-label="关闭上传弹窗"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <ModelUploadArea
                onUploaded={async () => {
                  await loadModels();
                  setShowUploadModal(false);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
