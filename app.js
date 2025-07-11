// app.js - IBRE Learning Tracker Application (Fixed Navigation)

class LearningTracker {
  constructor() {
    this.data = null;
    this.completedTasks = new Set();
    this.currentView = 'dashboard';
    this.currentWeek = 1;
    
    this.init();
  }

  init() {
    console.log('Initializing Learning Tracker...');
    
    // Load data from script tag
    this.loadData();
    
    // Load saved progress from localStorage
    this.loadProgress();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize views
    this.initializeDashboard();
    this.initializeWeeklyPlan();
    this.initializeResources();
    
    // Show initial view
    this.showView('dashboard');
    
    console.log('Learning Tracker initialized successfully');
  }

  loadData() {
    try {
      const dataScript = document.getElementById('app-data');
      if (dataScript) {
        this.data = JSON.parse(dataScript.textContent);
        console.log('Data loaded:', this.data);
      } else {
        console.error('Data script not found');
        this.data = { weeks: [], resources: [] };
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = { weeks: [], resources: [] };
    }
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('learning-tracker-progress');
      if (saved) {
        const progress = JSON.parse(saved);
        this.completedTasks = new Set(progress.completedTasks || []);
        this.currentWeek = progress.currentWeek || 1;
        console.log('Progress loaded:', progress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  saveProgress() {
    try {
      const progress = {
        completedTasks: Array.from(this.completedTasks),
        currentWeek: this.currentWeek
      };
      localStorage.setItem('learning-tracker-progress', JSON.stringify(progress));
      console.log('Progress saved:', progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation - Fixed approach
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = e.target.getAttribute('data-view');
        console.log('Navigation clicked:', viewName);
        if (viewName) {
          this.showView(viewName);
        }
      });
    });

    // Week navigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const weekSelect = document.getElementById('week-select');

    if (prevWeekBtn) {
      prevWeekBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentWeek > 1) {
          this.currentWeek--;
          this.updateWeeklyView();
        }
      });
    }

