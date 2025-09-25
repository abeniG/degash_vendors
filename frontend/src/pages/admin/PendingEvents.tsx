import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Check, X, Eye, Package } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  status: string;
  vendor: {
    companyName: string;
    user: {
      name: string;
      email: string;
    };
  };
  services: any[];
}

const PendingEvents: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data: events, isLoading } = useQuery('pending-events', async () => {
    const response = await axios.get('http://localhost:5000/api/admin/events/pending');
    return response.data;
  });

  const updateStatusMutation = useMutation(
    ({ eventId, status }: { eventId: string; status: string }) =>
      axios.patch(`http://localhost:5000/api/admin/events/${eventId}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pending-events');
      },
    }
  );

  const handleStatusUpdate = (eventId: string, status: string) => {
    updateStatusMutation.mutate({ eventId, status });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Events</h1>
        <p className="text-gray-600">Review and approve event submissions from vendors</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Events Awaiting Approval ({events?.length || 0})
          </h2>
        </div>
        
        <div className="p-6">
          {events?.length > 0 ? (
            <div className="space-y-6">
              {events.map((event: Event) => (
                <div key={event.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-gray-600">{event.category} • ${event.basePrice}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted by: {event.vendor.user.name} ({event.vendor.companyName})
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(event.id, 'APPROVED')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(event.id, 'REJECTED')}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Services Included:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {event.services.map((service) => (
                        <div key={service.id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{service.name}</span>
                          <span className="font-medium">${service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No pending events</h3>
              <p className="text-gray-600">All events have been reviewed and processed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingEvents;