'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, Package } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  file_path: string;
  preview_url?: string;
  original_filename?: string;
  created_at: string;
}

interface ModelSelectorProps {
  value?: string;
  onChange: (filePath: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      if (data.success) {
        setModels(data.data.models);
      }
    } catch (error) {
      console.error('Load models error:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedModel = models.find((m) => m.file_path === value);

  return (
    <div className="space-y-2">
      <Label>3D 模型（可选）</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="w-full text-left px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm">
            {selectedModel ? (
              <>
                <Package className="h-4 w-4 text-blue-600" />
                {selectedModel.name}
              </>
            ) : (
              <span className="text-gray-500">选择已上传的模型...</span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-10 mt-1 border rounded-lg">
            <CardContent className="p-0">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">加载中...</div>
              ) : models.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">暂无模型，请先上传</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('');
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b"
                    >
                      清除选择
                    </button>
                  )}
                  {models.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        onChange(model.file_path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0 ${
                        value === model.file_path ? 'bg-blue-50 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{model.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {model.original_filename}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(model.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {models.length === 0 && !loading && (
        <p className="text-xs text-gray-500">
          没有可用的模型。请先前往"上传模型"标签页上传 3D 模型。
        </p>
      )}
    </div>
  );
}
