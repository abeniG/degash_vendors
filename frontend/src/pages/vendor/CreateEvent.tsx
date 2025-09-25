import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

interface ServiceForm {
  name: string;
  description: string;
  price: number;
  isIncluded: boolean;
}

interface EventForm {
  title: string;
  description: string;
  category: string;
  basePrice: number;
  imageUrl: string;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<EventForm>();
  const [services, setServices] = useState<ServiceForm[]>([]);
  const [newService, setNewService] = useState<ServiceForm>({
    name: '',
    description: '',
    price: 0,
    isIncluded: true,
  });

  const createEventMutation = useMutation(
    (eventData: any) => axios.post('http://localhost:5000/api/events', eventData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendor-events');
        navigate('/vendor/my-events');
      },
    }
  );

  const onSubmit = (data: EventForm) => {
    const eventData = {
      ...data,
      services: services.map(service => ({
        ...service,
        price: Number(service.price),
      })),
    };
    
    createEventMutation.mutate(eventData);
  };

  const addService = () => {
    if (newService.name && newService.description) {
      setServices([...services, { ...newService }]);
      setNewService({
        name: '',
        description: '',
        price: 0,
        isIncluded: true,
      });
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const categories = [
    'Wedding',
    'Birthday',
    'Bridal Shower',
    'Corporate',
    'Anniversary',
    'Graduation',
    'Baby Shower',
    'Other'
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Event Package</h1>
        <p className="text-gray-600">Add a new event package with services and pricing</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Event Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                {...register('description', { required: 'Description is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('basePrice', { 
                  required: 'Base price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.basePrice && (
                <p className="text-red-500 text-sm mt-1">{errors.basePrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                {...register('imageUrl')}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Services</h2>
          
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={addService}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </button>
          </div>

          {services.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Added Services:</h3>
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{service.name}</span>
                    <span className="text-gray-600 ml-2">- {service.description}</span>
                    <span className="text-blue-600 ml-2">${service.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/vendor/my-events')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createEventMutation.isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createEventMutation.isLoading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;