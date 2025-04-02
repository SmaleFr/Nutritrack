// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const { compose, pipe } = require('./fp');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

const DB_FILE = path.join(__dirname, 'db.json');

const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return { meals: [], goals: [] };
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};


app.post('/meals', authMiddleware, (req, res) => {
  const { date, name, calories, proteins, carbs, fats } = req.body;
  if (!date || !name) {
    return res.status(400).json({ error: 'Invalid meal data' });
  }
  const db = readDB();
  const newMeal = { id: Date.now(), date, name, calories, proteins, carbs, fats };
  db.meals.push(newMeal);
  writeDB(db);
  res.status(201).json(newMeal);
});

app.get('/meals', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.meals);
});

app.post('/goals', authMiddleware, (req, res) => {
  const { date, calories, proteins, carbs, fats } = req.body;
  if (!date) {
    return res.status(400).json({ error: 'Invalid goals data' });
  }
  const db = readDB();
  const newGoal = { id: Date.now(), date, calories, proteins, carbs, fats };
  db.goals.push(newGoal);
  writeDB(db);
  res.status(201).json(newGoal);
});

app.get('/goals', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.goals);
});

app.get('/totals/:date', authMiddleware, (req, res) => {
  const { date } = req.params;
  const db = readDB();
  const mealsForDay = db.meals.filter(meal => meal.date === date);

    const totals = mealsForDay.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    proteins: acc.proteins + (meal.proteins || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fats: acc.fats + (meal.fats || 0)
  }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });

  res.json({ totals });
});

app.get('/recommendations/:date', authMiddleware, (req, res) => {
  const { date } = req.params;
  const db = readDB();
  const mealsForDay = db.meals.filter(meal => meal.date === date);
  const totals = mealsForDay.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    proteins: acc.proteins + (meal.proteins || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fats: acc.fats + (meal.fats || 0)
  }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });
  
  const goal = db.goals.find(g => g.date === date);
  if (!goal) {
    return res.status(404).json({ error: 'No goals found for this date' });
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});