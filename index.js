import { MongoClient, ObjectId } from "mongodb";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET ?? "secreto";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT ?? 5000;
const DB_URL = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME ?? "api";
const USERS = "users";
const PRODUCTS = "products";

const client = new MongoClient(DB_URL);

function verifyToken(request, response, next) {
    const token = request.headers.authorization?.split(" ")[1];

    if (!token)
        return response.status(403).json({ message: "Token requerido" });

    try {
        request.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (err) {
        return response.status(403).json({ message: "Token inválido" });
    }
}

app.post("/api/login", async (request, response) => {
    if (!request.is("json"))
        return response.json({ message: "Debes proporcionar datos JSON" });

    const { nombre, contraseña } = request.body;

    const database = client.db(DB_NAME);
    const collection = database.collection(USERS);

    const Users = await collection.find({}).toArray();

    const user = Users.find((u) => u.nombre == nombre);

    if (user == undefined) {
        return response.json({ message: "Usuario no encontrado" });
    }

    const correctPassword = await bcrypt.compare(contraseña, user.password);

    if (!correctPassword) {
        return response.json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign({ id: user.id, nombre: user.nombre }, SECRET_KEY, {
        expiresIn: "5m",
    });

    response.json({ token });
});

// app.get("/", (request, response) => {
//     response.redirect("/api/users");
// });

// // GET
// app.get("/api/users", async (request, response) => {
//     const database = client.db(DB_NAME);
//     const collection = database.collection(USERS);

//     const results = await collection.find({}).toArray();

//     response.status(200).json(results);
// });

// // POST
// app.post("/api/users", async (request, response) => {
//     if (!request.is("json"))
//         return response.json({ message: "Debes proporcionar datos JSON" });

//     const database = client.db(DB_NAME);
//     const collection = database.collection(USERS);

//     const { nombre, edad } = request.body;
//     const results = await collection.insertOne({ nombre, edad, bcrypt.hash(contraseña, 10) });

//     return response.status(200).json(results);
// });

// // GET
// app.get("/api/users/:id", async (request, response) => {
//     const database = client.db(DB_NAME);
//     const collection = database.collection(USERS);

//     const { id } = request.params;
//     const results = await collection.find({ _id: new ObjectId(id) }).toArray();

//     response.status(200).json(results);
// });

// // PUT
// app.put("/api/users/:id", async (request, response) => {
//     if (!request.is("json"))
//         return response.json({ message: "Debes proporcionar datos JSON" });

//     const database = client.db(DB_NAME);
//     const collection = database.collection(USERS);

//     const { id } = request.params;
//     const { nombre, edad, contraseña } = request.body;
//     const results = await collection.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: { nombre, edad, contraseña } },
//     );

//     response.status(200).json(results);
// });

// // DELETE
// app.delete("/api/users/:id", async (request, response) => {
//     const database = client.db(DB_NAME);
//     const collection = database.collection(USERS);

//     const { id } = request.params;
//     const results = await collection.deleteOne({ _id: new ObjectId(id) });
//     response.status(200).json(results);
// });

// -------------- PRODUCTS ------------------

app.get("/api/products", async (request, response) => {
    const database = client.db(DB_NAME);
    const collection = database.collection(PRODUCTS);

    const results = await collection.find({}).toArray();

    response.status(200).json(results);
});

app.post("/api/products", verifyToken, async (request, response) => {
    if (!request.is("json"))
        return response.json({ message: "Debes proporcionar datos JSON" });

    const database = client.db(DB_NAME);
    const collection = database.collection(PRODUCTS);

    const { nombre, precio } = request.body;
    const results = await collection.insertOne({ nombre, precio });

    return response.status(200).json(results);
});

app.get("/api/products/:id", async (request, response) => {
    const database = client.db(DB_NAME);
    const collection = database.collection(PRODUCTS);

    const { id } = request.params;
    const results = await collection.find({ _id: new ObjectId(id) }).toArray();

    response.status(200).json(results);
});

app.put("/api/products/:id", verifyToken, async (request, response) => {
    if (!request.is("json"))
        return response.json({ message: "Debes proporcionar datos JSON" });

    const database = client.db(DB_NAME);
    const collection = database.collection(PRODUCTS);

    const { id } = request.params;
    const { nombre, precio } = request.body;
    const results = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { nombre, precio } },
    );

    response.status(200).json(results);
});

app.delete("/api/products/:id", verifyToken, async (request, response) => {
    const database = client.db(DB_NAME);
    const collection = database.collection(PRODUCTS);

    const { id } = request.params;
    const results = await collection.deleteOne({ _id: new ObjectId(id) });
    response.status(200).json(results);
});

app.listen(PORT, () => console.log(`Servidor web iniciado en puerto: ${PORT}`));
