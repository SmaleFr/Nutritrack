// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { compose, pipe } = require('./fp');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/nutritrack', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Error connecting to MongoDB:", err));

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Définition des schémas et modèles
const mealSchema = new mongoose.Schema({
  date: { type: String, required: true },
  name: { type: String, required: true },
  calories: { type: Number, default: 0 },
  proteins: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 }
});
const Meal = mongoose.model('Meal', mealSchema);

const goalSchema = new mongoose.Schema({
  date: { type: String, required: true },
  calories: { type: Number, default: 0 },
  proteins: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 }
});
const Goal = mongoose.model('Goal', goalSchema);

// Middleware d'authentification simple
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Routes RESTful

// POST /meals : Ajouter un repas
app.post('/meals', authMiddleware, async (req, res) => {
  const { date, name, calories, proteins, carbs, fats } = req.body;
  if (!date || !name) {
    return res.status(400).json({ error: 'Invalid meal data' });
  }
  try {
    const meal = new Meal({ date, name, calories, proteins, carbs, fats });
    const savedMeal = await meal.save();
    res.status(201).json(savedMeal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /meals : Récupérer tous les repas
app.get('/meals', authMiddleware, async (req, res) => {
  try {
    const meals = await Meal.find({});
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /goals : Définir un objectif nutritionnel
app.post('/goals', authMiddleware, async (req, res) => {
  const { date, calories, proteins, carbs, fats } = req.body;
  if (!date) {
    return res.status(400).json({ error: 'Invalid goals data' });
  }
  try {
    const goal = new Goal({ date, calories, proteins, carbs, fats });
    const savedGoal = await goal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /goals : Récupérer les objectifs
app.get('/goals', authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({});
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /totals/:date : Calculer les totaux journaliers pour une date donnée
app.get('/totals/:date', authMiddleware, async (req, res) => {
  const { date } = req.params;
  try {
    const meals = await Meal.find({ date });
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      proteins: acc.proteins + (meal.proteins || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0)
    }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });
    res.json({ totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /recommendations/:date : Générer des recommandations nutritionnelles
app.get('/recommendations/:date', authMiddleware, async (req, res) => {
  const { date } = req.params;
  try {
    const meals = await Meal.find({ date });
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      proteins: acc.proteins + (meal.proteins || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0)
    }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });

    const goal = await Goal.findOne({ date });
    if (!goal) {
      return res.status(200).json({ recommendations: {} });
    }
    const recommendations = {};
    if (totals.calories < goal.calories) {
      recommendations.calories = goal.calories - totals.calories;
    }
    if (totals.proteins < goal.proteins) {
      recommendations.proteins = goal.proteins - totals.proteins;
    }
    if (totals.carbs < goal.carbs) {
      recommendations.carbs = goal.carbs - totals.carbs;
    }
    if (totals.fats < goal.fats) {
      recommendations.fats = goal.fats - totals.fats;
    }
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));