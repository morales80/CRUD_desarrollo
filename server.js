const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configuración del servidor
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/usuarios')
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
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
