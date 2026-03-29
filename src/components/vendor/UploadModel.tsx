'use client';

import { useState, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface UploadModelProps {
  onSuccess?: (product: any) => void;
}

export default function UploadModel({ onSuccess }: UploadModelProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    moq: '1000',
    tags: '',
  });

  const [files, setFiles] = useState<{
    model: File | null;
    thumbnail: File | null;
  }>({
    model: null,
    thumbnail: null,
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        setFiles({ ...files, model: file });
      } else {
        setMessage('请上传 .glb 或 .gltf 格式的 3D 模型');
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!files.model) {
      setMessage('请选择 3D 模型文件');
      return;
    }

    if (!formData.name) {
      setMessage('请输入产品名称');
      return;
    }

    setUploading(true);
    setStatus('uploading');
    setProgress(0);

    try {
      const data = new FormData();
      
      // 添加表单字段
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('moq', formData.moq);
      data.append('tags', formData.tags);
      
      // 默认材质配置
      data.append('materialConfig', JSON.stringify({
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.1,
      }));
      
      // 添加文件
      data.append('model', files.model);
      if (files.thumbnail) {
        data.append('thumbnail', files.thumbnail);
      }

      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/products', {
        method: 'POST',
        body: data,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (result.success) {
        // 上传产品成功后，保存模型资产
        try {
          const modelAssetRes = await fetch('/api/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              filePath: result.data.model_url,
              fileSize: files.model.size,
              originalFilename: files.model.name,
              previewUrl: files.thumbnail ? result.data.thumbnail_url : null,
            }),
          });

          if (!modelAssetRes.ok) {
            console.warn('Model asset save failed, but product was created');
          }
        } catch (error) {
          console.warn('Model asset save error:', error);
        }

        setStatus('success');
        setMessage('产品上传成功！');
        
        // 重置表单
        setFormData({
          name: '',
          description: '',
          price: '',
          moq: '1000',
          tags: '',
        });
        setFiles({ model: null, thumbnail: null });
        
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || '上传失败，请重试');
      }
    } catch (error) {
      setStatus('error');
      setMessage('网络错误，请重试');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传 3D 模型</CardTitle>
        <CardDescription>
          支持 .glb 和 .gltf 格式，文件大小不超过 50MB
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文件上传区域 */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFiles({ ...files, model: e.target.files[0] });
                }
              }}
              className="hidden"
            />

            {files.model ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <p className="font-semibold">{files.model.name}</p>
                <p className="text-sm text-gray-600">
                  {(files.model.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles({ ...files, model: null })}
                >
                  更换文件
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    拖拽文件到此处，或
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    选择文件
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  支持 GLB, GLTF 格式 • 最大 50MB
                </p>
              </div>
            )}
          </div>

          {/* 缩略图上传 */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">缩略图（可选）</Label>
            <Input
              ref={thumbnailInputRef}
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFiles({ ...files, thumbnail: e.target.files[0] });
                }
              }}
            />
          </div>

          {/* 产品信息 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">产品名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="透明PET瓶 500ml"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">产品描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="详细描述产品特点..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">单价 (¥)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moq">最小起订量</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签（用逗号分隔）</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="透明,500ml,PET"
              />
            </div>
          </div>

          {/* 状态消息 */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === 'success'
                  ? 'bg-green-50 text-green-800'
                  : status === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {status === 'success' && <CheckCircle className="h-5 w-5" />}
                {status === 'error' && <XCircle className="h-5 w-5" />}
                {status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* 上传进度 */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>上传进度</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            className="w-full"
            disabled={uploading || !files.model || !formData.name}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              '上传产品'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
