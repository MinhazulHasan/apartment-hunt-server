const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const port = 5000;
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const { ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('services'));
app.use(fileUpload());



app.get('/', (req, res) => {
    res.send("Hello There")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdyuw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const housesCollection = client.db("apartmentHunt").collection("houses");
    const bookingsCollection = client.db("apartmentHunt").collection("bookings");

    app.post('/addHouse', (req, res) => {
        const title = req.body.title;
        const price = req.body.price;
        const location = req.body.location;
        const bedroom = req.body.bedroom;
        const bathroom = req.body.bathroom;

        const file = req.files.file;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        housesCollection.insertOne({ title, price, location, bedroom, bathroom, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
            .catch(err => {
                console.log(err);
            })
    })

    app.get('/houses', (req, res) => {
        housesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.get('/apartment/:apartmentId', (req, res) => {
        housesCollection.find({ _id: ObjectId(req.params.apartmentId) })
            .toArray((err, document) => {
                res.status(200).send(document[0]);
            })
    })


    app.post('/addBooking', (req, res) => {
        bookingsCollection.insertOne(req.body)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/allBookings', (req, res) => {
        bookingsCollection.find({})
            .toArray((err, documents) => {
                res.status(200).send(documents);
            })
    })

    app.patch('/updateStatus', (req, res) => {
        bookingsCollection.updateOne(
            { _id: ObjectId(req.body.id) },
            {
                $set: { status: req.body.updatedStatus },
                $currentDate: { "lastModified": true }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })
});

app.listen(process.env.PORT || port, () => console.log(`Listening to port http://localhost:${port}`))