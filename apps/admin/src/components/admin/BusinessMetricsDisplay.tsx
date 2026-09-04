'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Globe, Activity } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface BusinessMetricsDisplayProps {
  totalUsers: number;
  totalProjects: number;
  totalRevenue: number;
}

// Generate some mock historical data to make the charts look alive
const generateMockData = (baseValue: number, trend: 'up' | 'stable') => {
  const data = [];
  let currentValue = trend === 'up' ? baseValue * 0.5 : baseValue * 0.9;
  
  for (let i = 0; i < 30; i++) {
    // Add some random noise
    const noise = currentValue * (Math.random() * 0.1 - 0.05);
    currentValue += noise;
    
    // Add upward trend if specified
    if (trend === 'up') {
      currentValue += (baseValue - currentValue) * 0.1;
    }
    
    data.push({ value: currentValue });
  }
  
  // Ensure the last point matches the real current value exactly
  data.push({ value: baseValue });
  return data;
};

export function BusinessMetricsDisplay({
  totalUsers,
  totalProjects,
  totalRevenue,
}: BusinessMetricsDisplayProps) {
  
  const usersData = generateMockData(totalUsers || 100, 'up');
  const projectsData = generateMockData(totalProjects || 50, 'up');
  const revenueData = generateMockData(totalRevenue || 5000, 'up');

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Users Card */}
      <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Total Users
          </CardTitle>
          <Users className="h-4 w-4 text-primary opacity-50" />
        </CardHeader>
        <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
          <div>
            <div className="text-4xl font-bold h-10 tracking-tight">
              <AnimatedNumber value={totalUsers} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registered accounts
            </p>
          </div>

          <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usersData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Total Projects Card */}
      <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Total Projects
          </CardTitle>
          <Globe className="h-4 w-4 text-primary opacity-50" />
        </CardHeader>
        <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
          <div>
            <div className="text-4xl font-bold h-10 tracking-tight">
              <AnimatedNumber value={totalProjects} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active workspaces
            </p>
          </div>

          <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectsData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorProjects)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue Card */}
      <Card className="hover-glow bg-card-glass border-primary/20 flex flex-col overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Total Revenue
          </CardTitle>
          <Activity className="h-4 w-4 text-primary opacity-50" />
        </CardHeader>
        <CardContent className="pb-0 flex-1 flex flex-col justify-between z-10">
          <div>
            <div className="text-4xl font-bold h-10 tracking-tight">
              $<AnimatedNumber value={totalRevenue} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Lifetime MRR
            </p>
          </div>

          <div className="h-20 w-[calc(100%+3rem)] -mx-6 mt-4 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
