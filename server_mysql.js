const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");

// Crear una instancia de Express
const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Configurar almacenamiento de imágenes con Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// Conexión con la base de datos (usando XAMPP)
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "prueba",
});

db.connect((err) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err);
    } else {
        console.log("Conectado a la base de datos");
    }
});

// Ruta para recibir los datos del formulario y subir imágenes
app.post("/submit", upload.single("imagen"), async (req, res) => {
    const { nombre, password, fecha, descripcion } = req.body;
    const imagen = req.file ? req.file.filename : null;

    try {
        // Encriptar la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        const query =
            "INSERT INTO usuarios (nombre, password, fecha, imagen, descripcion) VALUES (?, ?, ?, ?, ?)";
        db.query(query, [nombre, hashedPassword, fecha, imagen, descripcion], (err, result) => {
            if (err) {
                console.error("Error al insertar los datos:", err);
                res.status(500).json({ message: "Error al guardar los datos" });
            } else {
                res.status(200).json({ message: "Datos guardados correctamente" });
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});

app.get("/usuarios/:id", (req, res) => {
    const userId = parseInt(req.params.id); // Importante: convertir a número si el ID es numérico
    const query = "SELECT * FROM usuarios WHERE id = ?";
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            res.status(500).json({ message: "Error al obtener el usuario" });
        } else if (results.length === 0) {
            res.status(404).json({ message: "Usuario no encontrado" });
        } else {
            res.status(200).json(results[0]); // Envía el primer resultado (debería ser solo uno)
        }
    });
});


// Obtener usuarios
app.get("/usuarios", (req, res) => {
    const query = "SELECT * FROM usuarios";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener los datos:", err);
            res.status(500).json({ message: "Error al obtener los datos" });
        } else {
            res.status(200).json(results);
        }
    });
});

// Eliminar usuario
app.delete("/usuarios/:id", (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM usuarios WHERE id = ?";

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar usuario:", err);
            res.status(500).json({ message: "Error al eliminar usuario" });
        } else {
            res.status(200).json({ message: "Usuario eliminado correctamente" });
        }
    });
});

app.put("/usuarios/:id", upload.single("imagen"), async (req, res) => {
    const { id } = req.params;
    const { nombre, password, fecha, descripcion } = req.body;
    const imagen = req.file ? req.file.filename : null;
    let updatedFields = [];

    let query = "UPDATE usuarios SET ";

    if (nombre) {
        query += "nombre = ?, ";
        updatedFields.push(nombre);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += "password = ?, ";
        updatedFields.push(hashedPassword);
    }

    if (fecha) {
        query += "fecha = ?, ";
        updatedFields.push(fecha);
    }

    if (descripcion) {
        query += "descripcion = ?, ";
        updatedFields.push(descripcion);
    }

    if (imagen) {
        query += "imagen = ?, ";
        updatedFields.push(imagen);
    }

    query = query.slice(0, -2);
    query += " WHERE id = ?";

    updatedFields.push(id);

    db.beginTransaction(err => { // Iniciar transacción
        if (err) {
            console.error("Error al iniciar transacción:", err.stack);
            return res.status(500).json({ message: "Error al actualizar los datos" });
        }

        db.query(query, updatedFields, (err, result) => {
            if (err) {
                return db.rollback(() => { // Revertir transacción en caso de error
                    console.error("Error al actualizar los datos:", err.stack);
                    res.status(500).json({ message: "Error al actualizar los datos" });
                });
            }

            db.commit(err => { // Confirmar transacción
                if (err) {
                    return db.rollback(() => {
                        console.error("Error al confirmar transacción:", err.stack);
                        res.status(500).json({ message: "Error al actualizar los datos" });
                    });
                }

                res.status(200).json({ message: "Usuario actualizado correctamente" });
            });
        });
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});