'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw, Search } from 'lucide-react';
import type { MaterialConfig, ModelPart, SurfaceFinishType } from '@/types/database';

// ── 潘通色卡 ──────────────────────────────────────────
interface PantoneColor { code: string; hex: string }

const PANTONE_COLORS: PantoneColor[] = [
  // 红色系
  { code: 'Pantone 185 C', hex: '#e4002b' },
  { code: 'Pantone 186 C', hex: '#c8102e' },
  { code: 'Pantone 199 C', hex: '#d50032' },
  { code: 'Pantone 200 C', hex: '#ba0c2f' },
  { code: 'Pantone 201 C', hex: '#9b2335' },
  { code: 'Pantone 202 C', hex: '#862633' },
  { code: 'Pantone 032 C', hex: '#ef3340' },
  { code: 'Pantone 1788 C', hex: '#ee2737' },
  { code: 'Pantone 1795 C', hex: '#d22630' },
  // 橙色系
  { code: 'Pantone 021 C', hex: '#fe5000' },
  { code: 'Pantone 151 C', hex: '#ff8200' },
  { code: 'Pantone 152 C', hex: '#e57200' },
  { code: 'Pantone 158 C', hex: '#e87722' },
  { code: 'Pantone 1585 C', hex: '#ff8f1c' },
  { code: 'Pantone 165 C', hex: '#ff6900' },
  { code: 'Pantone 172 C', hex: '#fa4616' },
  // 黄色系
  { code: 'Pantone 109 C', hex: '#ffd100' },
  { code: 'Pantone 116 C', hex: '#ffcd00' },
  { code: 'Pantone 123 C', hex: '#ffc72c' },
  { code: 'Pantone 1235 C', hex: '#ffb81c' },
  { code: 'Pantone 130 C', hex: '#f2a900' },
  { code: 'Pantone Yellow C', hex: '#fedd00' },
  { code: 'Pantone 7405 C', hex: '#f0b323' },
  { code: 'Pantone 7406 C', hex: '#f1be48' },
  // 绿色系
  { code: 'Pantone 347 C', hex: '#009639' },
  { code: 'Pantone 348 C', hex: '#00843d' },
  { code: 'Pantone 349 C', hex: '#046a38' },
  { code: 'Pantone 355 C', hex: '#009a44' },
  { code: 'Pantone 356 C', hex: '#007a33' },
  { code: 'Pantone 361 C', hex: '#43b02a' },
  { code: 'Pantone 368 C', hex: '#78be20' },
  { code: 'Pantone 375 C', hex: '#97d700' },
  { code: 'Pantone 3282 C', hex: '#00857c' },
  { code: 'Pantone 3288 C', hex: '#006a4e' },
  // 蓝色系
  { code: 'Pantone 286 C', hex: '#0032a0' },
  { code: 'Pantone 287 C', hex: '#003087' },
  { code: 'Pantone 288 C', hex: '#002d72' },
  { code: 'Pantone 289 C', hex: '#0c2340' },
  { code: 'Pantone 293 C', hex: '#003da5' },
  { code: 'Pantone 300 C', hex: '#005eb8' },
  { code: 'Pantone 301 C', hex: '#004b87' },
  { code: 'Pantone 072 C', hex: '#10069f' },
  { code: 'Pantone 2728 C', hex: '#0057b8' },
  { code: 'Pantone 2935 C', hex: '#0057b8' },
  { code: 'Pantone 279 C', hex: '#418fde' },
  { code: 'Pantone 284 C', hex: '#6cace4' },
  { code: 'Pantone 542 C', hex: '#6399ae' },
  { code: 'Pantone Process Blue C', hex: '#0085ca' },
  // 紫色系
  { code: 'Pantone 2685 C', hex: '#3c1053' },
  { code: 'Pantone 267 C', hex: '#59118e' },
  { code: 'Pantone 2587 C', hex: '#8246af' },
  { code: 'Pantone 2592 C', hex: '#9b26b6' },
  { code: 'Pantone 2602 C', hex: '#822980' },
  { code: 'Pantone 2612 C', hex: '#6d2077' },
  { code: 'Pantone 2655 C', hex: '#a7a2c3' },
  { code: 'Pantone Violet C', hex: '#440099' },
  // 粉色系
  { code: 'Pantone 1767 C', hex: '#fbabb5' },
  { code: 'Pantone 1775 C', hex: '#e06287' },
  { code: 'Pantone 1787 C', hex: '#f4364c' },
  { code: 'Pantone 1895 C', hex: '#f5a4c7' },
  { code: 'Pantone 210 C', hex: '#f99fc9' },
  { code: 'Pantone 211 C', hex: '#f57eb6' },
  { code: 'Pantone 219 C', hex: '#da1884' },
  { code: 'Pantone 226 C', hex: '#d60270' },
  // 棕色/咖色
  { code: 'Pantone 161 C', hex: '#603d20' },
  { code: 'Pantone 1615 C', hex: '#c05131' },
  { code: 'Pantone 174 C', hex: '#964b00' },
  { code: 'Pantone 469 C', hex: '#6a3d0a' },
  { code: 'Pantone 4625 C', hex: '#4f2c1d' },
  { code: 'Pantone 7526 C', hex: '#a45a2a' },
  { code: 'Pantone 7567 C', hex: '#89532f' },
  // 灰色/黑白
  { code: 'Pantone Black C', hex: '#2d2926' },
  { code: 'Pantone Black 7 C', hex: '#3e3a39' },
  { code: 'Pantone Cool Gray 1 C', hex: '#d9d9d6' },
  { code: 'Pantone Cool Gray 3 C', hex: '#c8c9c7' },
  { code: 'Pantone Cool Gray 5 C', hex: '#b1b3b3' },
  { code: 'Pantone Cool Gray 7 C', hex: '#97999b' },
  { code: 'Pantone Cool Gray 9 C', hex: '#75787b' },
  { code: 'Pantone Cool Gray 11 C', hex: '#53565a' },
  { code: 'Pantone Warm Gray 1 C', hex: '#d7d2cb' },
  { code: 'Pantone Warm Gray 5 C', hex: '#b6ada5' },
  { code: 'Pantone Warm Gray 9 C', hex: '#83786f' },
  { code: 'Pantone Warm Gray 11 C', hex: '#6e6259' },
  { code: 'Pantone White C', hex: '#ffffff' },
  // 金属/特殊
  { code: 'Pantone 871 C', hex: '#b4a76c' },
  { code: 'Pantone 872 C', hex: '#ac8e68' },
  { code: 'Pantone 873 C', hex: '#a07d4e' },
  { code: 'Pantone 874 C', hex: '#dab965' },
  { code: 'Pantone 877 C', hex: '#8a8d8f' },
  { code: 'Pantone 8003 C', hex: '#c39e6e' },
];

