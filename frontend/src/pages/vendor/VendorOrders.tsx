import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { ShoppingCart, Filter, Search, Calendar, User, Phone, DollarSign, Check, X, Clock } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  eventDate: string;
  comments?: string;
  totalAmount: number;
  advancePaid: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  event: {
    id: string;
    title: string;
    category: string;
  };
}

const VendorOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: orders, isLoading } = useQuery('vendor-orders', async () => {
    const response = await axios.get('http://localhost:5000/api/vendor/orders');
    return response.data;
  });

  const updateOrderStatus = useMutation(
    ({ orderId, status }: { orderId: string; status: string }) =>
      axios.patch(`http://localhost:5000/api/orders/${orderId}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendor-orders');
      },
    }
  );

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  const filteredOrders = orders?.filter((order: Order) => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCount = (status: string) => {
    return orders?.filter((order: Order) => order.status === status).length || 0;
  };

  const getTotalRevenue = () => {
    return orders?.reduce((total: number, order: Order) => total + order.totalAmount, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">Manage and track customer orders for your events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{getStatusCount('PENDING')}</p>
            </div>
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{getStatusCount('CONFIRMED')}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{getStatusCount('COMPLETED')}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">${getTotalRevenue()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by customer or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Orders ({filteredOrders?.length || 0})
          </h2>
        </div>

        <div className="p-6">
          {filteredOrders?.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{order.event.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{order.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{new Date(order.eventDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {order.comments && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <strong>Comments:</strong> {order.comments}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 lg:mt-0 lg:ml-4 lg:text-right">
                      <div className="mb-2">
                        <p className="text-lg font-semibold text-gray-900">
                          ${order.totalAmount}
                        </p>
                        <p className="text-sm text-gray-600">
                          Advance: ${order.advancePaid}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Ordered: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          disabled={updateOrderStatus.isLoading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                          className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          disabled={updateOrderStatus.isLoading}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={updateOrderStatus.isLoading}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark Complete
                      </button>
                    )}
                    {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                      <span className="text-sm text-gray-500 italic">
                        This order is {order.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No orders have been placed for your events yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;