import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PlayCircle, RotateCcw, Download } from 'lucide-react';

const KMeansCustomerClustering = () => {
  const [customers, setCustomers] = useState([]);
  const [k, setK] = useState(3);
  const [iterations, setIterations] = useState(0);
  const [centroids, setCentroids] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [converged, setConverged] = useState(false);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  // Generate sample customer data
  const generateCustomers = () => {
    const data = [];
    const segments = [
      { rentals: 5, spending: 50, count: 20 },
      { rentals: 15, spending: 150, count: 20 },
      { rentals: 25, spending: 300, count: 20 },
    ];

    let id = 1;
    segments.forEach(seg => {
      for (let i = 0; i < seg.count; i++) {
        data.push({
          id: id++,
          totalRentals: seg.rentals + (Math.random() - 0.5) * 8,
          totalSpending: seg.spending + (Math.random() - 0.5) * 80,
          cluster: -1
        });
      }
    });
    return data;
  };

  // Initialize centroids randomly
  const initializeCentroids = (data, k) => {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, k).map((c, i) => ({
      id: i,
      totalRentals: c.totalRentals,
      totalSpending: c.totalSpending
    }));
  };

  // Calculate Euclidean distance
  const distance = (p1, p2) => {
    return Math.sqrt(
      Math.pow(p1.totalRentals - p2.totalRentals, 2) +
      Math.pow(p1.totalSpending - p2.totalSpending, 2)
    );
  };

  // Assign customers to nearest centroid
  const assignClusters = (data, centroids) => {
    return data.map(customer => {
      let minDist = Infinity;
      let cluster = 0;
      
      centroids.forEach((centroid, idx) => {
        const dist = distance(customer, centroid);
        if (dist < minDist) {
          minDist = dist;
          cluster = idx;
        }
      });
      
      return { ...customer, cluster };
    });
  };

  // Update centroids based on cluster means
  const updateCentroids = (data, k) => {
    const newCentroids = [];
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter(c => c.cluster === i);
      
      if (clusterPoints.length > 0) {
        const avgRentals = clusterPoints.reduce((sum, c) => sum + c.totalRentals, 0) / clusterPoints.length;
        const avgSpending = clusterPoints.reduce((sum, c) => sum + c.totalSpending, 0) / clusterPoints.length;
        
        newCentroids.push({
          id: i,
          totalRentals: avgRentals,
          totalSpending: avgSpending
        });
      } else {
        newCentroids.push(centroids[i]);
      }
    }
    
    return newCentroids;
  };

  // Check if centroids have converged
  const hasConverged = (oldCentroids, newCentroids, threshold = 0.1) => {
    if (!oldCentroids || oldCentroids.length === 0) return false;
    
    for (let i = 0; i < oldCentroids.length; i++) {
      const dist = distance(oldCentroids[i], newCentroids[i]);
      if (dist > threshold) return false;
    }
    return true;
  };

  // Reset clustering
  const reset = () => {
    const newCustomers = generateCustomers();
    setCustomers(newCustomers);
    setCentroids([]);
    setIterations(0);
    setConverged(false);
    setIsRunning(false);
  };

  // Run K-means algorithm
  const runKMeans = () => {
    setIsRunning(true);
    let data = generateCustomers();
    let cents = initializeCentroids(data, k);
    let iter = 0;
    const maxIter = 50;

    const step = () => {
      if (iter >= maxIter) {
        setIsRunning(false);
        setConverged(true);
        return;
      }

      const oldCentroids = [...cents];
      data = assignClusters(data, cents);
      cents = updateCentroids(data, k);
      iter++;

      setCustomers([...data]);
      setCentroids([...cents]);
      setIterations(iter);

      if (hasConverged(oldCentroids, cents)) {
        setIsRunning(false);
        setConverged(true);
      } else {
        setTimeout(step, 500);
      }
    };

    step();
  };

  // Initialize data on mount
  useEffect(() => {
    reset();
  }, []);

  // Get cluster statistics
  const getClusterStats = () => {
    const stats = [];
    for (let i = 0; i < k; i++) {
      const clusterCustomers = customers.filter(c => c.cluster === i);
      if (clusterCustomers.length > 0) {
        const avgRentals = (clusterCustomers.reduce((sum, c) => sum + c.totalRentals, 0) / clusterCustomers.length).toFixed(1);
        const avgSpending = (clusterCustomers.reduce((sum, c) => sum + c.totalSpending, 0) / clusterCustomers.length).toFixed(2);
        stats.push({
          cluster: i,
          count: clusterCustomers.length,
          avgRentals,
          avgSpending
        });
      }
    }
    return stats;
  };

  const clusterStats = iterations > 0 ? getClusterStats() : [];

  // Prepare data for scatter plot
  const chartData = customers.map(c => ({
    ...c,
    totalRentals: parseFloat(c.totalRentals.toFixed(1)),
    totalSpending: parseFloat(c.totalSpending.toFixed(2))
  }));

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Customer Segmentation</h1>
          <p className="text-slate-600 mb-8">K-Means Clustering for Rental Store Customers</p>

          {/* Controls */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">Number of Clusters (K):</label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={k}
                  onChange={(e) => setK(Math.min(5, Math.max(2, parseInt(e.target.value) || 2)))}
                  disabled={isRunning}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={runKMeans}
                disabled={isRunning}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <PlayCircle size={20} />
                {isRunning ? 'Running...' : 'Run Clustering'}
              </button>

              <button
                onClick={reset}
                disabled={isRunning}
                className="flex items-center gap-2 px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <RotateCcw size={20} />
                Reset
              </button>

              <div className="ml-auto text-sm">
                <span className="font-semibold text-slate-700">Iterations:</span>
                <span className="ml-2 text-blue-600 font-bold">{iterations}</span>
                {converged && <span className="ml-3 text-green-600 font-semibold">✓ Converged</span>}
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Customer Distribution</h2>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="totalRentals"
                  name="Total Rentals"
                  label={{ value: 'Total Rentals', position: 'bottom', offset: 40, style: { fontWeight: 'bold' } }}
                  domain={[0, 30]}
                />
                <YAxis
                  type="number"
                  dataKey="totalSpending"
                  name="Total Spending ($)"
                  label={{ value: 'Total Spending ($)', angle: -90, position: 'left', offset: 40, style: { fontWeight: 'bold' } }}
                  domain={[0, 350]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border-2 border-slate-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-slate-800">Customer #{data.id}</p>
                          <p className="text-sm text-slate-600">Rentals: {data.totalRentals.toFixed(1)}</p>
                          <p className="text-sm text-slate-600">Spending: ${data.totalSpending.toFixed(2)}</p>
                          {data.cluster >= 0 && (
                            <p className="text-sm font-semibold mt-1" style={{ color: colors[data.cluster] }}>
                              Cluster {data.cluster + 1}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={() => (
                    <div className="flex justify-center gap-4 mb-2">
                      {Array.from({ length: k }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }}></div>
                          <span className="text-sm font-medium text-slate-700">Cluster {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Scatter data={chartData} fill="#8884d8">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cluster >= 0 ? colors[entry.cluster] : '#94a3b8'} />
                  ))}
                </Scatter>
                {centroids.map((centroid, idx) => (
                  <Scatter
                    key={`centroid-${idx}`}
                    data={[centroid]}
                    fill={colors[idx]}
                    shape="cross"
                    legendType="none"
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Cluster Statistics */}
          {clusterStats.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Cluster Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clusterStats.map(stat => (
                  <div
                    key={stat.cluster}
                    className="bg-white rounded-lg p-5 border-l-4 shadow-sm"
                    style={{ borderColor: colors[stat.cluster] }}
                  >
                    <h3 className="font-bold text-lg mb-3" style={{ color: colors[stat.cluster] }}>
                      Cluster {stat.cluster + 1}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Customers:</span>
                        <span className="font-semibold text-slate-800">{stat.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Rentals:</span>
                        <span className="font-semibold text-slate-800">{stat.avgRentals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Spending:</span>
                        <span className="font-semibold text-slate-800">${stat.avgSpending}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <span className="text-xs font-semibold text-slate-700">
                          {stat.avgRentals < 10 ? '🔵 Low Activity' : 
                           stat.avgRentals < 20 ? '🟢 Medium Activity' : 
                           '🟠 High Activity'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Algorithm Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">How K-Means Works:</h3>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Initialize K random centroids</li>
              <li>Assign each customer to the nearest centroid</li>
              <li>Update centroids to the mean of assigned customers</li>
              <li>Repeat steps 2-3 until convergence</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KMeansCustomerClustering;