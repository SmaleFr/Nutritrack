const routes = {
    '#/dashboard': document.getElementById('dashboard-page'),
    '#/repas': document.getElementById('repas-page'),
    '#/objectif': document.getElementById('objectif-page'),
    '#/statistique': document.getElementById('statistique-page')
  };
  
  function router() {
    const hash = window.location.hash || '#/dashboard';
    
    Object.values(routes).forEach(page => page.classList.add('hidden'));
    
    if (routes[hash]) {
      routes[hash].classList.remove('hidden');
    }
    
    document.querySelectorAll('.sidebar li').forEach(li => {
      li.classList.toggle('active', li.getAttribute('data-page') === hash.replace('#/', ''));
    });
    
    if (hash === '#/statistique' && typeof updateCharts === 'function') {
      updateCharts();
    }
  }
  
  window.addEventListener('hashchange', router);
  
  router();