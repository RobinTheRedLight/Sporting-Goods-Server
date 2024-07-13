const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fghxosh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const productCollection = client.db("SportSpot").collection("products");
    const cartCollection = client.db("SportSpot").collection("cart");

    app.get("/products", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });
    //   app.get("/products", async (req, res) => {
    //   try {
    //     const products = await productCollection.find().sort({ createdAt: -1 });
    //     res.json(products);
    //   } catch (error) {
    //     res.status(500).json({ message: "Error fetching products" });
    //   }
    // });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const product = await productCollection.findOne(filter);
      res.send(product);
    });

    app.get("/all-products/:category", async (req, res) => {
      const category = req.params.category;
      console.log(req.params);

      const filter = { category: category };
      const products = await productCollection.find(filter).toArray();
      console.log(products);
      res.send(products);
    });

    app.post("/cart", async (req, res) => {
      const data = req.body;
      const query = { productId: data.productId };
      const existingCartItem = await cartCollection.findOne(query);
      if (existingCartItem) {
        if (existingCartItem.quantity < data.stockQuantity) {
          const updatedCartItem = await cartCollection.updateOne(query, {
            $set: { quantity: existingCartItem.quantity + 1 },
          });
          return res.send(updatedCartItem);
        } else {
          return res.status(400).send({ message: "Stock limit reached" });
        }
      } else {
        const result = await cartCollection.insertOne(data);
        res.send(result);
      }
    });

    app.get("/cart", async (req, res) => {
      const result = await cartCollection.find().toArray();
      console.log(result);
      res.send(result);
    });

    app.put("/cart/:productId", async (req, res) => {
      const productId = req.params.productId;
      const { quantity } = req.body;
      const filter = { productId: productId };
      const updateDoc = {
        $set: { quantity: quantity },
      };
      const result = await cartCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/cart/:productId", async (req, res) => {
      const productId = req.params.productId;
      const filter = { productId: productId };
      const result = await cartCollection.deleteOne(filter);
      res.send(result);
    });
    app.put("/product-stock/:productId", async (req, res) => {
      const productId = req.params.productId;
      const { quantity } = req.body;
      const filter = { _id: new ObjectId(productId) };
      const updateDoc = {
        $inc: { stockQuantity: -quantity },
      };
      const result = await productCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedProduct,
      };
      const result = await productCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(filter);
      res.send(result);
    });
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      newProduct.createdAt = new Date();
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