    if (nextWeekBtn) {
      nextWeekBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentWeek < 26) {
          this.currentWeek++;
          this.updateWeeklyView();
        }
      });
    }

    if (weekSelect) {
      weekSelect.addEventListener('change', (e) => {
        this.currentWeek = parseInt(e.target.value);
        this.updateWeeklyView();
      });
    }

    // Resource search and filter
    const resourceSearch = document.getElementById('resource-search');
    const resourceFilter = document.getElementById('resource-filter');

    if (resourceSearch) {
      resourceSearch.addEventListener('input', () => {
        this.filterResources();
      });
    }

    if (resourceFilter) {
      resourceFilter.addEventListener('change', () => {
        this.filterResources();
      });
    }
  }

  showView(viewName) {
    console.log('Showing view:', viewName);
    
    // Hide all views first
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => {
      view.classList.remove('active');
      view.style.display = 'none';
    });
    
    // Show target view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.add('active');
      targetView.style.display = 'block';
      console.log('View shown:', viewName);
    } else {
      console.error('Target view not found:', `${viewName}-view`);
    }

    // Update navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.currentView = viewName;

    // Refresh view-specific data
    if (viewName === 'dashboard') {
      this.updateDashboard();
    } else if (viewName === 'weekly') {
      this.updateWeeklyView();
    } else if (viewName === 'resources') {
      this.filterResources();
    }
  }

  initializeDashboard() {
    this.updateDashboard();
  }

  updateDashboard() {
    const totalTasks = this.getTotalTasks();
    const completedCount = this.completedTasks.size;
    const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    const weeksFinished = this.getWeeksFinished();

    // Update progress bar
    const progressFill = document.getElementById('overall-progress');
    const progressText = document.getElementById('overall-progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${progressPercent}%`;
    }
    if (progressText) {
      progressText.textContent = `${progressPercent}%`;
    }

    // Update stats
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const weeksFinishedEl = document.getElementById('weeks-finished');
    const currentWeekEl = document.getElementById('current-week');

    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedCount;
    if (weeksFinishedEl) weeksFinishedEl.textContent = weeksFinished;
    if (currentWeekEl) currentWeekEl.textContent = this.getCurrentWeekNumber();

    // Update recent activity
    this.updateRecentActivity();
  }

  getTotalTasks() {
    if (!this.data || !this.data.weeks) return 0;
    return this.data.weeks.reduce((total, week) => total + week.tasks.length, 0);
  }

  getWeeksFinished() {
    if (!this.data || !this.data.weeks) return 0;
    return this.data.weeks.filter(week => {
      return week.tasks.every(task => this.completedTasks.has(task.id));
    }).length;
  }

  getCurrentWeekNumber() {
    if (!this.data || !this.data.weeks) return 1;
    // Find the first week with incomplete tasks, or last week if all complete
    for (let week of this.data.weeks) {
      if (week.tasks.some(task => !this.completedTasks.has(task.id))) {
        return week.id;
      }
    }
    return 26; // All weeks complete
  }

  updateRecentActivity() {
    const recentActivityDiv = document.getElementById('recent-activity');
    if (!recentActivityDiv) return;
    
    if (this.completedTasks.size === 0) {
      recentActivityDiv.innerHTML = '<p class="text-secondary">Complete some tasks to see your progress here!</p>';
      return;
    }

    // Show last few completed tasks
    const completedTasksArray = Array.from(this.completedTasks);
    const recentTasks = completedTasksArray.slice(-3).reverse();
    
    let html = '<div class="recent-tasks">';
    recentTasks.forEach(taskId => {
      const task = this.findTaskById(taskId);
      const week = this.findWeekByTaskId(taskId);
      if (task && week) {
        html += `
          <div class="recent-task" style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <span class="status status--success">✓</span>
            <span>${task.text}</span>
            <small class="text-secondary">(Week ${week.id})</small>
          </div>
        `;
      }
    });
    html += '</div>';
    
    recentActivityDiv.innerHTML = html;
  }

  initializeWeeklyPlan() {
    // Populate week selector
    const weekSelect = document.getElementById('week-select');
    if (weekSelect && this.data && this.data.weeks) {
      weekSelect.innerHTML = '';
      this.data.weeks.forEach(week => {
        const option = document.createElement('option');
        option.value = week.id;
        option.textContent = `Week ${week.id}: ${week.theme}`;
        weekSelect.appendChild(option);
      });
    }

    this.updateWeeklyView();
  }

  updateWeeklyView() {
    if (!this.data || !this.data.weeks) return;
    
    const week = this.data.weeks.find(w => w.id === this.currentWeek);
    if (!week) return;

    // Update week selector
    const weekSelect = document.getElementById('week-select');
    if (weekSelect) {
      weekSelect.value = this.currentWeek;
    }

    // Update week details
    const weekTheme = document.getElementById('week-theme');
    if (weekTheme) {
      weekTheme.textContent = `Week ${week.id}: ${week.theme}`;
    }
    
    const goalsList = document.getElementById('week-goals-list');
    if (goalsList) {
      goalsList.innerHTML = '';
      week.goals.forEach(goal => {
        const li = document.createElement('li');
        li.textContent = goal;
        goalsList.appendChild(li);
      });
    }

    // Update tasks
    this.renderWeekTasks(week);

    // Update navigation buttons
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    
    if (prevWeekBtn) {
      prevWeekBtn.disabled = this.currentWeek === 1;
    }
    if (nextWeekBtn) {
      nextWeekBtn.disabled = this.currentWeek === 26;
    }
  }

  renderWeekTasks(week) {
    const tasksContainer = document.getElementById('week-tasks');
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = '';

    week.tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item';
      
      const isCompleted = this.completedTasks.has(task.id);
      
      taskDiv.innerHTML = `
        <input type="checkbox" id="task-${task.id}" ${isCompleted ? 'checked' : ''}>
        <div style="flex: 1;">
          <label for="task-${task.id}" style="cursor: pointer; display: block; margin-bottom: 8px; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${task.text}</label>
          <div class="task-resources">
            ${this.renderTaskResources(task.resourceIds)}
          </div>
        </div>
      `;

      // Add task completion listener
      const checkbox = taskDiv.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', (e) => {
        this.toggleTaskCompletion(task.id, e.target.checked);
      });

      tasksContainer.appendChild(taskDiv);
    });
  }

  renderTaskResources(resourceIds) {
    if (!resourceIds || resourceIds.length === 0 || !this.data || !this.data.resources) return '';
    
    return resourceIds.map(resourceId => {
      const resource = this.data.resources.find(r => r.id === resourceId);
      if (!resource) return '';
      
      return `
        <a href="${resource.url}" target="_blank" class="resource-link" style="margin-right: 12px;">
          ${this.getResourceIcon(resource.type)} ${resource.title}
        </a>
      `;
    }).join('');
  }

  getResourceIcon(type) {
    const icons = {
      article: '📄',
      video: '🎥',
      tutorial: '📖',
      doc: '📋',
      course: '🎓',
      guide: '🗺️',
      cheatsheet: '📝',
      site: '🌐'
    };
    return icons[type] || '📄';
  }

  toggleTaskCompletion(taskId, completed) {
    if (completed) {
      this.completedTasks.add(taskId);
    } else {
      this.completedTasks.delete(taskId);
    }
    
    this.saveProgress();
    this.updateDashboard();
    
    // Update the task styling
    const label = document.querySelector(`label[for="task-${taskId}"]`);
    if (label) {
      if (completed) {
        label.style.textDecoration = 'line-through';
        label.style.opacity = '0.7';
      } else {
        label.style.textDecoration = 'none';
        label.style.opacity = '1';
      }
    }
  }

  initializeResources() {
    this.renderResources();
  }

  renderResources(filteredResources = null) {
    const resourcesGrid = document.getElementById('resources-grid');
    if (!resourcesGrid || !this.data || !this.data.resources) return;
    
    const resources = filteredResources || this.data.resources;
    
    resourcesGrid.innerHTML = '';
    
    resources.forEach(resource => {
      const resourceCard = document.createElement('div');
      resourceCard.className = 'resource-card';
      
      resourceCard.innerHTML = `
        <div class="resource-type">${resource.type}</div>
        <h4>${resource.title}</h4>
        <a href="${resource.url}" target="_blank" class="btn btn--primary" style="margin-top: auto;">
          Open Resource
        </a>
      `;
      
      resourcesGrid.appendChild(resourceCard);
    });
  }

  filterResources() {
    const searchInput = document.getElementById('resource-search');
    const filterSelect = document.getElementById('resource-filter');
    
    if (!searchInput || !filterSelect || !this.data || !this.data.resources) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const typeFilter = filterSelect.value;
    
    let filtered = this.data.resources;
    
    if (searchTerm) {
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(searchTerm) ||
        resource.type.toLowerCase().includes(searchTerm)
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(resource => resource.type === typeFilter);
    }
    
    this.renderResources(filtered);
  }

  findTaskById(taskId) {
    if (!this.data || !this.data.weeks) return null;
    
    for (let week of this.data.weeks) {
      const task = week.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  findWeekByTaskId(taskId) {
    if (!this.data || !this.data.weeks) return null;
    
    for (let week of this.data.weeks) {
      if (week.tasks.some(t => t.id === taskId)) {
        return week;
      }
    }
    return null;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Learning Tracker...');
  try {
    window.learningTracker = new LearningTracker();
  } catch (error) {
    console.error('Error initializing Learning Tracker:', error);
  }
});