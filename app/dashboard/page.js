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
  AreaChart,
  LineChart,
  Line
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

  // Prepare chart data - confidence is already in percentage format from API
  const timelineData = analytics?.timeline_data?.map((item, index) => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    dateTime: format(parseISO(item.date), 'MMM dd HH:mm'), // Include time for uniqueness
    confidenceValue: item.confidence, // API already returns percentage values (e.g., 85.5)
    scanIndex: index, // Add unique index for each scan
    uniqueKey: `${item.date}-${index}` // Unique key for each scan
  })) || [];

  // Timeline data is ready for chart display

  const pieData = Object.entries(analytics?.class_distribution || {}).map(([key, value]) => ({
    name: key,
    value: value,
    color: COLORS[key]
  })).filter(item => item.value > 0) || [];

  // Add fallback data if no data exists
  const displayPieData = pieData.length > 0 ? pieData : [
    { name: 'Normal', value: 0, color: COLORS.Normal },
    { name: 'Osteopenia', value: 0, color: COLORS.Osteopenia },
    { name: 'Osteoporosis', value: 0, color: COLORS.Osteoporosis }
  ];

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
                  <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="uniqueKey"
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value, index) => {
                        // Show clean date format but use unique key internally
                        const dataPoint = timelineData.find(item => item.uniqueKey === value);
                        return dataPoint ? dataPoint.date : value;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px'
                      }}
                      formatter={(value, name, props) => {
                        // Use the exact same value that's shown on the graph
                        const graphValue = props.payload?.confidenceValue;
                        
                        return [
                          `${graphValue.toFixed(1)}%`,
                          'Confidence',
                          props.payload?.class ? `Class: ${props.payload.class}` : ''
                        ];
                      }}
                      labelFormatter={(label) => {
                        // Find the data point and show date with time
                        const dataPoint = timelineData.find(item => item.uniqueKey === label);
                        return dataPoint ? `📅 ${dataPoint.dateTime}` : `📅 ${label}`;
                      }}
                      labelStyle={{
                        color: '#f9fafb',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}
                      itemStyle={{
                        color: '#3B82F6',
                        fontWeight: '700'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceValue"
                      stroke="#3B82F6"
                      fill="url(#colorGradient)"
                      fillOpacity={0.3}
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy } = props;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="#3B82F6"
                            stroke="#ffffff"
                            strokeWidth={2}
                            opacity={1}
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      }}
                      activeDot={false}
                      connectNulls={false}
                    />
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
                    <defs>
                      <filter id="pieGlow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={displayPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {displayPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                          className="hover:opacity-80 transition-all duration-300"
                          onMouseEnter={(e) => {
                            e.target.style.filter = 'url(#pieGlow)';
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.transformOrigin = 'center';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.filter = 'none';
                            e.target.style.transform = 'scale(1)';
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                      formatter={(value, name) => [
                        <span key="value" style={{ color: '#f9fafb', fontWeight: '600' }}>
                          {value} scans ({((value / (displayPieData.reduce((sum, item) => sum + item.value, 0) || 1)) * 100).toFixed(1)}%)
                        </span>,
                        <span key="name" style={{ color: '#d1d5db' }}>
                          {name}
                        </span>
                      ]}
                      labelStyle={{
                        color: '#f9fafb',
                        fontWeight: '600'
                      }}
                      itemStyle={{
                        color: '#f9fafb'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Interactive Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-4">
                  {displayPieData.map((entry, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-300 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-300"
                        style={{
                          backgroundColor: entry.color,
                          boxShadow: `0 0 8px ${entry.color}40`
                        }}
                      ></div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {entry.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.value} scans ({((entry.value / (displayPieData.reduce((sum, item) => sum + item.value, 0) || 1)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </motion.div>
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
                <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.6} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    className="opacity-30"
                  />
                  <XAxis
                    dataKey="uniqueKey"
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value, index) => {
                      // Show clean date format but use unique key internally
                      const dataPoint = timelineData.find(item => item.uniqueKey === value);
                      return dataPoint ? dataPoint.date : value;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    label={{
                      value: 'Confidence (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    formatter={(value, name, props) => [
                      <span key="value" style={{ color: '#3B82F6', fontWeight: '700', fontSize: '16px' }}>
                        {value.toFixed(1)}%
                      </span>,
                      <span key="label" style={{ color: '#d1d5db' }}>
                        Confidence
                      </span>,
                      <div key="extra" style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
                        Class: {props.payload?.class || 'Unknown'}
                      </div>
                    ]}
                    labelFormatter={(label) => {
                      // Find the data point and show date with time
                      const dataPoint = timelineData.find(item => item.uniqueKey === label);
                      return (
                        <span style={{ color: '#f9fafb', fontWeight: '600' }}>
                          📅 {dataPoint ? dataPoint.dateTime : label}
                        </span>
                      );
                    }}
                    labelStyle={{
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar
                    dataKey="confidenceValue"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    className="hover:opacity-90 transition-all duration-300"
                    onMouseEnter={(data, index) => {
                      // Add glow effect on hover
                      const bars = document.querySelectorAll('.recharts-bar-rectangle');
                      if (bars[index]) {
                        bars[index].style.filter = 'url(#glow)';
                        bars[index].style.transform = 'scaleY(1.05)';
                        bars[index].style.transformOrigin = 'bottom';
                      }
                    }}
                    onMouseLeave={(data, index) => {
                      // Remove glow effect
                      const bars = document.querySelectorAll('.recharts-bar-rectangle');
                      if (bars[index]) {
                        bars[index].style.filter = 'none';
                        bars[index].style.transform = 'scaleY(1)';
                      }
                    }}
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