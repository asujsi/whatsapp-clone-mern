import express from "express";
import mongoose from "mongoose";
import Messages from "./model/dbMessages.js";
import Pusher from "pusher";
import Cors from "Cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

//middleware
app.use(express.json());
app.use(Cors());

//DB config
const connection_url =
  "mongodb+srv://admin:yhWBF7IeweU3ekxG@cluster0.7z7tn.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose
  .connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("Database Connected"))
  .catch((err) => console.log(`Database Not Connected ${err}`));

const db = mongoose.connection;
db.once("open", () => {
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

const pusher = new Pusher({
  appId: "1397546",
  key: "05616c5e9a3ec1c8703e",
  secret: "2574311c268d4b4d5e3d",
  cluster: "ap2",
  useTLS: true,
});

//api routes
app.get("/", (req, res) => {
  res.status(200).send("hello world");
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const message = req.body;
  Messages.create(message, (err, data) => {
    if (err) {
      res.status(500).send(err);
      console.log(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`Listening on port: ${port}`));
