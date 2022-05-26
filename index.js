const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require('jsonwebtoken');
app.use(cors())
app.use(express.json())

//middleware
app.use(cors());
app.use(express.json());

// paste the "full driver code example" from mongodb connect to cluster

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sq6of.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJWT(req,res,next){
  const authHeader =req.headers.authorization
  if(!authHeader){
    return res.status(401).send('unauthorized user')
  }
  const token= authHeader.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET , function(err, decoded) {
    if(err){
      return res.status(403).send('forbidden access')
    }
    req.decoded =decoded;
    next()
  });
}
async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("daisy-computer").collection("tools");
    const reviewCollection = client.db("daisy-computer").collection("reviews");
    const userCollection = client.db('daisy-computer').collection('users');
    console.log("Connected");
    // tools

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }
    app.get("/productssix", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);

      let products;
      products = await cursor.toArray();
      if (products.length < 6) products = products.slice(0, 3);
      else products = products.slice(0, 6);
      res.send(products);
      //   console.log(products)
    });
    app.get("/products", async (req, res) => {
      console.log("query", req.query);
      const query = {};
      const cursor = toolsCollection.find(query);
      let products;
      products = await cursor.toArray();
      res.send(products);
      // console.log(products)
    });
    app.post("/products", async (req, res) => {
      const newTool = req.body;
      const result = await  toolsCollection.insertOne(newTool);
      res.send(result);
    });
    app.delete("/products/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });
    // Reviews
    app.get("/reviews", async (req, res) => {
        console.log("query", req.query);
        const query = {};
        const cursor = reviewCollection.find(query);
        let products;
        products = await cursor.toArray();
        res.send(products);
        // console.log(products)
      });
      app.post("/reviews", async (req, res) => {
        const newTool = req.body;
        const result = await  reviewCollection.insertOne(newTool);
        res.send(result);
      });

      // user
      
    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })

    app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("manufacturer server is running");
});
app.listen(port, () => {
  console.log("it is running on ", port);
});
// error occured again