const ALL_FINISHES: SurfaceFinishType[] = [
  'injection-color',
  'paint-matte',
  'electroplated-glossy',
  'electroplated-matte',
  'glass',
];

const FINISH_LABELS: Record<SurfaceFinishType, string> = {
  'injection-color': '注塑色',
  'paint-matte': '喷漆哑',
  'electroplated-glossy': '电镀亮',
  'electroplated-matte': '电镀哑',  'glass': '玻璃',};

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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pantoneSearch, setPantoneSearch] = useState('');

  const currentPartConfig = selectedPart && config.parts?.[selectedPart]
    ? config.parts[selectedPart]
    : null;

  const currentColor = currentPartConfig?.color ?? config.color ?? '';
  const currentFinish = currentPartConfig?.finish ?? config.surfaceFinish;
  const hasPartSurfaceConfig = !!config.partSurfaceOptions;
  const availableFinishes = selectedPart
    ? (hasPartSurfaceConfig ? config.partSurfaceOptions?.[selectedPart] || [] : ALL_FINISHES)
    : ALL_FINISHES;

  // 根据当前 hex 找到匹配的潘通色号
  const currentPantone = PANTONE_COLORS.find(
    (p) => p.hex.toLowerCase() === currentColor.toLowerCase()
  );

  // 搜索过滤
  const filteredPantone = useMemo(() => {
    if (!pantoneSearch.trim()) return PANTONE_COLORS;
    const q = pantoneSearch.trim().toLowerCase();
    return PANTONE_COLORS.filter((p) => p.code.toLowerCase().includes(q));
  }, [pantoneSearch]);

  const handleChange = (updates: Partial<{ color: string; finish: SurfaceFinishType }>) => {
    if (selectedPart) {
      const existing = config.parts?.[selectedPart] || { color: currentColor || '#ffffff' };
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

        {/* 颜色选择（潘通色号） */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <Label className="shrink-0">颜色：</Label>
            <button
              type="button"
              onClick={() => {
                if (!editDisabled) {
                  setShowColorPicker((v) => !v);
                  setPantoneSearch('');
                }
              }}
              disabled={editDisabled}
              className="flex items-center gap-2 rounded border border-gray-300 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1"
              title="点击选择潘通色号"
            >
              <div
                className="w-8 h-6 rounded border shrink-0"
                style={{ backgroundColor: currentColor || '#ffffff' }}
              />
              <span className="text-xs text-gray-700 whitespace-nowrap">
                {currentPantone ? currentPantone.code : '选择色号'}
              </span>
            </button>
          </div>

          {/* 潘通色号浮层 */}
          {showColorPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl bg-white shadow-xl border p-3 space-y-2">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    value={pantoneSearch}
                    onChange={(e) => setPantoneSearch(e.target.value)}
                    placeholder="搜索色号，如 185、Blue、Gray…"
                    className="pl-8 h-9 text-sm"
                    autoFocus
                  />
                </div>

                {/* 色号列表 */}
                <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-0.5">
                  {filteredPantone.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">无匹配色号</p>
                  ) : (
                    filteredPantone.map((p) => {
                      const isActive = currentColor.toLowerCase() === p.hex.toLowerCase();
                      return (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => {
                            handleChange({ color: p.hex });
                            setShowColorPicker(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors ${
                            isActive
                              ? 'bg-blue-50 border border-blue-400'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div
                            className="w-7 h-5 rounded border shrink-0"
                            style={{ backgroundColor: p.hex }}
                          />
                          <span className="text-xs font-medium text-gray-800 flex-1">{p.code}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{p.hex}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 表面工艺 */}
        <div className="space-y-3 pt-1">
          <Label>表面工艺</Label>
          {needPartSelection ? (
            <p className="text-xs text-amber-600">请先选择部位查看可选工艺</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {availableFinishes.map((finish) => (
                  <button
                    key={finish}
                    type="button"
                    onClick={() => handleChange({ finish })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                      currentFinish === finish
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                    }`}
                    disabled={editDisabled}
                  >
                    {FINISH_LABELS[finish]}
                  </button>
                ))}
              </div>
              {selectedPart && availableFinishes.length === 0 && (
                <p className="text-xs text-amber-600">当前部位未配置可选工艺</p>
              )}
            </>
          )}
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
