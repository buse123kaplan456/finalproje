const cors = require('cors');
const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

// MongoDB URI
const uri = "mongodb+srv://busekaplan937:1234@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority";
const databaseName = 'ecommerce';
const collectionName = 'products';

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const filename = file.originalname;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ürün ekleme endpoint'i
app.post('/api/products', upload.single('product_image'), async (req, res) => {
  const client = new MongoClient(uri);
  const { product_name, product_price } = req.body;
  const product_image = req.file ? req.file.filename : null;

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    const result = await collection.insertOne({
      product_name,
      product_price,
      product_image
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('MongoDB bağlantısında bir hata oluştu:', error);
    res.status(500).send('Bir hata oluştu.');
  } finally {
    await client.close();
  }
});

// Ürünleri listeleme endpoint'i
app.get('/api/products', async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    const products = await collection.find().toArray();
    res.status(200).json(products);
  } catch (error) {
    console.error('MongoDB bağlantısında bir hata oluştu:', error);
    res.status(500).send('Bir hata oluştu.');
  } finally {
    await client.close();
  }
});

// Ürün arama endpoint'i
app.get('/api/products/search', async (req, res) => {
  const client = new MongoClient(uri);
  const { query } = req.query;

  try {
    await client.connect();
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    const products = await collection.find({ 
      product_name: { $regex: query, $options: 'i' } 
    }).toArray();
    res.status(200).json(products);
  } catch (error) {
    console.error('MongoDB bağlantısında bir hata oluştu:', error);
    res.status(500).send('Bir hata oluştu.');
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
