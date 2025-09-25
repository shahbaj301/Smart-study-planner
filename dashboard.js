
class StudyPlannerDashboard {
    constructor() {
        this.tasks = this.loadTasks();
        this.profile = this.loadProfile();
        this.currentSection = 'dashboard';
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.renderDashboard();
        this.updateUserInfo();
        this.generateCalendar();
        this.updateProgressAnalytics();
        this.showSection('dashboard');
    }

    // Local Storage Management
    loadTasks() {
        const saved = localStorage.getItem('studyPlannerTasks');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading tasks:', e);
                return [];
            }
        }
        return this.getDefaultTasks();
    }

    saveTasks() {
        try {
            localStorage.setItem('studyPlannerTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('Error saving tasks:', e);
        }
    }

    loadProfile() {
        const saved = localStorage.getItem('studyPlannerProfile');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading profile:', e);
                return this.getDefaultProfile();
            }
        }
        return this.getDefaultProfile();
    }

    saveProfile() {
        try {
            localStorage.setItem('studyPlannerProfile', JSON.stringify(this.profile));
        } catch (e) {
            console.error('Error saving profile:', e);
        }
    }

    getDefaultTasks() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return [
            {
                id: 1,
                title: 'Complete Mathematics Assignment',
                description: 'Solve problems from Chapter 5: Algebra',
                dueDate: this.formatDate(tomorrow),
                priority: 'high',
                category: 'assignment',
                status: 'pending',
                createdAt: this.formatDate(today)
            },
            {
                id: 2,
                title: 'Study for History Exam',
                description: 'Review World War II timeline and key events',
                dueDate: this.formatDate(nextWeek),
                priority: 'high',
                category: 'exam',
                status: 'in-progress',
                createdAt: this.formatDate(today)
            },
            {
                id: 3,
                title: 'Science Lab Report',
                description: 'Write report on chemical reactions experiment',
                dueDate: this.formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
                priority: 'medium',
                category: 'project',
                status: 'pending',
                createdAt: this.formatDate(today)
            }
        ];
    }

    getDefaultProfile() {
        return {
            firstName: 'Smart',
            lastName: 'Student',
            email: 'student@example.com',
            studyGoal: 4,
            favoriteSubject: 'computer-science',
            notifications: true
        };
    }

    // Event Listeners
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Mobile toggle
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        
        mobileToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Task modal events
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskModal = document.getElementById('taskModal');
        const closeModal = document.getElementById('closeModal');
        const cancelTask = document.getElementById('cancelTask');
        const taskForm = document.getElementById('taskForm');

        addTaskBtn?.addEventListener('click', () => this.openTaskModal());
        closeModal?.addEventListener('click', () => this.closeTaskModal());
        cancelTask?.addEventListener('click', () => this.closeTaskModal());
        taskForm?.addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.renderTasks();
            });
        });

        // Profile form
        const profileForm = document.getElementById('profileForm');
        profileForm?.addEventListener('submit', (e) => this.handleProfileSubmit(e));

        // Calendar navigation
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        
        prevMonth?.addEventListener('click', () => this.navigateMonth(-1));
        nextMonth?.addEventListener('click', () => this.navigateMonth(1));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                this.closeTaskModal();
            }
        });
    }

    setupNavigation() {
        // Update active navigation item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-section="${this.currentSection}"]`)?.closest('.nav-item');
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    // Section Management
    showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        this.setupNavigation();

        // Update page title
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(sectionName);
        }

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'calendar':
                this.generateCalendar();
                break;
            case 'progress':
                this.updateProgressAnalytics();
                break;
            case 'profile':
                this.loadProfileData();
                break;
        }
    }

    getSectionTitle(sectionName) {
        const titles = {
            dashboard: 'Dashboard',
            tasks: 'My Tasks',
            calendar: 'Study Calendar',
            progress: 'Progress Analytics',
            profile: 'My Profile'
        };
        return titles[sectionName] || 'Dashboard';
    }

    // Dashboard Rendering
    renderDashboard() {
        this.updateStats();
        this.renderRecentTasks();
        this.updateWeeklyProgress();
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = this.tasks.filter(task => task.status === 'pending').length;
        const overdueTasks = this.getOverdueTasks().length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('overdueTasks').textContent = overdueTasks;

        this.animateCounters();
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-info h3');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            let current = 0;
            const increment = target / 20;

            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            updateCounter();
        });
    }

    renderRecentTasks() {
        const recentTasksContainer = document.getElementById('recentTasks');
        if (!recentTasksContainer) return;

        const recentTasks = this.tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentTasks.length === 0) {
            recentTasksContainer.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Create your first task to get started!</p>
                </div>
            `;
            return;
        }

        recentTasksContainer.innerHTML = recentTasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-checkbox ${task.status === 'completed' ? 'completed' : ''}" 
                     onclick="dashboard.toggleTaskStatus(${task.id})">
                    ${task.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                        <span class="task-due">Due: ${this.formatDateDisplay(task.dueDate)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateWeeklyProgress() {
        const thisWeek = this.getThisWeekTasks();
        const completedThisWeek = thisWeek.filter(task => task.status === 'completed').length;
        const totalThisWeek = thisWeek.length;
        const progressPercentage = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;

        const progressCircle = document.getElementById('weeklyProgress');
        const progressText = document.querySelector('.progress-percentage');
        const thisWeekCompleted = document.getElementById('thisWeekCompleted');

        if (progressCircle) {
            const degree = (progressPercentage / 100) * 360;
            progressCircle.style.background = `conic-gradient(var(--primary-color) ${degree}deg, var(--gray-200) ${degree}deg)`;
        }

        if (progressText) {
            progressText.textContent = `${progressPercentage}%`;
        }

        if (thisWeekCompleted) {
            thisWeekCompleted.textContent = completedThisWeek;
        }
    }

    // Task Management
    renderTasks() {
        const tasksContainer = document.getElementById('tasksList');
        if (!tasksContainer) return;

        let filteredTasks = this.filterTasks(this.tasks, this.currentFilter);
        filteredTasks = filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No tasks found</h3>
                    <p>No tasks match your current filter. Try selecting a different filter or create a new task.</p>
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = filteredTasks.map(task => `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title-section">
                        <h3>${this.escapeHtml(task.title)}</h3>
                        <p class="task-description">${this.escapeHtml(task.description || 'No description')}</p>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit-btn" onclick="dashboard.editTask(${task.id})" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="dashboard.deleteTask(${task.id})" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-footer">
                    <div class="task-tags">
                        <span class="task-tag priority-${task.priority}">${task.priority} priority</span>
                        <span class="task-tag category-${task.category}">${task.category}</span>
                        <span class="task-tag status-${task.status}">${task.status.replace('-', ' ')}</span>
                    </div>
                    <div class="task-due-date ${this.isOverdue(task.dueDate) ? 'overdue' : ''}">
                        Due: ${this.formatDateDisplay(task.dueDate)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterTasks(tasks, filter) {
        switch (filter) {
            case 'pending':
                return tasks.filter(task => task.status === 'pending');
            case 'in-progress':
                return tasks.filter(task => task.status === 'in-progress');
            case 'completed':
                return tasks.filter(task => task.status === 'completed');
            case 'overdue':
                return this.getOverdueTasks();
            default:
                return tasks;
        }
    }

    getOverdueTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today && task.status !== 'completed';
        });
    }

    getThisWeekTasks() {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        return this.tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });
    }

    // Task CRUD Operations
    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitButtonText');
        const form = document.getElementById('taskForm');

        this.editingTaskId = task ? task.id : null;

        if (task) {
            modalTitle.textContent = 'Edit Task';
            submitBtn.textContent = 'Update Task';
            this.populateTaskForm(task);
        } else {
            modalTitle.textContent = 'Add New Task';
            submitBtn.textContent = 'Add Task';
            form.reset();
            // Set default due date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('taskDueDate').value = this.formatDate(tomorrow);
        }

        modal.classList.add('active');
        document.getElementById('taskTitle').focus();
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        this.editingTaskId = null;
    }

    populateTaskForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskDueDate').value = task.dueDate;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskStatus').value = task.status;
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            dueDate: formData.get('dueDate'),
            priority: formData.get('priority'),
            category: formData.get('category'),
            status: formData.get('status')
        };

        if (!taskData.title || !taskData.dueDate) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId, taskData);
        } else {
            this.createTask(taskData);
        }

        this.closeTaskModal();
    }

    createTask(taskData) {
        const newTask = {
            id: Date.now(),
            ...taskData,
            createdAt: this.formatDate(new Date())
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.showNotification('Task created successfully!', 'success');
        this.refreshCurrentView();
    }

    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
            this.saveTasks();
            this.showNotification('Task updated successfully!', 'success');
            this.refreshCurrentView();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.showNotification('Task deleted successfully!', 'success');
            this.refreshCurrentView();
        }
    }

    toggleTaskStatus(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            this.saveTasks();
            this.refreshCurrentView();
        }
    }

    // Calendar
    generateCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarTitle = document.getElementById('calendarTitle');
        
        if (!calendarGrid || !calendarTitle) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        calendarTitle.textContent = `${this.getMonthName(month)} ${year}`;

        // Clear calendar
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayHeader.style.cssText = `
                background: var(--gray-100);
                font-weight: 600;
                color: var(--gray-700);
                font-size: 0.875rem;
            `;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const currentDate = new Date(year, month, day);
            const today = new Date();
            
            // Check if it's today
            if (this.isSameDay(currentDate, today)) {
                dayElement.classList.add('today');
            }

            // Check if there are tasks on this day
            const tasksOnDay = this.getTasksForDate(currentDate);
            if (tasksOnDay.length > 0) {
                dayElement.classList.add('has-tasks');
                dayElement.title = `${tasksOnDay.length} task(s) due`;
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.generateCalendar();
    }

    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }

    getTasksForDate(date) {
        const dateStr = this.formatDate(date);
        return this.tasks.filter(task => task.dueDate === dateStr);
    }

    // Progress Analytics
    updateProgressAnalytics() {
        this.updateCompletionBars();
        this.updateStreaks();
    }

    updateCompletionBars() {
        const thisWeekTasks = this.getThisWeekTasks();
        const thisMonthTasks = this.getThisMonthTasks();
        
        const weekCompletion = this.calculateCompletionRate(thisWeekTasks);
        const monthCompletion = this.calculateCompletionRate(thisMonthTasks);

        this.animateProgressBar('weekCompletionBar', 'weekCompletionText', weekCompletion);
        this.animateProgressBar('monthCompletionBar', 'monthCompletionText', monthCompletion);
    }

    getThisMonthTasks() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        return this.tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return dueDate >= startOfMonth && dueDate <= endOfMonth;
        });
    }

    calculateCompletionRate(tasks) {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(task => task.status === 'completed').length;
        return Math.round((completed / tasks.length) * 100);
    }

    animateProgressBar(barId, textId, percentage) {
        const bar = document.getElementById(barId);
        const text = document.getElementById(textId);
        
        if (bar) {
            setTimeout(() => {
                bar.style.width = `${percentage}%`;
            }, 500);
        }
        
        if (text) {
            text.textContent = `${percentage}%`;
        }
    }

    updateStreaks() {
        const currentStreak = this.calculateCurrentStreak();
        const longestStreak = this.calculateLongestStreak();
        
        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('longestStreak').textContent = longestStreak;
    }

    calculateCurrentStreak() {
        // Simple implementation - count consecutive days with completed tasks
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            
            const tasksOnDay = this.getTasksForDate(checkDate);
            const completedTasksOnDay = tasksOnDay.filter(task => task.status === 'completed');
            
            if (completedTasksOnDay.length > 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    calculateLongestStreak() {
        // This is a simplified implementation
        // In a real app, you'd track this more systematically
        return Math.max(this.calculateCurrentStreak(), 5);
    }

    // Profile Management
    loadProfileData() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        document.getElementById('firstName').value = this.profile.firstName || '';
        document.getElementById('lastName').value = this.profile.lastName || '';
        document.getElementById('email').value = this.profile.email || '';
        document.getElementById('studyGoal').value = this.profile.studyGoal || 4;
        document.getElementById('favoriteSubject').value = this.profile.favoriteSubject || '';
        document.getElementById('notifications').checked = this.profile.notifications !== false;

        this.updateProfileDisplay();
    }

    handleProfileSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        this.profile = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            studyGoal: parseInt(formData.get('studyGoal')),
            favoriteSubject: formData.get('favoriteSubject'),
            notifications: formData.get('notifications') === 'on'
        };

        this.saveProfile();
        this.updateUserInfo();
        this.updateProfileDisplay();
        this.showNotification('Profile updated successfully!', 'success');
    }

    updateUserInfo() {
        const userName = `${this.profile.firstName} ${this.profile.lastName}`.trim() || 'Student';
        const userNameElements = document.querySelectorAll('.user-name, #headerUserName');
        
        userNameElements.forEach(element => {
            element.textContent = userName;
        });
    }

    updateProfileDisplay() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileName) {
            profileName.textContent = `${this.profile.firstName} ${this.profile.lastName}`.trim() || 'Student Name';
        }
        
        if (profileEmail) {
            profileEmail.textContent = this.profile.email || 'student@example.com';
        }
    }

    // Utility Methods
    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    isOverdue(dueDateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dueDateStr);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refreshCurrentView() {
        switch (this.currentSection) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'calendar':
                this.generateCalendar();
                break;
            case 'progress':
                this.updateProgressAnalytics();
                break;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new StudyPlannerDashboard();
});

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--gray-500);
    }
    
    .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: var(--gray-700);
    }
    
    .task-due-date.overdue {
        color: var(--error-color);
        font-weight: 600;
    }
`;
document.head.appendChild(notificationStyles);