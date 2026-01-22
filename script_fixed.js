/* jshint esversion: 6 */
// 90 Day Win Tracker Application
class WinTrackerApp {
    constructor() {
        this.data = this.loadFromStorage();
        this.currentView = 'landing';
        
        // Check for test mode parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === 'true' || this.data.testMode) {
            // Only enable test mode if explicitly requested via URL
            if (urlParams.get('test') === 'true') {
                this.enableTestMode();
            }
        }
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTheme();
        this.renderApp();
        this.startPeriodicSave();
    }

    setupEventListeners() {
        // Landing page events
        document.getElementById('dream-textarea').addEventListener('input', this.handleDreamInput.bind(this));
        document.getElementById('save-dream-btn').addEventListener('click', this.saveDream.bind(this));
        document.getElementById('start-challenge-btn').addEventListener('click', this.startChallenge.bind(this));

        // Dashboard events
        document.getElementById('sound-toggle').addEventListener('change', this.toggleLayoutDesign.bind(this));
        document.getElementById('theme-select').addEventListener('change', this.changeTheme.bind(this));
        
        // Checklist events
        document.querySelectorAll('.check-input').forEach(input => {
            input.addEventListener('change', this.handleChecklistChange.bind(this));
        });

        // Journal events
        document.querySelectorAll('.gratitude-input').forEach(input => {
            input.addEventListener('input', this.validateJournal.bind(this));
        });
        document.getElementById('day-summary').addEventListener('input', this.handleSummaryInput.bind(this));
        document.getElementById('day-rating').addEventListener('input', this.updateRatingDisplay.bind(this));
        document.getElementById('submit-journal-btn').addEventListener('click', this.submitJournal.bind(this));

        // Goal section events
        document.getElementById('edit-dream-btn').addEventListener('click', () => {
            // Navigate back to landing page to edit the goal
            document.getElementById('landing-page').classList.add('active');
            document.getElementById('dashboard').classList.remove('active');
            this.currentView = 'landing';
            
            // Load the current dream text into the textarea
            document.getElementById('dream-textarea').value = this.data.dreamText;
            const wordCount = this.countWords(this.data.dreamText);
            document.getElementById('word-count').textContent = wordCount;
            
            // Enable buttons based on word count
            document.getElementById('save-dream-btn').disabled = wordCount < 500;
            document.getElementById('start-challenge-btn').disabled = wordCount < 500;
        });
        
        // To-Do events
        document.getElementById('add-todo-btn').addEventListener('click', this.addTodo.bind(this));
        document.getElementById('todo-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Reminder events
        document.getElementById('add-reminder-btn').addEventListener('click', this.addReminder.bind(this));

        // Calendar events
        document.getElementById('end-day-btn').addEventListener('click', this.endDay.bind(this));

        // Modal events
        document.getElementById('close-modal').addEventListener('click', this.closeModal.bind(this));

        // Handle window blur/focus for data persistence
        window.addEventListener('blur', () => this.saveToStorage());
        window.addEventListener('beforeunload', () => this.saveToStorage());
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('winTrackerData');
        if (savedData) {
            return JSON.parse(savedData);
        }

        // Default data structure
        return {
            startDate: null,
            theme: 'cyberpunk',
            soundEnabled: true,
            layoutDesignEnabled: true,
            dreamText: '',
            testMode: false,  // Added test mode flag
            days: [],
            todos: [],
            reminders: [],
            stats: {
                currentWinStreak: 0,
                longestWinStreak: 0,
                currentLossStreak: 0,
                daysWon: 0,
                daysLost: 0
            }
        };
    }

    saveToStorage() {
        localStorage.setItem('winTrackerData', JSON.stringify(this.data));
    }

    startPeriodicSave() {
        setInterval(() => {
            this.saveToStorage();
        }, 5000); // Save every 5 seconds
    }

    handleDreamInput(e) {
        const textarea = e.target;
        const wordCount = this.countWords(textarea.value);
        document.getElementById('word-count').textContent = wordCount;
        
        const saveBtn = document.getElementById('save-dream-btn');
        const startBtn = document.getElementById('start-challenge-btn');
        
        saveBtn.disabled = wordCount < 500;
        startBtn.disabled = wordCount < 500;
    }

    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    saveDream() {
        const dreamText = document.getElementById('dream-textarea').value.trim();
        const wordCount = this.countWords(dreamText);
        
        if (wordCount >= 500) {
            this.data.dreamText = dreamText;
            this.saveToStorage();
            this.showToast('Dream saved successfully!', 'success');
            
            // Enable the start challenge button
            document.getElementById('start-challenge-btn').disabled = false;
        } else {
            this.showToast('Please enter at least 500 words', 'error');
        }
    }

    startChallenge() {
        if (!this.data.dreamText || this.countWords(this.data.dreamText) < 500) {
            this.showToast('Please save your dream first (minimum 500 words)', 'error');
            return;
        }

        if (!this.data.startDate) {
            this.data.startDate = new Date().toISOString();
            
            // Initialize 90 days of data
            const start = new Date(this.data.startDate);
            for (let i = 0; i < 90; i++) {
                const dayDate = new Date(start);
                dayDate.setDate(start.getDate() + i);
                
                this.data.days.push({
                    date: dayDate.toISOString(),
                    checklist: {
                        shower: false,
                        clean: false,
                        pushups: false,
                        journalDone: false
                    },
                    pushupTarget: 25 + i, // Start at 25 and increase by 1 each day
                    journal: {
                        gratitude: ['', '', ''],
                        summary: '',
                        rating: 5
                    },
                    status: i === 0 ? 'current' : 'future', // First day is current, rest are future
                    timestamp: Date.now()
                });
            }
            
            this.saveToStorage();
            this.showToast('Challenge started! Good luck with your 90 days.', 'success');
        }

        this.switchToDashboard();
        this.updateDashboard(); // Ensure all sections are updated
    }

    switchToDashboard() {
        document.getElementById('landing-page').classList.remove('active');
        document.getElementById('dashboard').classList.add('active');
        this.currentView = 'dashboard';
        this.updateDashboard();
    }

    updateDashboard() {
        if (!this.data.startDate) return;

        const currentDate = new Date();
        const startDate = new Date(this.data.startDate);
        const currentDayIndex = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Update current day info
        document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('current-day').textContent = Math.max(1, currentDayIndex + 1);

        // Update streaks
        this.updateStreaks();

        // Update daily actions
        this.updateDailyActions(currentDayIndex);

        // Update journal
        this.updateJournal(currentDayIndex);

        // Update calendar
        this.renderCalendar();

        // Update to-do list
        this.renderTodoList();

        // Update dream text section
        this.updateDreamTextSection();
        
        // Update reminders
        this.renderReminders();
    }

    updateStreaks() {
        const { currentWinStreak, longestWinStreak, currentLossStreak } = this.data.stats;
        
        document.getElementById('current-win-streak').textContent = currentWinStreak;
        document.getElementById('longest-win-streak').textContent = longestWinStreak;
        document.getElementById('current-loss-streak').textContent = currentLossStreak;

        // Show warning if about to lose streak
        const warningBanner = document.getElementById('loss-warning');
        if (currentLossStreak >= 1) {
            warningBanner.classList.remove('hidden');
            if (this.data.layoutDesignEnabled) {
                this.playSound('warning');
            }
        } else {
            warningBanner.classList.add('hidden');
        }
    }

    updateDailyActions(dayIndex) {
        if (dayIndex < 0 || dayIndex >= this.data.days.length) return;

        const day = this.data.days[dayIndex];
        const checklist = day.checklist;

        // Update checklist inputs
        document.getElementById('shower-check').checked = checklist.shower;
        document.getElementById('clean-check').checked = checklist.clean;
        document.getElementById('pushups-check').checked = checklist.pushups;
        document.getElementById('journal-check').checked = checklist.journalDone;
        document.getElementById('journal-check').disabled = !checklist.journalDone;

        // Update pushup target
        document.getElementById('pushup-target').textContent = day.pushupTarget;

        // Calculate and update progress
        const completed = Object.values(checklist).filter(Boolean).length;
        document.getElementById('completed-tasks').textContent = completed;
        
        const progressPercent = (completed / 4) * 100;
        document.getElementById('daily-progress-fill').style.width = `${progressPercent}%`;
    }

    updateJournal(dayIndex) {
        if (dayIndex < 0 || dayIndex >= this.data.days.length) return;

        const day = this.data.days[dayIndex];
        const journal = day.journal;

        // Update gratitude inputs
        document.querySelectorAll('.gratitude-input').forEach((input, index) => {
            input.value = journal.gratitude[index] || '';
        });

        // Update summary
        document.getElementById('day-summary').value = journal.summary;
        const summaryWordCount = this.countWords(journal.summary);
        document.getElementById('summary-word-count').textContent = summaryWordCount;

        // Update rating
        document.getElementById('day-rating').value = journal.rating;
        document.getElementById('rating-value').textContent = journal.rating;

        // Validate journal
        this.validateJournal();
    }
    
    updateDreamTextSection() {
        const dreamTextDisplay = document.getElementById('dream-text-display');
        
        if (this.data.dreamText) {
            // Display a preview of the dream text
            const previewText = this.data.dreamText.length > 200 ? 
                this.data.dreamText.substring(0, 200) + '...' : 
                this.data.dreamText;
            
            dreamTextDisplay.textContent = previewText;
        } else {
            dreamTextDisplay.textContent = 'No goal set yet. Click "Edit Goal" to set your dream.';
        }
    }

    handleChecklistChange(e) {
        const dayIndex = this.getCurrentDayIndex();
        if (dayIndex < 0 || dayIndex >= this.data.days.length) return;

        const day = this.data.days[dayIndex];
        let checklistKey;

        switch (e.target.id) {
            case 'shower-check':
                checklistKey = 'shower';
                break;
            case 'clean-check':
                checklistKey = 'clean';
                break;
            case 'pushups-check':
                checklistKey = 'pushups';
                break;
            case 'journal-check':
                checklistKey = 'journalDone';
                break;
        }

        if (checklistKey) {
            day.checklist[checklistKey] = e.target.checked;
            this.saveToStorage();
            this.updateDashboard(); // Refresh the dashboard to update progress
            
            // Check if all tasks are completed
            this.checkDayCompletion(dayIndex);
        }
    }

    handleSummaryInput(e) {
        const wordCount = this.countWords(e.target.value);
        document.getElementById('summary-word-count').textContent = wordCount;
        this.validateJournal();
    }

    updateRatingDisplay(e) {
        document.getElementById('rating-value').textContent = e.target.value;
        this.validateJournal();
    }

    validateJournal() {
        const gratitudeInputs = document.querySelectorAll('.gratitude-input');
        const summary = document.getElementById('day-summary').value;
        const rating = parseInt(document.getElementById('day-rating').value);

        // Check if all gratitude fields are filled
        const allGratitudeFilled = Array.from(gratitudeInputs).every(input => input.value.trim() !== '');

        // Check if summary has at least 100 words
        const summaryWordCount = this.countWords(summary);
        const hasEnoughWords = summaryWordCount >= 100;

        // Rating should be between 1-10 (always true since it's a range input)

        const isValid = allGratitudeFilled && hasEnoughWords;

        // Enable/disable submit button
        const submitBtn = document.getElementById('submit-journal-btn');
        submitBtn.disabled = !isValid;

        return isValid;
    }

    submitJournal() {
        const dayIndex = this.getCurrentDayIndex();
        if (dayIndex < 0 || dayIndex >= this.data.days.length) return;

        if (!this.validateJournal()) {
            this.showToast('Please fill all gratitude fields and reach 100 words in summary', 'error');
            return;
        }

        const gratitudeInputs = document.querySelectorAll('.gratitude-input');
        const summary = document.getElementById('day-summary').value;
        const rating = parseInt(document.getElementById('day-rating').value);

        // Update journal data
        this.data.days[dayIndex].journal = {
            gratitude: [
                gratitudeInputs[0].value.trim(),
                gratitudeInputs[1].value.trim(),
                gratitudeInputs[2].value.trim()
            ],
            summary: summary,
            rating: rating
        };

        // Mark journal as done
        this.data.days[dayIndex].checklist.journalDone = true;
        document.getElementById('journal-check').checked = true;
        document.getElementById('journal-check').disabled = true;

        this.saveToStorage();
        this.updateDashboard();
        this.showToast('Journal submitted successfully!', 'success');

        // Play success sound
        if (this.data.layoutDesignEnabled) {
            this.playSound('success');
        }
    }

    checkDayCompletion(dayIndex) {
        const day = this.data.days[dayIndex];
        const allCompleted = Object.values(day.checklist).every(completed => completed);

        if (allCompleted) {
            // Day is complete - set as win
            day.status = 'win';
            this.updateStatsOnWin();
            this.saveToStorage();
            this.updateDashboard();
            
            // Play celebration sounds/confetti
            if (this.data.layoutDesignEnabled) {
                this.playSound('win');
            }
            this.showConfetti();
        }
    }

    updateStatsOnWin() {
        this.data.stats.currentWinStreak++;
        this.data.stats.daysWon++;
        
        if (this.data.stats.currentWinStreak > this.data.stats.longestWinStreak) {
            this.data.stats.longestWinStreak = this.data.stats.currentWinStreak;
        }
        
        this.data.stats.currentLossStreak = 0; // Reset loss streak
    }

    updateStatsOnLoss() {
        this.data.stats.currentLossStreak++;
        this.data.stats.daysLost++;
        
        this.data.stats.currentWinStreak = 0; // Reset win streak
        
        if (this.data.layoutDesignEnabled) {
            this.playSound('loss');
        }
    }

    endDay() {
        const dayIndex = this.getCurrentDayIndex();
        if (dayIndex < 0 || dayIndex >= this.data.days.length) return;

        const day = this.data.days[dayIndex];
        
        if (day.status === 'win') {
            this.showToast('Day already marked as won!', 'info');
            return;
        }

        const allCompleted = Object.values(day.checklist).every(completed => completed);
        
        if (allCompleted) {
            // Day is already completed, mark as win
            day.status = 'win';
            this.updateStatsOnWin();
        } else {
            // Confirm setting as loss
            const confirmed = confirm('This will lock the day as lost forever. Are you sure?');
            if (!confirmed) return;

            day.status = 'loss';
            this.updateStatsOnLoss();
        }

        this.saveToStorage();
        this.updateDashboard();
        
        // Move to next day if available
        if (dayIndex + 1 < this.data.days.length) {
            this.data.days[dayIndex + 1].status = 'current';
        }
    }

    getCurrentDayIndex() {
        if (!this.data.startDate) return -1;
        
        const currentDate = new Date();
        const startDate = new Date(this.data.startDate);
        return Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        const currentDate = new Date();
        
        this.data.days.forEach((day, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dayDate = new Date(day.date);
            const dayNumber = index + 1;
            
            dayElement.textContent = dayNumber;
            
            // Set status class
            if (day.status === 'win') {
                dayElement.classList.add('win');
            } else if (day.status === 'loss') {
                dayElement.classList.add('loss');
            } else {
                dayElement.classList.add('future');
            }
            
            // Highlight current day
            if (day.status === 'current') {
                dayElement.classList.add('current');
            }
            
            // Add click event to show day details
            dayElement.addEventListener('click', () => this.showDayDetails(index));
            
            calendarGrid.appendChild(dayElement);
        });
    }

    showDayDetails(dayIndex) {
        const day = this.data.days[dayIndex];
        const dayDate = new Date(day.date);
        
        const modal = document.getElementById('day-modal');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-day-title');
        
        modalTitle.textContent = `Day ${dayIndex + 1} - ${dayDate.toLocaleDateString()}`;
        
        let statusText = 'Future';
        if (day.status === 'current') statusText = 'Current';
        else if (day.status === 'win') statusText = 'Win';
        else if (day.status === 'loss') statusText = 'Loss';
        
        modalBody.innerHTML = `
            <div class="day-details">
                <div class="detail-item">
                    <strong>Status:</strong> ${statusText}
                </div>
                <div class="detail-item">
                    <strong>Checklist:</strong>
                    <ul>
                        <li>Shower: ${day.checklist.shower ? 'âœ…' : 'âŒ'}</li>
                        <li>Clean: ${day.checklist.clean ? 'âœ…' : 'âŒ'}</li>
                        <li>Pushups (${day.pushupTarget}): ${day.checklist.pushups ? 'âœ…' : 'âŒ'}</li>
                        <li>Journal: ${day.checklist.journalDone ? 'âœ…' : 'âŒ'}</li>
                    </ul>
                </div>
                <div class="detail-item">
                    <strong>Journal Rating:</strong> ${day.journal.rating}/10
                </div>
                <div class="detail-item">
                    <strong>Summary Preview:</strong>
                    <p>${day.journal.summary.substring(0, 100)}${day.journal.summary.length > 100 ? '...' : ''}</p>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('day-modal').classList.add('hidden');
    }

    addTodo() {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        
        if (text) {
            this.data.todos.push({
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            });
            
            input.value = '';
            this.saveToStorage();
            this.renderTodoList();
        }
    }

    renderTodoList() {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';
        
        this.data.todos.forEach(todo => {
            const todoElement = document.createElement('div');
            todoElement.className = 'todo-item';
            
            todoElement.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
                <button class="btn btn-small remove-todo" data-id="${todo.id}">Ã—</button>
            `;
            
            todoList.appendChild(todoElement);
        });
        
        // Add event listeners for todo checkboxes and removal
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.toggleTodo.bind(this));
        });
        
        document.querySelectorAll('.remove-todo').forEach(button => {
            button.addEventListener('click', this.removeTodo.bind(this));
        });
    }

    toggleTodo(e) {
        const id = parseInt(e.target.dataset.id);
        const todo = this.data.todos.find(t => t.id === id);
        
        if (todo) {
            todo.completed = e.target.checked;
            this.saveToStorage();
            this.renderTodoList();
        }
    }

    removeTodo(e) {
        const id = parseInt(e.target.dataset.id);
        this.data.todos = this.data.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.renderTodoList();
    }

    addReminder() {
        const timeInput = document.getElementById('reminder-time');
        const textInput = document.getElementById('reminder-text');
        
        const time = timeInput.value;
        const text = textInput.value.trim();
        
        if (time && text) {
            this.data.reminders.push({
                id: Date.now(),
                time: time,
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            });
            
            timeInput.value = '';
            textInput.value = '';
            this.saveToStorage();
            this.renderReminders();
        }
    }

    renderReminders() {
        const remindersList = document.getElementById('reminders-list');
        remindersList.innerHTML = '';
        
        this.data.reminders.forEach(reminder => {
            const reminderElement = document.createElement('div');
            reminderElement.className = 'reminder-item';
            
            reminderElement.innerHTML = `
                <input type="checkbox" class="reminder-checkbox" ${reminder.completed ? 'checked' : ''} data-id="${reminder.id}">
                <div class="reminder-info">
                    <div class="reminder-time">${reminder.time}</div>
                    <div class="reminder-text">${reminder.text}</div>
                </div>
                <button class="btn btn-small remove-reminder" data-id="${reminder.id}">Ã—</button>
            `;
            
            remindersList.appendChild(reminderElement);
        });
        
        // Add event listeners for reminder checkboxes and removal
        document.querySelectorAll('.reminder-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.toggleReminder.bind(this));
        });
        
        document.querySelectorAll('.remove-reminder').forEach(button => {
            button.addEventListener('click', this.removeReminder.bind(this));
        });
    }

    toggleReminder(e) {
        const id = parseInt(e.target.dataset.id);
        const reminder = this.data.reminders.find(r => r.id === id);
        
        if (reminder) {
            reminder.completed = e.target.checked;
            this.saveToStorage();
            this.renderReminders();
        }
    }

    removeReminder(e) {
        const id = parseInt(e.target.dataset.id);
        this.data.reminders = this.data.reminders.filter(r => r.id !== id);
        this.saveToStorage();
        this.renderReminders();
    }

    toggleLayoutDesign(e) {
        this.data.layoutDesignEnabled = e.target.checked;
        this.saveToStorage();
    }

    changeTheme(e) {
        this.data.theme = e.target.value;
        this.saveToStorage();
        this.updateTheme();
    }

    updateTheme() {
        document.body.className = `theme-${this.data.theme}`;
        document.getElementById('theme-select').value = this.data.theme;
        document.getElementById('sound-toggle').checked = this.data.layoutDesignEnabled;
    }

    renderApp() {
        // Check if in test mode and initialize if needed
        if (this.data.testMode && !this.data.startDate) {
            this.initializeTestData();
        }
        
        if (this.data.startDate) {
            this.switchToDashboard();
        } else {
            document.getElementById('landing-page').classList.add('active');
            document.getElementById('dashboard').classList.remove('active');
            this.currentView = 'landing';
            
            // Load dream text if available
            if (this.data.dreamText) {
                document.getElementById('dream-textarea').value = this.data.dreamText;
                const wordCount = this.countWords(this.data.dreamText);
                document.getElementById('word-count').textContent = wordCount;
                
                // Enable save button if requirements met
                document.getElementById('save-dream-btn').disabled = wordCount < 500;
                document.getElementById('start-challenge-btn').disabled = wordCount < 500;
            }
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add styles dynamically
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.color = 'white';
        toast.style.zIndex = '10000';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        
        // Set color based on type
        switch(type) {
            case 'success':
                toast.style.background = 'linear-gradient(45deg, #00c853, #00e676)';
                break;
            case 'error':
                toast.style.background = 'linear-gradient(45deg, #ff5252, #ff7961)';
                break;
            case 'warning':
                toast.style.background = 'linear-gradient(45deg, #ffab00, #ffd600)';
                break;
            default:
                toast.style.background = 'linear-gradient(45deg, #2979ff, #448aff)';
        }
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    playSound(type) {
        // In a real implementation, we would play actual sounds
        // For now, we'll just log to console
        console.log(`Playing ${type} sound`);
    }

    showConfetti() {
        // Create confetti effect
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                
                // Random position and color
                confetti.style.left = `${Math.random() * 100}vw`;
                confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
                confetti.style.animationDelay = `${Math.random() * 2}s`;
                
                document.body.appendChild(confetti);
                
                // Remove after animation
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 50);
        }
    }
    
    enableTestMode() {
        this.data.testMode = true;
        this.saveToStorage();
        
        // Skip to dashboard directly in test mode
        if (!this.data.startDate) {
            this.initializeTestData();
            this.switchToDashboard();
        }
    }
    
    initializeTestData() {
        // Set up test data similar to sample data
        this.data.startDate = new Date().toISOString();
        this.data.dreamText = "My dream life is one of continuous growth, health, and fulfillment. I wake up each morning excited about the day ahead, knowing that I am actively working towards my goals. I am physically fit and strong, having built consistent habits that serve my wellbeing. My mind is sharp and focused, capable of deep work and creative thinking. I have meaningful relationships with people who inspire and support me. I contribute positively to my community and make a difference in the world. My finances are stable and growing, providing security and freedom to pursue my passions. I travel to new places, learn continuously, and challenge myself regularly. I am surrounded by beauty, peace, and abundance. Every day brings new opportunities to grow and become the best version of myself.";
        
        // Initialize 90 days of data
        const start = new Date(this.data.startDate);
        for (let i = 0; i < 90; i++) {
            const dayDate = new Date(start);
            dayDate.setDate(start.getDate() + i);
            
            this.data.days.push({
                date: dayDate.toISOString(),
                checklist: {
                    shower: i === 0,
                    clean: i === 0,
                    pushups: i === 0,
                    journalDone: i === 0
                },
                pushupTarget: 25 + i,
                journal: {
                    gratitude: [
                        i === 0 ? "I'm grateful for my health and energy" : "",
                        i === 0 ? "I'm grateful for the opportunity to grow" : "",
                        i === 0 ? "I'm grateful for supportive relationships" : ""
                    ],
                    summary: i === 0 ? "Started my 90-day journey today. Felt energized and motivated to begin this transformation. Completed all non-negotiables and reflected on my goals in the journal. The pushups were challenging but manageable. Looking forward to tomorrow." : "",
                    rating: i === 0 ? 8 : 5
                },
                status: i === 0 ? 'current' : 'future',
                timestamp: Date.now()
            });
        }
        
        // Add some test todos
        this.data.todos = [
            {
                id: 1705488000000,
                text: "Complete morning routine",
                completed: true,
                createdAt: "2026-01-17T08:00:00.000Z"
            },
            {
                id: 1705488000001,
                text: "Read for 30 minutes",
                completed: false,
                createdAt: "2026-01-17T08:00:00.000Z"
            }
        ];
        
        // Add some test reminders
        this.data.reminders = [
            {
                id: 1705488000003,
                time: "07:00",
                text: "Morning routine",
                completed: true,
                createdAt: "2026-01-17T08:00:00.000Z"
            },
            {
                id: 1705488000004,
                time: "20:00",
                text: "Evening reflection",
                completed: false,
                createdAt: "2026-01-17T08:00:00.000Z"
            }
        ];
        
        // Update Day 1 to have empty gratitude and summary fields
        if (this.data.days.length > 0) {
            this.data.days[0].journal.gratitude = ['', '', ''];
            this.data.days[0].journal.summary = '';
        }
        
        // Set some stats
        this.data.stats = {
            currentWinStreak: 1,
            longestWinStreak: 1,
            currentLossStreak: 0,
            daysWon: 1,
            daysLost: 0
        };
        
        this.saveToStorage();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WinTrackerApp();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WinTrackerApp;
}
 
         / /   A d d   u s e r   I D   g e n e r a t i o n   a n d   c l o u d   s y n c   f u n c t i o n a l i t y 
         g e n e r a t e U s e r I d ( )   { 
                 / /   G e n e r a t e   a   u n i q u e   u s e r   I D   i f   o n e   d o e s n ' t   e x i s t 
                 i f   ( ! t h i s . d a t a . u s e r I d )   { 
                         t h i s . d a t a . u s e r I d   =   ' u s e r _ '   +   D a t e . n o w ( )   +   ' _ '   +   M a t h . r a n d o m ( ) . t o S t r i n g ( 3 6 ) . s u b s t r ( 2 ,   9 ) ; 
                         t h i s . s a v e T o S t o r a g e ( ) ; 
                 } 
                 r e t u r n   t h i s . d a t a . u s e r I d ; 
         } 
         
         a s y n c   s y n c T o C l o u d ( )   { 
                 t r y   { 
                         c o n s t   u s e r I d   =   t h i s . g e n e r a t e U s e r I d ( ) ; 
                         c o n s t   r e s p o n s e   =   a w a i t   f e t c h ( ' / a p i / s y n c ' ,   { 
                                 m e t h o d :   ' P O S T ' , 
                                 h e a d e r s :   { 
                                         ' C o n t e n t - T y p e ' :   ' a p p l i c a t i o n / j s o n ' , 
                                 } , 
                                 b o d y :   J S O N . s t r i n g i f y ( { 
                                         u s e r I d :   u s e r I d , 
                                         d a t a :   t h i s . d a t a 
                                 } ) 
                         } ) ; 
                         
                         i f   ( ! r e s p o n s e . o k )   { 
                                 t h r o w   n e w   E r r o r ( ' S y n c   f a i l e d ' ) ; 
                         } 
                         
                         c o n s t   r e s u l t   =   a w a i t   r e s p o n s e . j s o n ( ) ; 
                         c o n s o l e . l o g ( ' D a t a   s y n c e d   s u c c e s s f u l l y : ' ,   r e s u l t ) ; 
                 }   c a t c h   ( e r r o r )   { 
                         c o n s o l e . e r r o r ( ' S y n c   e r r o r : ' ,   e r r o r ) ; 
                         / /   F a l l b a c k   t o   l o c a l S t o r a g e 
                         l o c a l S t o r a g e . s e t I t e m ( ' w i n T r a c k e r D a t a ' ,   J S O N . s t r i n g i f y ( t h i s . d a t a ) ) ; 
                 } 
         } 
         
         a s y n c   l o a d F r o m C l o u d ( )   { 
                 t r y   { 
                         c o n s t   u s e r I d   =   t h i s . g e n e r a t e U s e r I d ( ) ; 
                         c o n s t   r e s p o n s e   =   a w a i t   f e t c h ( / a p i / s y n c / ) ; 
                         
                         i f   ( r e s p o n s e . o k )   { 
                                 c o n s t   c l o u d D a t a   =   a w a i t   r e s p o n s e . j s o n ( ) ; 
                                 i f   ( c l o u d D a t a   & &   c l o u d D a t a . d a t a )   { 
                                         / /   M e r g e   c l o u d   d a t a   w i t h   l o c a l   d a t a ,   p r i o r i t i z i n g   n e w e r   t i m e s t a m p s 
                                         t h i s . d a t a   =   t h i s . m e r g e D a t a ( t h i s . d a t a ,   c l o u d D a t a . d a t a ) ; 
                                         t h i s . s a v e T o S t o r a g e ( ) ; 
                                         r e t u r n   t r u e ; 
                                 } 
                         } 
                 }   c a t c h   ( e r r o r )   { 
                         c o n s o l e . e r r o r ( ' L o a d   f r o m   c l o u d   e r r o r : ' ,   e r r o r ) ; 
                 } 
                 r e t u r n   f a l s e ; 
         } 
         
         m e r g e D a t a ( l o c a l D a t a ,   c l o u d D a t a )   { 
                 / /   S i m p l e   m e r g e   s t r a t e g y   -   u s e   c l o u d   d a t a   b u t   p r e s e r v e   l o c a l   i f   i t ' s   m o r e   r e c e n t 
                 / /   I n   a   r e a l   i m p l e m e n t a t i o n ,   y o u ' d   w a n t   m o r e   s o p h i s t i c a t e d   c o n f l i c t   r e s o l u t i o n 
                 c o n s t   m e r g e d   =   { . . . l o c a l D a t a ,   . . . c l o u d D a t a } ; 
                 
                 / /   P r e s e r v e   l o c a l   s t a t s   i f   t h e y   s e e m   m o r e   u p - t o - d a t e 
                 i f   ( l o c a l D a t a . s t a t s   & &   c l o u d D a t a . s t a t s )   { 
                         / /   K e e p   t h e   s t a t s   w i t h   h i g h e r   v a l u e s   ( a s s u m i n g   h i g h e r   v a l u e s   m e a n   m o r e   r e c e n t   a c t i v i t y ) 
                         m e r g e d . s t a t s   =   { 
                                 c u r r e n t W i n S t r e a k :   M a t h . m a x ( l o c a l D a t a . s t a t s . c u r r e n t W i n S t r e a k   | |   0 ,   c l o u d D a t a . s t a t s . c u r r e n t W i n S t r e a k   | |   0 ) , 
                                 l o n g e s t W i n S t r e a k :   M a t h . m a x ( l o c a l D a t a . s t a t s . l o n g e s t W i n S t r e a k   | |   0 ,   c l o u d D a t a . s t a t s . l o n g e s t W i n S t r e a k   | |   0 ) , 
                                 c u r r e n t L o s s S t r e a k :   M a t h . m a x ( l o c a l D a t a . s t a t s . c u r r e n t L o s s S t r e a k   | |   0 ,   c l o u d D a t a . s t a t s . c u r r e n t L o s s S t r e a k   | |   0 ) , 
                                 d a y s W o n :   M a t h . m a x ( l o c a l D a t a . s t a t s . d a y s W o n   | |   0 ,   c l o u d D a t a . s t a t s . d a y s W o n   | |   0 ) , 
                                 d a y s L o s t :   M a t h . m a x ( l o c a l D a t a . s t a t s . d a y s L o s t   | |   0 ,   c l o u d D a t a . s t a t s . d a y s L o s t   | |   0 ) 
                         } ; 
                 } 
                 
                 / /   P r e s e r v e   l o c a l   d a y s   d a t a   i f   i t   e x i s t s   a n d   h a s   m o r e   r e c e n t   u p d a t e s 
                 i f   ( l o c a l D a t a . d a y s   & &   c l o u d D a t a . d a y s )   { 
                         / /   F o r   s i m p l i c i t y ,   w e ' l l   u s e   t h e   c l o u d   d a t a   b u t   t h i s   c o u l d   b e   i m p r o v e d 
                         m e r g e d . d a y s   =   c l o u d D a t a . d a y s ; 
                 } 
                 
                 r e t u r n   m e r g e d ; 
         }  
 
 
         / /   A d d   u s e r   I D   g e n e r a t i o n   a n d   c l o u d   s y n c   f u n c t i o n a l i t y 
         g e n e r a t e U s e r I d ( )   { 
                 / /   G e n e r a t e   a   u n i q u e   u s e r   I D   i f   o n e   d o e s n ' t   e x i s t 
                 i f   ( ! t h i s . d a t a . u s e r I d )   { 
                         t h i s . d a t a . u s e r I d   =   ' u s e r _ '   +   D a t e . n o w ( )   +   ' _ '   +   M a t h . r a n d o m ( ) . t o S t r i n g ( 3 6 ) . s u b s t r ( 2 ,   9 ) ; 
                         t h i s . s a v e T o S t o r a g e ( ) ; 
                 } 
                 r e t u r n   t h i s . d a t a . u s e r I d ; 
         } 
         
         a s y n c   s y n c T o C l o u d ( )   { 
                 t r y   { 
                         c o n s t   u s e r I d   =   t h i s . g e n e r a t e U s e r I d ( ) ; 
                         / /   I n   a   r e a l   i m p l e m e n t a t i o n ,   t h i s   w o u l d   s y n c   t o   a   r e a l   b a c k e n d 
                         / /   F o r   n o w ,   w e ' l l   s i m u l a t e   t h e   f u n c t i o n a l i t y 
                         c o n s o l e . l o g ( ' S y n c i n g   d a t a   t o   c l o u d   f o r   u s e r : ' ,   u s e r I d ) ; 
                         
                         / /   T h i s   i s   w h e r e   y o u   w o u l d   s e n d   d a t a   t o   y o u r   b a c k e n d 
                         / /   a w a i t   f e t c h ( ' / a p i / s y n c ' ,   {   m e t h o d :   ' P O S T ' ,   . . .   } ) ; 
                 }   c a t c h   ( e r r o r )   { 
                         c o n s o l e . e r r o r ( ' S y n c   e r r o r : ' ,   e r r o r ) ; 
                 } 
         } 
         
         a s y n c   l o a d F r o m C l o u d ( )   { 
                 t r y   { 
                         c o n s t   u s e r I d   =   t h i s . g e n e r a t e U s e r I d ( ) ; 
                         c o n s o l e . l o g ( ' A t t e m p t i n g   t o   l o a d   d a t a   f r o m   c l o u d   f o r   u s e r : ' ,   u s e r I d ) ; 
                         
                         / /   I n   a   r e a l   i m p l e m e n t a t i o n ,   t h i s   w o u l d   l o a d   f r o m   a   r e a l   b a c k e n d 
                         / /   F o r   n o w ,   w e ' l l   j u s t   r e t u r n   f a l s e   t o   u s e   l o c a l   s t o r a g e 
                         r e t u r n   f a l s e ; 
                 }   c a t c h   ( e r r o r )   { 
                         c o n s o l e . e r r o r ( ' L o a d   f r o m   c l o u d   e r r o r : ' ,   e r r o r ) ; 
                 } 
                 r e t u r n   f a l s e ; 
         }  
 
