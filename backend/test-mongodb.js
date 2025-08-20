import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testMongoDBConnection = async () => {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('🌍 Database host:', conn.connection.host);
    console.log('📊 Database name:', conn.connection.name);
    console.log('🔗 Connection state:', conn.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Test basic operations
    console.log('\n🧪 Testing basic database operations...');
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📁 Collections in database:', collections.length);
    
    if (collections.length > 0) {
      console.log('📂 Existing collections:');
      collections.forEach(col => console.log(`   - ${col.name}`));
    } else {
      console.log('📂 No collections found (this is normal for a new database)');
    }
    
    // Test a simple write operation
    const testCollection = conn.connection.db.collection('connection_test');
    const testDoc = {
      message: 'MongoDB Atlas connection test',
      timestamp: new Date(),
      project: 'MamaCare'
    };
    
    await testCollection.insertOne(testDoc);
    console.log('✅ Write test successful');
    
    // Test read operation
    const doc = await testCollection.findOne({ project: 'MamaCare' });
    console.log('✅ Read test successful');
    
    // Clean up test document
    await testCollection.deleteOne({ _id: doc._id });
    console.log('✅ Cleanup successful');
    
    console.log('\n🎉 All database tests passed!');
    console.log('🚀 Your MamaCare project is ready to use MongoDB Atlas');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error('📄 Error message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔑 Authentication Error Solutions:');
      console.error('   1. Check username and password in connection string');
      console.error('   2. Ensure user has proper database permissions');
      console.error('   3. Verify user exists in MongoDB Atlas');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('\n🌐 Network Error Solutions:');
      console.error('   1. Check internet connection');
      console.error('   2. Verify cluster URL is correct');
      console.error('   3. Ensure IP is whitelisted (use 0.0.0.0/0 for testing)');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔌 Connection Error Solutions:');
      console.error('   1. For local MongoDB: Ensure MongoDB is running');
      console.error('   2. For Atlas: Check cluster is active');
      console.error('   3. Verify port 27017 is not blocked');
    }
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔐 Database connection closed');
  }
};

// Run the test
testMongoDBConnection();
