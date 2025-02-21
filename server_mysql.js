const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const fs = require('fs');
const path = require('path');

// Crear una instancia de Express
const app = express();
const port = 4000;

app.use(cors());
app.use(express.json()); // Usar solo express.json()

// Crear la carpeta "uploads" si no existe xd
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Configurar almacenamiento de imágenes con Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + "-" + file.originalname;
        console.log("Ruta de la imagen guardada:", path.join(__dirname, 'uploads', filename));
        cb(null, filename);
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
        const query =
            "INSERT INTO usuarios (nombre, password, fecha, imagen, descripcion) VALUES (?, ?, ?, ?, ?)";
        db.query(query, [nombre, password, fecha, imagen, descripcion], (err, result) => {
            if (err) {
                console.error("Error al insertar los datos:", err);
                res.status(500).json({ message: "Error al guardar los datos" });
            } else {
                res.status(200).json({ message: "Datos guardados correctamente" });
            }
        });
    } catch (error) {
        console.error("Error en el servidor:", error);
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

    try {
        let query = "UPDATE usuarios SET ";
        const updates = [];
        const values = [];

        if (nombre) {
            updates.push("nombre = ?");
            values.push(nombre);
        }
        if (password) {
            updates.push("password = ?");
            values.push(password);
        }
        if (fecha) {
            updates.push("fecha = ?");
            values.push(fecha);
        }
        if (descripcion) {
            updates.push("descripcion = ?");
            values.push(descripcion);
        }
        if (imagen) {
            updates.push("imagen = ?");
            values.push(imagen);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No hay campos para actualizar" });
        }

        query += updates.join(", ");
        query += " WHERE id = ?";
        values.push(id);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error al actualizar usuario:", err);
                return res.status(500).json({ message: "Error al actualizar usuario" });
            }
            res.status(200).json({ message: "Usuario actualizado correctamente" });
        });
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
