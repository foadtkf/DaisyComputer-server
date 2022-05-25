const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

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
async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("daisy-computer").collection("tools");
    const reviewCollection = client.db("daisy-computer").collection("reviews");
    console.log("Connected");
    // tools
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
    app.delete("/products/:id", async (req, res) => {
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
