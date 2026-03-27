'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileBox, CheckCircle, XCircle } from 'lucide-react';

interface ModelUploadProps {
  vendorId: string;
  onUploadComplete: () => void;
}

export default function ModelUpload({ vendorId, onUploadComplete }: ModelUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    
    // 验证文件类型
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      setUploadStatus('error');
      setMessage('只支持 .glb 或 .gltf 格式的文件');
      return;
    }

    // 验证文件大小 (最大 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus('error');
      setMessage('文件大小不能超过 50MB');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');
    setMessage('');

    try {
      // TODO: 使用上传 API
      // const formData = new FormData();
      // formData.append('file', file);
      // const res = await fetch('/api/upload/model', {
      //   method: 'POST',
      //   body: formData,
      // });
      // if (!res.ok) throw new Error('上传失败');
      
      setUploadStatus('success');
      setMessage('模型上传成功！');
      onUploadComplete();
      
      // 3秒后重置状态
      setTimeout(() => {
        setUploadStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setMessage('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传3D模型</CardTitle>
        <CardDescription>
          支持 .glb 和 .gltf 格式，文件大小不超过 50MB
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
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
            type="file"
            id="file-upload"
            className="hidden"
            accept=".glb,.gltf"
            onChange={handleChange}
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center gap-4">
            {uploadStatus === 'idle' && (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    拖拽文件到此处，或
                  </p>
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      disabled={uploading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mt-2"
                    >
                      {uploading ? '上传中...' : '选择文件'}
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  支持 GLB, GLTF 格式 • 最大 50MB
                </p>
              </>
            )}

            {uploadStatus === 'success' && (
              <div className="flex flex-col items-center gap-2 text-green-600">
                <CheckCircle className="h-12 w-12" />
                <p className="text-lg font-semibold">{message}</p>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex flex-col items-center gap-2 text-red-600">
                <XCircle className="h-12 w-12" />
                <p className="text-lg font-semibold">{message}</p>
                <Button
                  variant="outline"
                  onClick={() => setUploadStatus('idle')}
                  className="mt-2"
                >
                  重新上传
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">💡 上传提示</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 建议使用优化后的模型，减少顶点数和纹理大小</li>
            <li>• 使用 Draco 压缩可以大幅减小文件体积</li>
            <li>• 确保模型的中心点和旋转轴正确设置</li>
            <li>• 推荐使用 PBR 材质以获得最佳渲染效果</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
