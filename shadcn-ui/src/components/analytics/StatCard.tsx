import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant: 'success' | 'info' | 'warning' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, variant, trend }: StatCardProps) {
  const gradients: Record<string, string> = {
    success: 'linear-gradient(90deg, #10b981 0%, #16a34a 100%)', // green
    info: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', // blue
    purple: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', // purple
    warning: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)', // yellow
  };

  const iconColors: Record<string, string> = {
    success: 'rgba(255,255,255,0.95)',
    info: 'rgba(255,255,255,0.95)',
    purple: 'rgba(255,255,255,0.95)',
    warning: 'rgba(0,0,0,0.9)',
  };

  const textMuted = variant === 'warning' ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.9)';

  return (
    <Card style={{ background: gradients[variant], color: variant === 'warning' ? '#000' : '#fff' }} className={`border-0 shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p style={{ color: textMuted }} className="text-sm opacity-90">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <span style={{ color: trend.isPositive ? (variant === 'warning' ? '#047857' : '#bbf7d0') : '#fee2e2' }} className="text-sm font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, background: 'rgba(255,255,255,0.12)' }}>
              <Icon className="w-7 h-7" style={{ color: iconColors[variant] }} />
            </div>
            {/* Mini sparkline */}
            <svg width="80" height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id={`g-${variant}`} x1="0" x2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.9)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polyline points="0,18 16,14 32,10 48,12 64,8 80,6" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="url(#g-${variant})" opacity="0.9" />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}