import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Users, Mail, Phone, MapPin, ToggleLeft, ToggleRight, Trash2, Eye } from 'lucide-react';

interface Vendor {
  id: string;
  companyName: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  events: any[];
  orders: any[];
}

const VendorManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: vendors, isLoading } = useQuery('vendors', async () => {
    const response = await axios.get('http://localhost:5000/api/admin/vendors');
    return response.data;
  });

  const toggleVendorStatus = useMutation(
    ({ vendorId, isActive }: { vendorId: string; isActive: boolean }) =>
      axios.patch(`http://localhost:5000/api/admin/vendors/${vendorId}/status`, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
      },
    }
  );

  const handleToggleStatus = (vendorId: string, currentStatus: boolean) => {
    toggleVendorStatus.mutate({ vendorId, isActive: !currentStatus });
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
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-gray-600">Manage vendor accounts and their status</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All Vendors ({vendors?.length || 0})
            </h2>
          </div>
        </div>

        <div className="p-6">
          {vendors?.length > 0 ? (
            <div className="space-y-6">
              {vendors.map((vendor: Vendor) => (
                <div key={vendor.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {vendor.companyName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            vendor.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{vendor.user.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{vendor.user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{vendor.phone}</span>
                        </div>
                        <div className="flex items-center md:col-span-3">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{vendor.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleStatus(vendor.id, vendor.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          vendor.isActive
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={vendor.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {vendor.isActive ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <span>
                        <strong>{vendor.events?.length || 0}</strong> Events
                      </span>
                      <span>
                        <strong>{vendor.orders?.length || 0}</strong> Orders
                      </span>
                      <span>
                        Joined: {new Date(vendor.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No vendors found</h3>
              <p className="text-gray-600">No vendors have registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorManagement;