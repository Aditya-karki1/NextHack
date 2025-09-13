// Mock data for EcoChain platform demonstration

export interface Task {
  id: string;
  title: string;
  location: string;
  coordinates: { lat: number; lng: number };
  treeCount: number;
  species: string[];
  status: 'pending' | 'active' | 'completed' | 'verified';
  createdBy: string;
  assignedTo?: string;
  createdDate: string;
  completedDate?: string;
  carbonCredits?: number;
}

export interface CarbonCredit {
  id: string;
  taskId: string;
  amount: number; // tonnes of CO2
  price: number; // USD per tonne
  ngoId: string;
  ngoName: string;
  location: string;
  verificationDate: string;
  status: 'available' | 'sold' | 'retired';
  blockchainHash: string;
}

export interface NGO {
  id: string;
  name: string;
  email: string;
  location: string;
  verified: boolean;
  completedTasks: number;
  totalCredits: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  carbonFootprint: number;
  offsetGoal: number;
  purchasedCredits: number;
}

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Mangrove Restoration Project',
    location: 'Sundarbans, West Bengal',
    coordinates: { lat: 21.9497, lng: 88.9468 },
    treeCount: 500,
    species: ['Rhizophora', 'Avicennia', 'Bruguiera'],
    status: 'pending',
    createdBy: 'West Bengal Forest Dept',
    createdDate: '2024-01-15'
  },
  {
    id: 'task-2',
    title: 'Urban Forest Development',
    location: 'Delhi Ridge Area',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    treeCount: 1000,
    species: ['Neem', 'Peepal', 'Banyan'],
    status: 'active',
    createdBy: 'Delhi Development Authority',
    assignedTo: 'Green Earth NGO',
    createdDate: '2024-01-10'
  },
  {
    id: 'task-3',
    title: 'Coastal Afforestation',
    location: 'Odisha Coastline',
    coordinates: { lat: 19.8135, lng: 85.8312 },
    treeCount: 750,
    species: ['Casuarina', 'Coconut Palm', 'Mangrove'],
    status: 'completed',
    createdBy: 'Odisha Forest Department',
    assignedTo: 'Ocean Guardians NGO',
    createdDate: '2023-12-20',
    completedDate: '2024-01-05',
    carbonCredits: 375
  }
];

export const mockCarbonCredits: CarbonCredit[] = [
  {
    id: 'credit-1',
    taskId: 'task-3',
    amount: 375,
    price: 15,
    ngoId: 'ngo-2',
    ngoName: 'Ocean Guardians NGO',
    location: 'Odisha Coastline',
    verificationDate: '2024-01-08',
    status: 'available',
    blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890'
  },
  {
    id: 'credit-2',
    taskId: 'task-4',
    amount: 250,
    price: 18,
    ngoId: 'ngo-1',
    ngoName: 'Green Earth NGO',
    location: 'Himachal Pradesh',
    verificationDate: '2024-01-12',
    status: 'available',
    blockchainHash: '0x9876543210fedcba0987654321abcdef'
  }
];

export const mockNGOs: NGO[] = [
  {
    id: 'ngo-1',
    name: 'Green Earth NGO',
    email: 'contact@greenearth.org',
    location: 'New Delhi',
    verified: true,
    completedTasks: 15,
    totalCredits: 2250
  },
  {
    id: 'ngo-2',
    name: 'Ocean Guardians NGO',
    email: 'info@oceanguardians.org',
    location: 'Mumbai',
    verified: true,
    completedTasks: 8,
    totalCredits: 1200
  }
];

export const mockCompanies: Company[] = [
  {
    id: 'corp-1',
    name: 'TechCorp Solutions',
    industry: 'Technology',
    carbonFootprint: 5000,
    offsetGoal: 100,
    purchasedCredits: 750
  },
  {
    id: 'corp-2',
    name: 'Manufacturing Ltd',
    industry: 'Manufacturing',
    carbonFootprint: 12000,
    offsetGoal: 80,
    purchasedCredits: 2400
  }
];

// Blockchain simulation
export const mockBlockchainTransactions = [
  {
    id: 'tx-1',
    type: 'mint',
    from: 'EcoChain System',
    to: 'Ocean Guardians NGO',
    amount: 375,
    hash: '0x1a2b3c4d5e6f7890abcdef1234567890',
    timestamp: '2024-01-08T10:30:00Z',
    gasUsed: '0.002 ETH'
  },
  {
    id: 'tx-2',
    type: 'transfer',
    from: 'Ocean Guardians NGO',
    to: 'TechCorp Solutions',
    amount: 100,
    hash: '0x2b3c4d5e6f7890abcdef1234567890ab',
    timestamp: '2024-01-10T14:15:00Z',
    gasUsed: '0.001 ETH'
  }
];