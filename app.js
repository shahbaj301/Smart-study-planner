// Enhanced Smart Study Planner - Production Ready
class SmartStudyPlanner {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("smartStudyTasks")) || [];
    this.profile = JSON.parse(localStorage.getItem("smartStudyProfile")) || {
      name: "",
      avatar: "👩‍🎓",
      theme: "light"
    };
    this.currentSection = "home";
    this.productivityChart = null;
    this.achievements = [];
    this.filters = { search: "", status: "all", priority: "all" };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadProfile();
    this.renderTasks();
    this.updateStats();
    this.initAchievements();
    this.setupTheme();
    this.hideLoadingSpinner();
    this.setupPWA();
    this.setupKeyboardShortcuts();
    
    // Auto-save every 30 seconds
    setInterval(() => this.autoSave(), 30000);
  }

  hideLoadingSpinner() {
    setTimeout(() => {
      const spinner = document.getElementById("loadingSpinner");
      if (spinner) {
        spinner.classList.add("hidden");
        setTimeout(() => spinner.remove(), 300);
      }
    }, 1000);
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('[onclick^="navigateTo"]').forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        const section = element.getAttribute('onclick').match(/'([^']+)'/)[1];
        this.navigateTo(section);
      });
    });

    // Task form
    const taskForm = document.getElementById("taskForm");
    taskForm?.addEventListener("submit", (e) => this.handleTaskSubmit(e));

    // Search and filter
    const searchInput = document.getElementById("taskSearch");
    searchInput?.addEventListener("input", this.debounce((e) => {
      this.filters.search = e.target.value.toLowerCase();
      this.renderTasks();
    }, 300));

    const filterSelect = document.getElementById("taskFilter");
    filterSelect?.addEventListener("change", (e) => {
      this.filters.status = e.target.value;
      this.renderTasks();
    });

    // Profile inputs
    const profileName = document.getElementById("profileName");
    profileName?.addEventListener("input", this.debounce(() => this.saveProfile(), 500));

    const avatarSelect = document.getElementById("avatarSelect");
    avatarSelect?.addEventListener("change", () => {
      this.updateProfilePreview();
      this.saveProfile();
    });

    // Theme toggle
    const themeToggle = document.getElementById("toggleThemeBtn");
    themeToggle?.addEventListener("click", () => this.toggleTheme());

    // Keyboard navigation
    document.addEventListener("keydown", (e) => this.handleKeyboardShortcuts(e));

    // Mobile menu
    const mobileToggle = document.querySelector(".mobile-menu-toggle");
    mobileToggle?.addEventListener("click", () => this.toggleMobileMenu());
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  navigateTo(sectionId) {
    // Hide all sections
    document.querySelectorAll(".main-section").forEach(section => {
      section.classList.remove("active");
    });

    // Show target section with animation
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      setTimeout(() => {
        targetSection.classList.add("active");
        
        // Lazy load chart if dashboard is opened
        if (sectionId === "dashboard" && !window.Chart) {
          window.loadChartJS();
        }
        
        // Update stats when viewing about
        if (sectionId === "about") {
          this.animateStats();
        }
      }, 100);
    }

    // Update navigation active state
    document.querySelectorAll(".nav-links a").forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${sectionId}`) {
        link.classList.add("active");
      }
    });

    this.currentSection = sectionId;
  }

  handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskInput = document.getElementById("taskInput");
    const dueDateInput = document.getElementById("dueDateInput");
    const prioritySelect = document.getElementById("prioritySelect");
    const categorySelect = document.getElementById("categorySelect");

    // Clear previous errors
    this.clearFormErrors();

    // Validate inputs
    const errors = this.validateTaskForm({
      title: taskInput.value.trim(),
      dueDate: dueDateInput.value,
      priority: prioritySelect.value,
      category: categorySelect.value
    });

    if (Object.keys(errors).length > 0) {
      this.showFormErrors(errors);
      return;
    }

    // Check if updating existing task
    const isUpdate = e.target.dataset.updating;
    
    if (isUpdate) {
      this.updateTask(parseInt(isUpdate), {
        title: taskInput.value.trim(),
        dueDate: dueDateInput.value,
        priority: prioritySelect.value,
        category: categorySelect.value || "general"
      });
    } else {
      this.addTask({
        title: taskInput.value.trim(),
        dueDate: dueDateInput.value,
        priority: prioritySelect.value,
        category: categorySelect.value || "general",
        completed: false,
        createdAt: new Date().toISOString(),
        id: Date.now()
      });
    }

    // Reset form
    this.resetTaskForm();
  }

  validateTaskForm(data) {
    const errors = {};
    
    if (!data.title || data.title.length < 3) {
      errors.title = "Task title must be at least 3 characters long";
    }
    
    if (!data.dueDate) {
      errors.dueDate = "Please select a due date";
    } else if (new Date(data.dueDate) < new Date().setHours(0, 0, 0, 0)) {
      errors.dueDate = "Due date cannot be in the past";
    }
    
    if (!data.priority) {
      errors.priority = "Please select a priority level";
    }

    return errors;
  }

  showFormErrors(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = document.getElementById(`${field}Error`) || 
                          document.getElementById(`${field}InputError`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add("show");
      }
    });
  }

  clearFormErrors() {
    document.querySelectorAll(".form-error").forEach(error => {
      error.textContent = "";
      error.classList.remove("show");
    });
  }

  addTask(taskData) {
    this.tasks.unshift(taskData);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.checkAchievements();
    this.showToast("Task added successfully! 🎉", "success");
    
    // Add entrance animation
    setTimeout(() => {
      const firstTask = document.querySelector(".task-card");
      if (firstTask) {
        firstTask.style.animation = "slideInFromLeft 0.6s ease forwards";
      }
    }, 100);
  }

  updateTask(id, updatedData) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedData };
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.showToast("Task updated successfully! ✏️", "success");
    }
  }

  deleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      // Add exit animation
      const taskElement = document.querySelector(`[data-task-id="${id}"]`);
      if (taskElement) {
        taskElement.style.animation = "slideInFromRight 0.3s ease reverse";
        setTimeout(() => {
          this.tasks.splice(taskIndex, 1);
          this.saveTasks();
          this.renderTasks();
          this.updateStats();
          this.showToast("Task deleted successfully! 🗑️", "success");
        }, 300);
      }
    }
  }

  toggleTaskComplete(id) {
    const task = this.tasks.find(task => task.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.checkAchievements();
      
      const message = task.completed ? 
        "Great job! Task completed! 🎉" : 
        "Task marked as pending ⏳";
      this.showToast(message, task.completed ? "success" : "info");
    }
  }

  editTask(id) {
    const task = this.tasks.find(task => task.id === id);
    if (!task) return;

    // Populate form with task data
    document.getElementById("taskInput").value = task.title;
    document.getElementById("dueDateInput").value = task.dueDate;
    document.getElementById("prioritySelect").value = task.priority;
    document.getElementById("categorySelect").value = task.category || "";

    // Update form UI
    const form = document.getElementById("taskForm");
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-text">Update Task</span><span class="btn-icon">✏️</span>';
    form.dataset.updating = id;

    // Scroll to form
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  resetTaskForm() {
    const form = document.getElementById("taskForm");
    form.reset();
    delete form.dataset.updating;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-text">Add Task</span><span class="btn-icon">+</span>';
    
    this.clearFormErrors();
  }

  renderTasks() {
    const container = document.getElementById("tasksContainer");
    if (!container) return;

    // Filter tasks
    const filteredTasks = this.tasks.filter(task => {
      const matchesSearch = !this.filters.search || 
        task.title.toLowerCase().includes(this.filters.search) ||
        (task.category && task.category.toLowerCase().includes(this.filters.search));
      
      const matchesStatus = this.filters.status === "all" ||
        (this.filters.status === "completed" && task.completed) ||
        (this.filters.status === "pending" && !task.completed) ||
        (this.filters.status === task.priority);

      return matchesSearch && matchesStatus;
    });

    if (filteredTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No tasks found</h3>
          <p>Create your first task to get started!</p>
        </div>
      `;
      return;
    }

    // Sort tasks by priority and date
    filteredTasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    container.innerHTML = filteredTasks.map((task, index) => {
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < new Date() && !task.completed;
      const formattedDate = dueDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <div class="task-card ${task.completed ? 'task-completed' : ''} ${isOverdue ? 'task-overdue' : ''}" 
             data-task-id="${task.id}"
             style="animation-delay: ${index * 0.1}s">
          <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
               onclick="planner.toggleTaskComplete(${task.id})"></div>
          
          <div class="task-details">
            <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
            <div class="task-meta">
              <span class="task-date ${isOverdue ? 'overdue' : ''}">
                ${isOverdue ? '⚠️' : '📅'} ${formattedDate}
              </span>
              <span class="task-priority priority-${task.priority}">
                ${this.getPriorityIcon(task.priority)} ${task.priority}
              </span>
              ${task.category ? `<span class="task-category">${this.getCategoryIcon(task.category)} ${task.category}</span>` : ''}
            </div>
          </div>
          
          <div class="task-actions">
            <button onclick="planner.editTask(${task.id})" 
                    aria-label="Edit task" title="Edit task">✏️</button>
            <button onclick="planner.deleteTask(${task.id})" 
                    aria-label="Delete task" title="Delete task">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // Add stagger animation
    container.style.animation = "fadeInUp 0.6s ease forwards";
    
    // Initialize chart after rendering
    this.updateProductivityChart();
  }

  getPriorityIcon(priority) {
    const icons = { high: '🔴', medium: '🟡', low: '🟢' };
    return icons[priority] || '⚪';
  }

  getCategoryIcon(category) {
    const icons = {
      study: '📚',
      assignment: '📝',
      exam: '🎯',
      project: '💼',
      reading: '📖'
    };
    return icons[category] || '📋';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Animate stat updates
    this.animateNumber("totalTasks", total);
    this.animateNumber("completedTasks", completed);
    this.animateNumber("pendingTasks", pending);
    this.animateNumber("productivityScore", completionRate, "%");
  }

  animateNumber(elementId, targetValue, suffix = "") {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
      
      element.textContent = currentValue + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  updateProductivityChart() {
    if (!window.Chart) {
      window.initChart = () => this.updateProductivityChart();
      return;
    }

    const canvas = document.getElementById("productivityChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const data = {
      labels: ["Total Tasks", "Completed", "Pending"],
      datasets: [{
        label: "Tasks",
        data: [total, completed, pending],
        backgroundColor: [
          "rgba(22, 160, 133, 0.8)",
          "rgba(39, 174, 96, 0.8)",
          "rgba(243, 156, 18, 0.8)"
        ],
        borderColor: [
          "rgba(22, 160, 133, 1)",
          "rgba(39, 174, 96, 1)",
          "rgba(243, 156, 18, 1)"
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Your Study Task Overview",
          font: { size: 16, weight: "bold" },
          color: "#2c3e50"
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#16a085",
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
          ticks: { precision: 0 },
          grid: { color: "rgba(0, 0, 0, 0.1)" }
        },
        x: {
          grid: { display: false }
        }
      },
      animation: {
        duration: 1500,
        easing: "easeInOutQuart"
      }
    };

    if (this.productivityChart) {
      this.productivityChart.data = data;
      this.productivityChart.update("active");
    } else {
      this.productivityChart = new Chart(ctx, {
        type: "bar",
        data: data,
        options: options
      });
    }
  }

  // Theme Management
  setupTheme() {
    const savedTheme = this.profile.theme || "light";
    this.applyTheme(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
    this.profile.theme = newTheme;
    this.saveProfile();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    
    const themeToggle = document.getElementById("toggleThemeBtn");
    const themeLabel = document.querySelector(".theme-label");
    
    if (themeToggle) {
      themeToggle.classList.toggle("dark", theme === "dark");
      if (themeLabel) {
        themeLabel.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
      }
    }

    // Update chart colors if chart exists
    if (this.productivityChart && theme === "dark") {
      this.productivityChart.options.plugins.title.color = "#ffffff";
      this.productivityChart.update();
    }
  }

  // Profile Management
  loadProfile() {
    const nameInput = document.getElementById("profileName");
    const avatarSelect = document.getElementById("avatarSelect");
    
    if (nameInput) nameInput.value = this.profile.name;
    if (avatarSelect) avatarSelect.value = this.profile.avatar;
    
    this.updateProfilePreview();
  }

  saveProfile() {
    const nameInput = document.getElementById("profileName");
    const avatarSelect = document.getElementById("avatarSelect");
    
    if (nameInput) this.profile.name = nameInput.value;
    if (avatarSelect) this.profile.avatar = avatarSelect.value;
    
    localStorage.setItem("smartStudyProfile", JSON.stringify(this.profile));
    this.updateProfilePreview();
  }

  updateProfilePreview() {
    const preview = document.getElementById("profilePreview");
    if (preview) {
      preview.textContent = this.profile.avatar;
      preview.style.animation = "bounce 0.6s ease";
    }
  }

  // Toast Notifications
  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Achievement System
  initAchievements() {
    this.achievements = [
      { id: "first_task", name: "Getting Started", description: "Add your first task", icon: "🎯", unlocked: false },
      { id: "complete_5", name: "Task Master", description: "Complete 5 tasks", icon: "⭐", unlocked: false },
      { id: "complete_10", name: "Productivity Pro", description: "Complete 10 tasks", icon: "🏆", unlocked: false },
      { id: "perfect_week", name: "Perfect Week", description: "Complete all tasks for a week", icon: "💎", unlocked: false },
      { id: "early_bird", name: "Early Bird", description: "Complete a task before due date", icon: "🐦", unlocked: false }
    ];
    
    // Load saved achievements
    const saved = localStorage.getItem("smartStudyAchievements");
    if (saved) {
      this.achievements = JSON.parse(saved);
    }
    
    this.renderAchievements();
  }

  checkAchievements() {
    const completedTasks = this.tasks.filter(task => task.completed);
    
    // First task
    if (this.tasks.length >= 1 && !this.achievements.find(a => a.id === "first_task").unlocked) {
      this.unlockAchievement("first_task");
    }
    
    // Complete 5 tasks
    if (completedTasks.length >= 5 && !this.achievements.find(a => a.id === "complete_5").unlocked) {
      this.unlockAchievement("complete_5");
    }
    
    // Complete 10 tasks
    if (completedTasks.length >= 10 && !this.achievements.find(a => a.id === "complete_10").unlocked) {
      this.unlockAchievement("complete_10");
    }
    
    // Early bird - check if any task was completed before due date
    const earlyCompletions = completedTasks.filter(task => {
      return task.completedAt && new Date(task.completedAt) < new Date(task.dueDate);
    });
    
    if (earlyCompletions.length > 0 && !this.achievements.find(a => a.id === "early_bird").unlocked) {
      this.unlockAchievement("early_bird");
    }
  }

  unlockAchievement(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      localStorage.setItem("smartStudyAchievements", JSON.stringify(this.achievements));
      this.renderAchievements();
      this.showToast(`🎉 Achievement Unlocked: ${achievement.name}`, "success");
    }
  }

  renderAchievements() {
    const container = document.getElementById("achievementsGrid");
    if (!container) return;

    container.innerHTML = this.achievements.map(achievement => `
      <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${achievement.icon}</div>
        <h4>${achievement.name}</h4>
        <p>${achievement.description}</p>
        ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
      </div>
    `).join('');
  }

  // Data Management
  exportData() {
    const data = {
      tasks: this.tasks,
      profile: this.profile,
      achievements: this.achievements,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast("Data exported successfully! 📤", "success");
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.tasks && Array.isArray(data.tasks)) {
          this.tasks = data.tasks;
          this.saveTasks();
        }
        
        if (data.profile) {
          this.profile = { ...this.profile, ...data.profile };
          this.saveProfile();
          this.loadProfile();
          this.applyTheme(this.profile.theme);
        }
        
        if (data.achievements && Array.isArray(data.achievements)) {
          this.achievements = data.achievements;
          localStorage.setItem("smartStudyAchievements", JSON.stringify(this.achievements));
          this.renderAchievements();
        }

        this.renderTasks();
        this.updateStats();
        this.showToast("Data imported successfully! 📥", "success");
        
      } catch (error) {
        this.showToast("Failed to import data. Please check the file format.", "error");
      }
    };
    
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  }

  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    const shortcuts = {
      "ctrl+n": () => document.getElementById("taskInput")?.focus(),
      "ctrl+h": () => this.navigateTo("home"),
      "ctrl+d": () => this.navigateTo("dashboard"),
      "ctrl+p": () => this.navigateTo("profile"),
      "escape": () => this.resetTaskForm()
    };

    this.shortcuts = shortcuts;
  }

  handleKeyboardShortcuts(e) {
    const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`;
    
    if (this.shortcuts[key]) {
      e.preventDefault();
      this.shortcuts[key]();
    }
  }

  // PWA Support
  setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
    }

    // Install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      const installPrompt = document.getElementById('installPrompt');
      if (installPrompt && !localStorage.getItem('pwa-dismissed')) {
        installPrompt.style.display = 'block';
      }
    });

    window.installPWA = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((result) => {
          if (result.outcome === 'accepted') {
            this.showToast('App installed successfully! 📱', 'success');
          }
          deferredPrompt = null;
          document.getElementById('installPrompt').style.display = 'none';
        });
      }
    };

    window.dismissInstall = () => {
      document.getElementById('installPrompt').style.display = 'none';
      localStorage.setItem('pwa-dismissed', 'true');
    };
  }

  // Utility Methods
  saveTasks() {
    localStorage.setItem("smartStudyTasks", JSON.stringify(this.tasks));
  }

  autoSave() {
    this.saveTasks();
    this.saveProfile();
    console.log("Auto-save completed");
  }

  animateStats() {
    const statNumbers = document.querySelectorAll('[data-count]');
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-count'));
      this.animateNumber(stat.id || 'stat', target);
    });
  }

  toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    navLinks?.classList.toggle('mobile-open');
    toggle?.classList.toggle('active');
  }
}

// Initialize the application
let planner;
document.addEventListener("DOMContentLoaded", () => {
  planner = new SmartStudyPlanner();
});

// Global functions for onclick handlers (backward compatibility)
function navigateTo(section) {
  planner?.navigateTo(section);
}

function showModal(type) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  
  const content = {
    help: `
      <h2>Help Center</h2>
      <h3>Getting Started</h3>
      <p>Welcome to Smart Study Planner! Here's how to use the app:</p>
      <ul>
        <li><strong>Add Tasks:</strong> Fill out the form and click "Add Task"</li>
        <li><strong>Mark Complete:</strong> Click the checkbox next to any task</li>
        <li><strong>Edit Tasks:</strong> Click the edit (✏️) button on any task</li>
        <li><strong>Filter Tasks:</strong> Use the search bar and filter dropdown</li>
      </ul>
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><strong>Ctrl+N:</strong> Focus on new task input</li>
        <li><strong>Ctrl+H:</strong> Go to Home</li>
        <li><strong>Ctrl+D:</strong> Go to Dashboard</li>
        <li><strong>Ctrl+P:</strong> Go to Profile</li>
        <li><strong>Escape:</strong> Reset task form</li>
      </ul>
    `,
    privacy: `
      <h2>Privacy Policy</h2>
      <p><strong>Data Storage:</strong> All your data is stored locally in your browser. We do not collect or transmit any personal information.</p>
      <p><strong>Cookies:</strong> This app does not use cookies for tracking.</p>
      <p><strong>Analytics:</strong> We do not track user behavior or collect analytics.</p>
      <p><strong>Your Control:</strong> You can export or delete your data at any time from the Profile section.</p>
    `,
    terms: `
      <h2>Terms of Service</h2>
      <p><strong>Use:</strong> This app is provided free of charge for personal use.</p>
      <p><strong>Data:</strong> You are responsible for backing up your data. Use the export feature regularly.</p>
      <p><strong>Liability:</strong> This app is provided "as is" without warranties.</p>
      <p><strong>Changes:</strong> We may update these terms. Continued use indicates acceptance.</p>
    `
  };
  
  if (modalBody && content[type]) {
    modalBody.innerHTML = content[type];
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus management
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.focus();
  }
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal');
  if (e.target === modal) {
    closeModal();
  }
});

// Export/Import functions
function exportData() {
  planner?.exportData();
}

function importData(event) {
  planner?.importData(event);
}
