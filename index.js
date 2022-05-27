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
    const bookingCollection = client.db("daisy-computer").collection("booking")
    const paymentCollection = client.db("daisy-computer").collection("payments")
    console.log("Connected");
    // tools

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        console.log('admin')
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
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const product = await toolsCollection.findOne(query)
      res.send(product)
  })
  app.put('/products/:id', async (req, res) => {
    const id = req.params.id
    const quantity = req.body.newQuantity
    const filter = { _id: ObjectId(id) }
    const updateDoc = {
        $set: { quantity: quantity },
    };
    const product = await toolsCollection.updateOne(filter, updateDoc)
    res.send(product)
})
    // Reviews
    app.get("/reviews", async (req, res) => {
      const user = req.query.email;
      if (user) {
          const query = { email: user }
          const result = await reviewCollection.find(query).toArray()
          res.send(result)
      }
      else {
          const result = await reviewCollection.find().toArray();
          res.send(result)
      }
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

    app.get('/booking', verifyJWT, async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.send(result)
  })
  app.post('/booking', verifyJWT, async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
  })

  app.get('/booking/:id', verifyJWT, async (req, res) => {
      const id = req.params.id
      const query = { _id: ObjectId(id) }
      const booking = await bookingCollection.findOne(query)
      res.send(booking)
  })
  app.delete('/booking/:id', verifyJWT, async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const booking = await bookingCollection.deleteOne(filter)
      res.send(booking)
  })
  app.get('/booking',verifyJWT, async (req, res) => {
      const user = req.query.email;
      const decodedEmail = req.decoded.email
      if (user === decodedEmail) {
          const query = { user: user }
          const bookings = await bookingCollection.find(query).toArray()
          res.send(bookings)
      }
      else {
          return res.status(403).send({ message: "Forbidden access" })
      }
  })
  app.patch('/booking/:id', verifyJWT, async (req, res) => {
      const id = req.params.id
      const payment = req.body
      const filter = { _id: ObjectId(id) }
      const updateDoc = {
          $set: {
              status: 'paid',
              transactionId: payment.transactionId
          },
      };
      const result = await paymentCollection.insertOne(payment)
      const updatedBooking = await bookingCollection.updateOne(filter, updateDoc)
      res.send(updateDoc)
  })
  app.put('/booking/:id', verifyJWT, async (req, res) => {
      const id = req.params.id
      const filter = { _id: ObjectId(id) }
      const updateDoc = {
          $set: {
              status:'ship'
          },
      };
      const updatedBooking = await bookingCollection.updateOne(filter, updateDoc)
      res.send(updateDoc)
  })
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
