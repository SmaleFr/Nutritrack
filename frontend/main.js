// main.js

const API_URL = 'http://localhost:3000';
const token = 'demo-token';

const apiCall = async (endpoint, method = 'GET', data) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(API_URL + endpoint, options);
  return response.json();
};

document.getElementById('meal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('meal-date').value;
  const name = document.getElementById('meal-name').value;
  const calories = Number(document.getElementById('meal-calories').value);
  const proteins = Number(document.getElementById('meal-proteins').value);
  const carbs = Number(document.getElementById('meal-carbs').value);
  const fats = Number(document.getElementById('meal-fats').value);

  const meal = { date, name, calories, proteins, carbs, fats };
  const result = await apiCall('/meals', 'POST', meal);
  console.log('Meal added:', result);
  updateDashboard(date);
});

document.getElementById('goal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('goal-date').value;
  const calories = Number(document.getElementById('goal-calories').value);
  const proteins = Number(document.getElementById('goal-proteins').value);
  const carbs = Number(document.getElementById('goal-carbs').value);
  const fats = Number(document.getElementById('goal-fats').value);

  const goal = { date, calories, proteins, carbs, fats };
  const result = await apiCall('/goals', 'POST', goal);
  console.log('Goal set:', result);
  updateDashboard(date);
});

const updateDashboard = async (date) => {
  const totalsData = await apiCall(`/totals/${date}`);
  const totalsDiv = document.getElementById('totals');
  totalsDiv.innerHTML = `<h3>Totaux pour ${date}</h3>
    <p>Calories: ${totalsData.totals.calories}</p>
    <p>Protéines: ${totalsData.totals.proteins}</p>
    <p>Glucides: ${totalsData.totals.carbs}</p>
    <p>Lipides: ${totalsData.totals.fats}</p>`;

  // Récupération des recommandations
  const recData = await apiCall(`/recommendations/${date}`);
  const recDiv = document.getElementById('recommendation-list');
  recDiv.innerHTML = `<h3>Recommandations</h3>`;
  for (let key in recData.recommendations) {
    recDiv.innerHTML += `<p>Ajouter ${recData.recommendations[key]} ${key}</p>`;
  }

  updateChart(totalsData.totals);
};

let chart;
const ctx = document.getElementById('progressChart').getContext('2d');
const updateChart = (totals) => {
  const data = {
    labels: ['Calories', 'Protéines', 'Glucides', 'Lipides'],
    datasets: [{
      label: 'Apports',
      data: [totals.calories, totals.proteins, totals.carbs, totals.fats],
      backgroundColor: ['rgba(75,192,192,0.2)'],
      borderColor: ['rgba(75,192,192,1)'],
      borderWidth: 1
    }]
  };
  if (chart) {
    chart.data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
};