import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, ShoppingCart, DollarSign, TrendingUp, Eye, Plus, Calendar, User } from 'lucide-react';

const VendorDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery('vendor-stats', async () => {
    const response = await axios.get('http://localhost:5000/api/vendor/dashboard/stats');
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: Package,
      color: 'blue',
      link: '/vendor/my-events'
    },
    {
      title: 'Pending Events',
      value: stats?.pendingEvents || 0,
      icon: Eye,
      color: 'yellow',
      link: '/vendor/my-events'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'green',
      link: '/vendor/orders'
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue || 0}`,
      icon: DollarSign,
      color: 'purple',
      link: '/vendor/orders'
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <Link
            to="/vendor/create-event"
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Event
          </Link>
          <Link
            to="/vendor/my-events"
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-5 w-5 mr-2" />
            View My Events
          </Link>
          <Link
            to="/vendor/orders"
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
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
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
              <Link to="/vendor/my-events" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {stats?.recentEvents?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.category} • ${event.basePrice}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No events created yet</p>
                <Link to="/vendor/create-event" className="text-indigo-600 hover:text-indigo-500 text-sm">
                  Create your first event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/vendor/orders" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {stats?.recentOrders?.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{order.event.title}</p>
                        <p className="text-sm text-gray-600">
                          {order.customerName} • {new Date(order.eventDate).toLocaleDateString()}
                        </p>
                      </div>
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
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No orders received yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Performance charts will be displayed here</p>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;