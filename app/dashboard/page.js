'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import SidebarLayout from '@/components/sidebar-layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Target
} from 'lucide-react';

const COLORS = {
  Normal: '#10B981',      // Green
  Osteopenia: '#F59E0B',  // Amber
  Osteoporosis: '#EF4444' // Red
};

const HEALTH_STATUS_COLORS = {
  'Good': '#10B981',
  'Stable': '#3B82F6',
  'Monitor Closely': '#F59E0B',
  'Needs Attention': '#EF4444'
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // Fetch user analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/analytics');
          if (response.ok) {
            const data = await response.json();
            setAnalytics(data);
          } else {
            // If API fails, set empty analytics to show no-data state
            console.warn('Analytics API failed, showing no-data state');
            setAnalytics({ total_scans: 0 });
          }
        } catch (error) {
          console.error('Error fetching analytics:', error);
          // Set empty analytics to show no-data state
          setAnalytics({ total_scans: 0 });
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user) {
      fetchAnalytics();
    } else if (status !== 'loading') {
      // If no session and not loading, stop loading state
      setLoading(false);
    }
  }, [session, status]);

  // GSAP animations
  useEffect(() => {
    if (analytics && !loading) {
      gsap.fromTo('.stat-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power2.out' }
      );

      gsap.fromTo('.chart-container',
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, delay: 0.5, ease: 'power2.out' }
      );
    }
  }, [analytics, loading]);

  // Show loading state while checking session
  if (status === 'loading' || loading) {
    return (
      <main className="flex min-h-screen bg-background text-foreground items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  // Prepare chart data
  const timelineData = analytics?.timeline_data?.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    confidenceValue: item.confidence
  })) || [];

  const pieData = Object.entries(analytics?.class_distribution || {}).map(([key, value]) => ({
    name: key,
    value: value,
    color: COLORS[key]
  }));

  const getHealthStatusIcon = (trend) => {
    switch (trend) {
      case 'Good':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Stable':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'Monitor Closely':
        return <TrendingUp className="h-5 w-5 text-amber-500" />;
      case 'Needs Attention':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bone Health Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Track your bone health journey and progress</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
            {session?.user?.image && (
              <div className="relative h-12 w-12 rounded-full border-2 border-primary overflow-hidden">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  fill
                  sizes="48px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-center sm:text-right">
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </motion.div>

        {!analytics || !analytics.total_scans || analytics.total_scans === 0 ? (
          // No data state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-lg shadow-md p-8 border border-border text-center"
          >
            <div className="max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-4">Welcome to your dashboard</h3>
              <p className="text-muted-foreground mb-6">
                Get started with bone health analysis by scanning your first X-ray image.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild className="px-6">
                  <Link href="/dashboard/scan">Scan New X-Ray</Link>
                </Button>
                <Button asChild variant="outline" className="px-6">
                  <Link href="/dashboard/reports">View Reports</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Interactive Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <motion.div
                className="stat-card bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {analytics?.total_scans || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics?.total_scans > 0 ? 'Keep tracking!' : 'Start scanning'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </motion.div>

              <motion.div
                className="stat-card bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {analytics?.confidence_stats?.average ? analytics.confidence_stats.average.toFixed(1) : '0.0'}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics?.confidence_stats?.average > 80 ? 'High accuracy' :
                        analytics?.confidence_stats?.average > 60 ? 'Good accuracy' : 'Building data'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </motion.div>

              <motion.div
                className="stat-card bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Health Status</p>
                    <p className="text-lg font-semibold group-hover:scale-105 transition-transform"
                      style={{ color: HEALTH_STATUS_COLORS[analytics?.health_trend || 'Stable'] }}>
                      {analytics?.health_trend || 'No Data'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics?.health_trend === 'Good' ? 'Excellent progress' :
                        analytics?.health_trend === 'Stable' ? 'Maintaining well' :
                          analytics?.health_trend === 'Monitor Closely' ? 'Stay vigilant' :
                            analytics?.health_trend === 'Needs Attention' ? 'Consult doctor' : 'Start tracking'}
                    </p>
                  </div>
                  <div className="group-hover:scale-110 transition-transform">
                    {getHealthStatusIcon(analytics?.health_trend || 'Stable')}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="stat-card bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border hover:shadow-lg transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latest Result</p>
                    <p className="text-lg font-semibold group-hover:scale-105 transition-transform"
                      style={{ color: timelineData.length > 0 ? COLORS[timelineData[timelineData.length - 1]?.class] : '#6B7280' }}>
                      {timelineData.length > 0 ? timelineData[timelineData.length - 1]?.class || 'N/A' : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timelineData.length > 0 ? 'Recent scan result' : 'No scans yet'}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Interactive Timeline Chart */}
              <div className="chart-container bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Scan Timeline & Confidence</span>
                </h3>
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <AreaChart data={timelineData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        `${value.toFixed(1)}%`,
                        'Confidence'
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceValue"
                      stroke="#3B82F6"
                      fill="url(#colorGradient)"
                      fillOpacity={0.3}
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Distribution Pie Chart */}
              <div className="chart-container bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Diagnosis Distribution</span>
                </h3>
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{
                        color: 'hsl(var(--popover-foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Interactive Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-4">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-xs sm:text-sm font-medium !text-slate-900 dark:!text-slate-100">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Detailed Timeline */}
            <div className="chart-container bg-card rounded-lg shadow-md p-4 sm:p-6 border border-border hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Detailed Scan History</span>
              </h3>
              <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                <BarChart data={timelineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    className="opacity-30"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value.toFixed(1)}%`,
                      'Confidence',
                      <div key="extra" className="text-xs mt-1">
                        Class: {props.payload?.class || 'Unknown'}
                      </div>
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar
                    dataKey="confidenceValue"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Summary Stats */}
              {timelineData.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Highest</p>
                    <p className="text-sm sm:text-base font-semibold text-green-600">
                      {Math.max(...timelineData.map(d => d.confidenceValue)).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Average</p>
                    <p className="text-sm sm:text-base font-semibold text-blue-600">
                      {(timelineData.reduce((sum, d) => sum + d.confidenceValue, 0) / timelineData.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Lowest</p>
                    <p className="text-sm sm:text-base font-semibold text-amber-600">
                      {Math.min(...timelineData.map(d => d.confidenceValue)).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-card rounded-lg shadow-md p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Button asChild className="px-6">
                  <Link href="/dashboard/scan">New Scan</Link>
                </Button>
                <Button asChild variant="outline" className="px-6">
                  <Link href="/dashboard/reports">View All Reports</Link>
                </Button>
                <Button asChild variant="outline" className="px-6">
                  <Link href="/dashboard/profile">Profile Settings</Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </SidebarLayout >
  );
}