'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Upload, XCircle } from 'lucide-react';

interface ModelUploadAreaProps {
  onUploaded?: () => void | Promise<void>;
}

export default function ModelUploadArea({ onUploaded }: ModelUploadAreaProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      void handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files && e.target.files[0]) {
      void handleFiles(e.target.files);
    }
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
      const modelName = file.name.replace(/\.(glb|gltf)$/i, '');
      const payload = new FormData();
      payload.append('file', file);
      payload.append('name', modelName);

      const res = await fetch('/api/models/upload', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        throw new Error('保存模型记录失败');
      }

      setUploadStatus('success');
      setUploadMessage('模型上传成功！');

      if (onUploaded) {
        await onUploaded();
      }
    } catch {
      setUploadStatus('error');
      setUploadMessage('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
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
        ref={fileInputRef}
        type="file"
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
              onClick={() => fileInputRef.current?.click()}
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
  );
}
