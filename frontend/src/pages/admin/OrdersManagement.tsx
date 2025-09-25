import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { ShoppingCart, Calendar, User, Package, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  eventDate: string;
  totalAmount: number;
  advancePaid: number;
  status: string;
  createdAt: string;
  event: {
    title: string;
    category: string;
  };
  vendor: {
    companyName: string;
    user: {
      name: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
}

const OrdersManagement: React.FC = () => {
  const { data: orders, isLoading } = useQuery('admin-orders', async () => {
    const response = await axios.get('http://localhost:5000/api/admin/orders');
    return response.data;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600">View and manage all customer orders</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Orders ({orders?.length || 0})
          </h2>
        </div>

        <div className="p-6">
          {orders?.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.event.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          <span>{order.vendor.companyName}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{new Date(order.eventDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>${order.totalAmount} (Advance: ${order.advancePaid})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>Phone: {order.phone}</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      ID: {order.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
              <p className="text-gray-600">No orders have been placed yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;