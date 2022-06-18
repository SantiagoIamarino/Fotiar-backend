const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongo = null

const connect = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
  }

  await mongoose.connect(uri, mongooseOpts)

}

const disconnect = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongo.stop()
}

const clearDB = async () => {
  const collections = Object.keys(mongoose.connection.collections)

  for(const key of collections) {
    const collection = mongoose.connection.collections[key]
    await collection.deleteMany()
  }
}

module.exports = {
  connect,
  disconnect,
  clearDB 
}