'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { MaterialConfig } from '@/types/database';

interface MaterialControlsProps {
  config: MaterialConfig;
  onChange: (config: MaterialConfig) => void;
  disabled?: boolean;
}

export default function MaterialControls({ config, onChange, disabled = false }: MaterialControlsProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (updates: Partial<MaterialConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

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
        {/* 颜色选择 */}
        <div className="space-y-3">
          <Label>颜色</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={localConfig.color}
              onChange={(e) => handleChange({ color: e.target.value })}
              className="h-10 w-20"
              disabled={disabled}
            />
            <Input
              value={localConfig.color}
              onChange={(e) => handleChange({ color: e.target.value })}
              placeholder="#ffffff"
              disabled={disabled}
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
                disabled={disabled}
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

        {/* 粗糙度 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>粗糙度</Label>
            <span className="text-sm text-gray-600">{localConfig.roughness.toFixed(2)}</span>
          </div>
          <Slider
            value={[localConfig.roughness]}
            onValueChange={([value]) => handleChange({ roughness: value })}
            min={0}
            max={1}
            step={0.01}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>光滑</span>
            <span>粗糙</span>
          </div>
        </div>

        {/* 金属度 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>金属度</Label>
            <span className="text-sm text-gray-600">{localConfig.metalness.toFixed(2)}</span>
          </div>
          <Slider
            value={[localConfig.metalness]}
            onValueChange={([value]) => handleChange({ metalness: value })}
            min={0}
            max={1}
            step={0.01}
            disabled={disabled}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>非金属</span>
            <span>金属</span>
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

        {/* 重置按钮 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const defaultConfig: MaterialConfig = {
              color: '#ffffff',
              roughness: 0.3,
              metalness: 0.1,
            };
            setLocalConfig(defaultConfig);
            onChange(defaultConfig);
          }}
          disabled={disabled}
        >
          重置为默认
        </Button>
      </CardContent>
    </Card>
  );
}
