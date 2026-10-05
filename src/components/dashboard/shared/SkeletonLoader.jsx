import React from 'react';
import { motion } from 'framer-motion';

// Generic Skeleton wrapper with pulse animation
export const Skeleton = ({ className, style }) => (
  <div 
    className={`bg-slate-200 dark:bg-slate-800 rounded animate-pulse ${className}`} 
    style={style}
  />
);

// Specific Skeleton for KPI Cards
export const KPISkeleton = () => (
  <div className="bg-white dark:bg-[#151822] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 w-full">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-1/3 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
    <div>
      <Skeleton className="h-8 w-1/2 rounded-md mb-2" />
      <Skeleton className="h-3 w-3/4 rounded-full" />
    </div>
  </div>
);

// Specific Skeleton for Tables
export const TableSkeleton = ({ rows = 5 }) => (
  <div className="w-full bg-white dark:bg-[#151822] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
      <Skeleton className="h-5 w-48 rounded-md" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
    {/* Table Rows */}
    <div className="flex flex-col">
      <div className="flex gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <Skeleton className="h-4 w-4 rounded-md shrink-0" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-100 dark:border-slate-800/60 items-center">
          <Skeleton className="h-4 w-4 rounded-md shrink-0" />
          <Skeleton className="h-4 w-[22%] rounded-md" />
          <Skeleton className="h-4 w-[28%] rounded-md" />
          <Skeleton className="h-4 w-[18%] rounded-md" />
          <Skeleton className="h-4 w-[20%] rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

// Specific Skeleton for Charts
export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-[#151822] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col w-full h-[300px]">
    <div className="flex items-center justify-between mb-8">
      <Skeleton className="h-5 w-1/3 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
    <div className="flex-1 flex items-end justify-between gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="w-full rounded-t-md" 
          style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
        />
      ))}
    </div>
  </div>
);
