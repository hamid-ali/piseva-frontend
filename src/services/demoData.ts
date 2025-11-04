// Mock data for demo mode
export const mockServices = [
  {
    _id: 'demo1',
    title: 'Professional Home Cleaning',
    description: 'Complete home cleaning service with experienced professionals. We handle everything from basic cleaning to deep cleaning services.',
    category: 'Cleaning',
    provider: {
      _id: 'provider1',
      name: 'Sarah Johnson',
      rating: { average: 4.8, count: 156 },
      location: { coordinates: [-74.006, 40.7128], address: 'New York, NY' },
      serviceCategories: ['Cleaning'],
      businessHours: {}
    },
    pricing: { type: 'fixed' as const, amount: 50, currency: 'USD', unit: 'service' },
    duration: { estimated: 120, unit: 'minutes' as const },
    location: {
      coordinates: [-74.006, 40.7128] as [number, number],
      address: 'New York, NY',
      serviceRadius: 15
    },
    availability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlots: [{ start: '09:00', end: '17:00', available: true }]
    },
    tags: ['cleaning', 'home', 'professional'],
    requirements: ['Access to cleaning supplies', 'Clear pathways'],
    rating: { average: 4.8, count: 89 },
    bookingsCount: { total: 89, completed: 85 },
    metadata: { views: 234, inquiries: 45, popularityScore: 95 },
    images: [],
    isActive: true,
    isVerified: true,
    createdAt: '2025-10-15T10:00:00.000Z',
    updatedAt: '2025-11-04T08:00:00.000Z'
  },
  {
    _id: 'demo2',
    title: 'Expert Electrical Repairs',
    description: 'Licensed electrician providing safe and reliable electrical repair services. Available for emergency calls.',
    category: 'Electrical',
    provider: {
      _id: 'provider2',
      name: 'Mike Rodriguez',
      rating: { average: 4.9, count: 203 },
      location: { coordinates: [-74.006, 40.7128], address: 'Brooklyn, NY' },
      serviceCategories: ['Electrical'],
      businessHours: {}
    },
    pricing: { type: 'hourly' as const, amount: 75, currency: 'USD', unit: 'hour' },
    duration: { estimated: 60, unit: 'minutes' as const },
    location: {
      coordinates: [-74.006, 40.7128] as [number, number],
      address: 'Brooklyn, NY',
      serviceRadius: 20
    },
    availability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      timeSlots: [{ start: '08:00', end: '18:00', available: true }]
    },
    tags: ['electrical', 'repair', 'licensed', 'emergency'],
    requirements: ['Access to electrical panel', 'Clear work area'],
    rating: { average: 4.9, count: 124 },
    bookingsCount: { total: 124, completed: 120 },
    metadata: { views: 456, inquiries: 67, popularityScore: 120 },
    images: [],
    isActive: true,
    isVerified: true,
    createdAt: '2025-10-10T10:00:00.000Z',
    updatedAt: '2025-11-04T08:00:00.000Z'
  },
  {
    _id: 'demo3',
    title: 'Plumbing Services',
    description: 'Fast and reliable plumbing services for all your needs. From leaky faucets to major pipe repairs.',
    category: 'Plumbing',
    provider: {
      _id: 'provider3',
      name: 'David Chen',
      rating: { average: 4.7, count: 178 },
      location: { coordinates: [-74.006, 40.7128], address: 'Manhattan, NY' },
      serviceCategories: ['Plumbing'],
      businessHours: {}
    },
    pricing: { type: 'fixed' as const, amount: 85, currency: 'USD', unit: 'service' },
    duration: { estimated: 90, unit: 'minutes' as const },
    location: {
      coordinates: [-74.006, 40.7128] as [number, number],
      address: 'Manhattan, NY',
      serviceRadius: 25
    },
    availability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlots: [{ start: '07:00', end: '19:00', available: true }]
    },
    tags: ['plumbing', 'repair', 'installation', 'emergency'],
    requirements: ['Access to plumbing fixtures', 'Water shut-off access'],
    rating: { average: 4.7, count: 98 },
    bookingsCount: { total: 98, completed: 93 },
    metadata: { views: 345, inquiries: 52, popularityScore: 87 },
    images: [],
    isActive: true,
    isVerified: true,
    createdAt: '2025-10-05T10:00:00.000Z',
    updatedAt: '2025-11-04T08:00:00.000Z'
  }
];

export const mockUser = {
  _id: 'demo-user',
  name: 'Demo User',
  email: 'demo@piseva.com',
  userType: 'customer',
  location: {
    coordinates: [-74.006, 40.7128],
    address: 'New York, NY'
  },
  rating: { average: 5.0, count: 0 }
};

export const mockBookings = [
  {
    _id: 'booking1',
    service: mockServices[0],
    provider: mockServices[0].provider,
    customer: mockUser,
    status: 'completed',
    scheduledDate: '2025-11-01T10:00:00.000Z',
    createdAt: '2025-10-28T15:30:00.000Z',
    pricing: { quotedAmount: 50, finalAmount: 50 }
  }
];

// Demo mode detection
export const isDemoMode = () => {
  return process.env.REACT_APP_DEMO_MODE === 'true' || 
         !process.env.REACT_APP_API_BASE_URL || 
         process.env.REACT_APP_API_BASE_URL.includes('your-backend-url');
};