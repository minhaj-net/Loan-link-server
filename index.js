const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = 3000;
require("dotenv").config();

//Middlewere
app.use(express.json());
app.use(cors());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.iesbwy6.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("loanLInkDb");
    const loansCollection = db.collection("loans");
    const applicationCollection = db.collection("applicationCollection");
    const userCollection = db.collection("user");
    //user related APIs
    app.post("/user", async (req, res) => {
      try {
        const userData = req.body;
        userData.created_at = new Date().toISOString();
        userData.last_loggedIn = new Date().toISOString();
        userData.role = "borrower";

        const query = { email: userData.email };
        const alreadyExists = await userCollection.findOne(query);
        console.log("user already exits in database ", !!alreadyExists);
        if (alreadyExists) {
          console.log("Updatinf user info.........");
          const result = await userCollection.updateOne(query, {
            $set: {
              last_loggedIn: new Date().toISOString(),
            },
          });
          return res.send(result);
        }

        console.log("saving new user  info.........");
        console.log(userData);
        const result = await userCollection.insertOne(userData);

        res.status(201).json({
          success: true,
          message: "User saved successfully",
          result: result,
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });
    app.get("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    // get all users
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // update user role and status
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const { role, status, suspendReason, suspendFeedback } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role,
          status: status,
          suspendReason: suspendReason,
          suspendFeedback: suspendFeedback,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //Loans api
    app.get("/all-loans", async (req, res) => {
      const result = await loansCollection.find().toArray();
      res.send(result);
    });
    // for availabe loand
    app.get("/available-loans", async (req, res) => {
      const result = await loansCollection.find().limit(6).toArray();
      res.send(result);
    });
    app.post("/all-loans", async (req, res) => {
      const data = req.body;
      data.createdAt = new Date().toISOString(); 
      // console.log(data);
      //code deploy korar jonno test
      const result = await loansCollection.insertOne(data);
      res.send(result);
    });
    //for loan details
    app.get("/all-loans/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await loansCollection.findOne(query);

      console.log(id);
      res.send(result);
    });
    // post method from application
    app.post("/application-loan", async (req, res) => {
      try {
        const loanData = req.body;
        console.log("Received:", loanData);

        // Example: Database e insert (MongoDB হলে)
        const result = await applicationCollection.insertOne(loanData);

        res.status(201).send({
          success: true,
          message: "Loan Data Received",
          result: result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Server Error",
        });
      }
    });
    app.get("/application-loan", async (req, res) => {
      const result = await applicationCollection.find().toArray();
      res.send(result);
    });

    //update admin loan data
    app.put("/all-loans/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const result = loansCollection.updateOne(query, update);

      res.send(result);
    });
    //delete admin all loan
    app.delete("/all-loans/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await loansCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Course deleted successfully" });
        } else {
          res.status(404).json({ message: "Course not found 404" });
        }
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
