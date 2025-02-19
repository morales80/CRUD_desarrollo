const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongoose').Types;

// Configuración del servidor
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/basecrud')
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Definir esquema y modelo de usuario
const UserSchema = new mongoose.Schema({
    nombre: String,
    password: String,
    fecha: Date,
    imagen: String,
    descripcion: String
});

const User = mongoose.model('User', UserSchema);

// Ruta para obtener todos los usuarios
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Ruta para obtener un usuario por ID
app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID no válido' });
    }

    try {
        const user = await User.findById(id); // Buscar el usuario por su ID
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user); // Responde con los datos del usuario
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// Ruta para agregar un usuario
app.post('/api/users', async (req, res) => {
    try {
        const { nombre, password, fecha, imagen, descripcion } = req.body;
        const newUser = new User({ nombre, password, fecha, imagen, descripcion });
        await newUser.save();
        res.status(201).json({ message: 'Usuario agregado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar usuario' });
    }
});

// Ruta para eliminar un usuario
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID no válido' });
    }

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});


// Ruta para actualizar un usuario
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, password, fecha, imagen, descripcion } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID no válido' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id, // ID del usuario que queremos actualizar
            { nombre, password, fecha, imagen, descripcion }, // Nuevos datos
            { new: true } // Devuelve el documento actualizado
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario actualizado correctamente', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
