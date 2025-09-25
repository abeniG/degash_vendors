import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Clock,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery('admin-stats', async () => {
    const response = await axios.get('http://localhost:5000/api/admin/dashboard/stats');
    return response.data;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Vendors',
      value: stats?.totalVendors || 0,
      icon: Users,
      color: 'blue',
      link: '/admin/vendors'
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: Package,
      color: 'green',
      link: '/admin/pending-events'
    },
    {
      title: 'Pending Events',
      value: stats?.pendingEvents || 0,
      icon: Clock,
      color: 'yellow',
      link: '/admin/pending-events'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'purple',
      link: '/admin/orders'
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${card.color}-100`}>
                <card.icon className={`h-6 w-6 text-${card.color}-600`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="p-6">
          {stats?.recentOrders?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.event.title}</p>
                    <p className="text-sm text-gray-600">
                      {order.vendor.user.name} • {new Date(order.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.totalAmount}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;