'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { MaterialConfig, ModelPart } from '@/types/database';

interface MaterialControlsProps {
  config: MaterialConfig;
  onChange: (config: MaterialConfig) => void;
  onReset?: () => void;
  parts?: ModelPart[];
  disabled?: boolean;
}

export default function MaterialControls({ config, onChange, onReset, parts = [], disabled = false }: MaterialControlsProps) {
  // null = 编辑全局，string = 编辑某个部件
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const currentPartConfig = selectedPart && config.parts?.[selectedPart]
    ? config.parts[selectedPart]
    : null;

  const currentColor = currentPartConfig?.color ?? config.color ?? '';

  // 获取当前部位原始颜色用于 placeholder
  const placeholderColor = selectedPart
    ? parts.find(p => p.name === selectedPart)?.color ?? ''
    : '';
  const colorPlaceholder = placeholderColor || '请输入色值，如 #ff0000';

  const handleChange = (updates: Partial<{ color: string }>) => {
    if (selectedPart) {
      const existing = config.parts?.[selectedPart] || { color: currentColor };
      const newParts = { ...config.parts, [selectedPart]: { ...existing, ...updates } };
      onChange({ ...config, parts: newParts });
    } else {
      onChange({ ...config, ...updates });
    }
  };

  const handleResetPart = () => {
    if (!selectedPart || !config.parts?.[selectedPart]) return;
    const newParts = { ...config.parts };
    delete newParts[selectedPart];
    if (Object.keys(newParts).length === 0) {
      const { parts: _, ...rest } = config;
      onChange(rest as MaterialConfig);
    } else {
      onChange({ ...config, parts: newParts });
    }
  };

  // 有多个部件时必须先选择部件才能编辑
  const needPartSelection = parts.length > 1 && !selectedPart;
  const editDisabled = disabled || needPartSelection;

  const presetColors = [
    { name: '透明', value: '#ffffff' },
    { name: '琥珀色', value: '#d4a574' },
    { name: '翠绿', value: '#4ade80' },
    { name: '天蓝', value: '#60a5fa' },
    { name: '玫瑰金', value: '#f59e0b' },
    { name: '炭黑', value: '#1f2937' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>材质定制</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 部件选择器 */}
        {parts.length > 1 && (
          <div className="space-y-3">
            <Label>选择部位</Label>
            <div className="flex flex-wrap gap-2">
              {parts.map((part) => {
                const isActive = selectedPart === part.name;
                const hasCustom = !!config.parts?.[part.name];
                return (
                  <button
                    key={part.name}
                    type="button"
                    onClick={() => setSelectedPart(isActive ? null : part.name)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : hasCustom
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                    }`}
                    disabled={disabled}
                  >
                    {part.displayName}
                  </button>
                );
              })}
            </div>
            {selectedPart && (
              <p className="text-xs text-blue-600">
                正在编辑: {parts.find(p => p.name === selectedPart)?.displayName}
              </p>
            )}
            {!selectedPart && (
              <p className="text-xs text-amber-600">
                请先选择一个部位再编辑材质
              </p>
            )}
          </div>
        )}

        {/* 颜色选择 */}
        <div className="space-y-3">
          <Label>颜色</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={currentColor || '#ffffff'}
              onChange={(e) => handleChange({ color: e.target.value })}
              className="h-10 w-20"
              disabled={editDisabled}
            />
            <Input
              value={currentColor}
              onChange={(e) => handleChange({ color: e.target.value })}
              placeholder={colorPlaceholder}
              disabled={editDisabled}
            />
          </div>
          
          {/* 预设颜色 */}
          <div className="grid grid-cols-3 gap-2">
            {presetColors.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleChange({ color: preset.value })}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50"
                disabled={editDisabled}
              >
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: preset.value }}
                />
                <span className="text-sm">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logo上传（占位） */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Logo定制</Label>
          <Button variant="outline" className="w-full" disabled>
            上传Logo (即将推出)
          </Button>
          <p className="text-xs text-gray-500">
            支持 PNG, SVG 格式，透明背景效果最佳
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2">
          {selectedPart && config.parts?.[selectedPart] && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResetPart}
              disabled={disabled}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              还原该部位
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const defaultConfig: MaterialConfig = {};
              onChange(defaultConfig);
              setSelectedPart(null);
              onReset?.();
            }}
            disabled={disabled}
          >
            还原模型材质
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
