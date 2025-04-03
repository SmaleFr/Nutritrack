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

async function updateDashboard() {
  const date = document.getElementById('dashboard-date') ? document.getElementById('dashboard-date').value : new Date().toISOString().split('T')[0];
  
  const totalsData = await apiCall(`/totals/${date}`);
  const totals = totalsData.totals;
  
  document.getElementById('dashboard-calories').textContent = totals.calories;
  document.getElementById('dashboard-proteins').textContent = totals.proteins;
  document.getElementById('dashboard-carbs').textContent = totals.carbs;
  document.getElementById('dashboard-fats').textContent = totals.fats;
  
  const goalsData = await apiCall(`/goals`);
  const goal = goalsData.find(g => g.date === date);
  
  if (goal) {
    const calcProgress = (current, target) => target ? Math.min(100, Math.round((current / target) * 100)) : 0;
    
    document.getElementById('progress-calories').style.width = calcProgress(totals.calories, goal.calories) + '%';
    document.getElementById('progress-proteins').style.width = calcProgress(totals.proteins, goal.proteins) + '%';
    document.getElementById('progress-carbs').style.width = calcProgress(totals.carbs, goal.carbs) + '%';
    document.getElementById('progress-fats').style.width = calcProgress(totals.fats, goal.fats) + '%';
  } else {
    document.querySelectorAll('.progress').forEach(el => el.style.width = '0%');
  }
  
  const recData = await apiCall(`/recommendations/${date}`);
  const recList = document.getElementById('recommendation-list');
  recList.innerHTML = '';
  if (recData.recommendations && Object.keys(recData.recommendations).length > 0) {
    for (let key in recData.recommendations) {
      const p = document.createElement('p');
      p.textContent = `Ajouter ${recData.recommendations[key]} ${key}`;
      recList.appendChild(p);
    }
  } else {
    recList.innerHTML = '<p>Aucune recommandation pour aujourd\'hui.</p>';
  }
}

async function updateMealList() {
  const date = new Date().toISOString().split('T')[0];
  const mealsData = await apiCall('/meals');
  const mealListDiv = document.getElementById('meal-list');
  mealListDiv.innerHTML = '';
  const mealsForDay = mealsData.filter(meal => meal.date === date);
  if (mealsForDay.length === 0) {
    mealListDiv.innerHTML = '<p>Aucun repas enregistré pour aujourd\'hui.</p>';
  } else {
    mealsForDay.forEach(meal => {
      const div = document.createElement('div');
      div.className = 'meal-item';
      div.innerHTML = `<strong>${meal.name}</strong> - Calories: ${meal.calories}, Protéines: ${meal.proteins}, Glucides: ${meal.carbs}, Lipides: ${meal.fats}`;
      mealListDiv.appendChild(div);
    });
  }
}

const showMealFormButton = document.getElementById('show-meal-form');
const mealFormContainer = document.getElementById('meal-form-container');

showMealFormButton.addEventListener('click', () => {
  mealFormContainer.classList.add('active');
});

const closeMealFormButton = document.getElementById('close-meal-form');

closeMealFormButton.addEventListener('click', () => {
  mealFormContainer.classList.remove('active');
});

mealFormContainer.addEventListener('click', (e) => {
  if (e.target === mealFormContainer) {
    mealFormContainer.classList.remove('active');
  }
});

document.getElementById('meal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitButton = e.target.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const date = document.getElementById('meal-date').value;
  const name = document.getElementById('meal-name').value;
  const calories = Number(document.getElementById('meal-calories').value);
  const proteins = Number(document.getElementById('meal-proteins').value);
  const carbs = Number(document.getElementById('meal-carbs').value);
  const fats = Number(document.getElementById('meal-fats').value);
  
  const meal = { date, name, calories, proteins, carbs, fats };
  const result = await apiCall('/meals', 'POST', meal);
  console.log('Meal added:', result);
  
  updateMealList();
  updateDashboard();
  
  e.target.reset();
  mealFormContainer.classList.remove('active');
  submitButton.disabled = false;
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
  
  updateDashboard();
  
  e.target.reset();
});

let barChart, pieChart, barCtx, pieCtx;

document.addEventListener('DOMContentLoaded', () => {
  const barChartElem = document.getElementById('barChart');
  const pieChartElem = document.getElementById('pieChart');

  if (barChartElem && pieChartElem) {
    barCtx = barChartElem.getContext('2d');
    pieCtx = pieChartElem.getContext('2d');
  } else {
    console.error('Les éléments canvas ne sont pas trouvés dans le DOM.');
  }
});

async function updateCharts() {
  const date = new Date().toISOString().split('T')[0];
  const totalsData = await apiCall(`/totals/${date}`);
  const totals = totalsData.totals;

  if (barChart) {
    barChart.data.datasets[0].data = [totals.calories, totals.proteins, totals.carbs, totals.fats];
    barChart.update();
  } else if (barCtx) {
    barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Calories', 'Protéines', 'Glucides', 'Lipides'],
        datasets: [{
          label: 'Apports',
          data: [totals.calories, totals.proteins, totals.carbs, totals.fats],
          backgroundColor: 'rgba(133, 193, 233, 0.5)',
          borderColor: 'rgba(133, 193, 233, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  if (pieChart) {
    pieChart.data.datasets[0].data = [totals.calories, totals.proteins, totals.carbs, totals.fats];
    pieChart.update();
  } else if (pieCtx) {
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Calories', 'Protéines', 'Glucides', 'Lipides'],
        datasets: [{
          data: [totals.calories, totals.proteins, totals.carbs, totals.fats],
          backgroundColor: [
            'rgba(133, 193, 233, 0.5)',
            'rgba(133, 193, 233, 0.6)',
            'rgba(133, 193, 233, 0.7)',
            'rgba(133, 193, 233, 0.8)'
          ]
        }]
      },
      options: { responsive: true }
    });
  }
}

if (document.getElementById('dashboard-page') && !document.getElementById('dashboard-page').classList.contains('hidden')) {
  updateDashboard();
  updateMealList(); 
}