const mongoose = require('mongoose');
require('dotenv').config();

// Import your models
const CreditListing = require('../models/CreditListing');
const Ngo = require('../models/Ngo');

const seedCarbonCredits = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Sample realistic carbon credit data
    const creditData = [
      {
        amount: 100,
        price: 1200, // ₹1200 per tonne (realistic price)
        status: 'FOR_SALE',
        projectType: 'Reforestation',
        description: 'Forest restoration project in Western Ghats'
      },
      {
        amount: 50,
        price: 1500, // ₹1500 per tonne
        status: 'FOR_SALE', 
        projectType: 'Renewable Energy',
        description: 'Solar energy project reducing carbon emissions'
      },
      {
        amount: 75,
        price: 1800, // ₹1800 per tonne
        status: 'FOR_SALE',
        projectType: 'Waste Management',
        description: 'Waste-to-energy conversion project'
      },
      {
        amount: 120,
        price: 1000, // ₹1000 per tonne
        status: 'FOR_SALE',
        projectType: 'Agricultural',
        description: 'Sustainable farming practices reducing emissions'
      },
      {
        amount: 80,
        price: 2000, // ₹2000 per tonne
        status: 'FOR_SALE',
        projectType: 'Clean Technology',
        description: 'Advanced carbon capture technology'
      }
    ];

    // First, find an NGO to associate credits with
    let ngo = await Ngo.findOne();
    
    if (!ngo) {
      // Create a sample NGO if none exists
      ngo = new Ngo({
        name: 'EcoGreen Foundation',
        email: 'contact@ecogreen.org',
        role: 'NGO',
        organization: {
          name: 'EcoGreen Foundation',
          type: 'Environmental NGO',
          address: 'Mumbai, Maharashtra, India'
        },
        kycStatus: 'VERIFIED',
        credits: {
          balance: 1000,
          lastUpdated: new Date()
        }
      });
      await ngo.save();
      console.log('Created sample NGO:', ngo.name);
    }

    // Clear existing credits
    await CreditListing.deleteMany({});
    console.log('Cleared existing credit listings');

    // Create new credit listings
    for (const credit of creditData) {
      const newCredit = new CreditListing({
        ...credit,
        ngoId: ngo._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newCredit.save();
      console.log(`Created credit listing: ${credit.projectType} - ₹${credit.price}/tonne - ${credit.amount} tonnes`);
    }

    console.log('\n✅ Carbon credits seeded successfully!');
    console.log(`Total credits created: ${creditData.length}`);
    console.log(`Price range: ₹${Math.min(...creditData.map(c => c.price))} - ₹${Math.max(...creditData.map(c => c.price))} per tonne`);
    
  } catch (error) {
    console.error('Error seeding carbon credits:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeding script
if (require.main === module) {
  seedCarbonCredits();
}

module.exports = seedCarbonCredits;