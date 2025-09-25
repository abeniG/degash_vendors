import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Plus, Eye, Edit, Trash2, Filter, Search, Calendar, DollarSign } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  imageUrl: string;
  rating: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  services: any[];
  orders: any[];
}

const MyEvents: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: events, isLoading } = useQuery('vendor-events', async () => {
    const response = await axios.get('http://localhost:5000/api/events/vendor/my-events');
    return response.data;
  });

  const deleteEventMutation = useMutation(
    (eventId: string) => axios.delete(`http://localhost:5000/api/events/${eventId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendor-events');
      },
    }
  );

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEventMutation.mutateAsync(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
      }
    }
  };

  const filteredEvents = events?.filter((event: Event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCount = (status: string) => {
    return events?.filter((event: Event) => event.status === status).length || 0;
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600">Manage your event packages and services</p>
          </div>
          <Link
            to="/vendor/create-event"
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Link>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{events?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{getStatusCount('APPROVED')}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{getStatusCount('PENDING')}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{getStatusCount('REJECTED')}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
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
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents?.length > 0 ? (
          filteredEvents.map((event: Event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                <img
                  src={event.imageUrl || 'https://picsum.photos/400/300'}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold">{event.basePrice}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">{event.category}</span>
                  <span>{event.services?.length || 0} services</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(event.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/vendor/edit-event/${event.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                      disabled={deleteEventMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first event package'
              }
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <Link
                to="/vendor/create-event"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;