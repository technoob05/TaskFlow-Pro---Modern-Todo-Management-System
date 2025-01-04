// Constants
const API_URL = '/api';

// Utility Functions
const utils = {
    
    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatTimeRemaining(dueDate) {
        if (!dueDate) return '';
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;

        if (diff < 0) {
            return '<span class="text-red-500">Quá hạn</span>';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `Còn ${days} ngày ${hours} giờ`;
        }
        return `Còn ${hours} giờ`;
    },

    getCategoryInfo(category) {
        const categories = {
            work: { label: 'Công việc', color: 'bg-blue-100 text-blue-800' },
            personal: { label: 'Cá nhân', color: 'bg-purple-100 text-purple-800' },
            shopping: { label: 'Mua sắm', color: 'bg-pink-100 text-pink-800' },
            study: { label: 'Học tập', color: 'bg-indigo-100 text-indigo-800' },
            other: { label: 'Khác', color: 'bg-gray-100 text-gray-800' }
        };
        return categories[category] || categories.other;
    },

    getPriorityInfo(priority) {
        const priorities = {
            low: { label: 'Thấp', color: 'bg-green-100 text-green-800' },
            medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
            high: { label: 'Cao', color: 'bg-red-100 text-red-800' }
        };
        return priorities[priority] || priorities.low;
    },

    showToast(message, type = 'success') {
        const backgrounds = {
            success: 'linear-gradient(to right, #00b09b, #96c93d)',
            error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            warning: 'linear-gradient(to right, #f7b733, #fc4a1a)'
        };

        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: 'right',
            style: { background: backgrounds[type] },
            stopOnFocus: true
        }).showToast();
    }
};

// State Management
const state = {
    todos: [],
    filters: {
        status: 'all',
        category: 'all',
        search: '',
        sort: 'dueDate'
    }
};

// API Service
const api = {
    async fetchTodos() {
        showLoadingIndicator(); // Show loading indicator
        try {
            const response = await fetch(`${API_URL}/todos`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Không thể tải danh sách công việc');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching todos:', error);
            utils.showToast(error.message, 'error');
            return [];
        } finally {
            hideLoadingIndicator(); // Hide loading indicator after the operation
        }
    }
    ,

    async createTodo(todoData) {
        try {
            const response = await fetch(`${API_URL}/todos`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(todoData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Không thể tạo công việc mới');
            }
            
            const result = await response.json();
            utils.showToast('Đã thêm công việc mới thành công');
            return result;
        } catch (error) {
            console.error('Error creating todo:', error);
            utils.showToast(error.message, 'error');
            throw error;
        }
    },

    async updateTodo(todoId, todoData) {
        try {
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todoData)
            });
            if (!response.ok) throw new Error('Không thể cập nhật công việc');
            const result = await response.json();
            utils.showToast('Đã cập nhật công việc thành công');
            return result;
        } catch (error) {
            console.error('Error updating todo:', error);
            utils.showToast('Lỗi khi cập nhật công việc', 'error');
            throw error;
        }
    },

    async deleteTodo(todoId) {
        try {
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Không thể xóa công việc');
            utils.showToast('Đã xóa công việc thành công');
        } catch (error) {
            console.error('Error deleting todo:', error);
            utils.showToast('Lỗi khi xóa công việc', 'error');
            throw error;
        }
    },

    async fetchStats() {
        showLoadingIndicator(); // Show loading indicator
        try {
            const response = await fetch(`${API_URL}/todos/stats`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Không thể tải thống kê');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            utils.showToast('Lỗi khi tải thống kê', 'error');
            return {
                total: 0,
                active: 0,
                completed: 0,
                overdue: 0,
                completed_today: 0
            };
        } finally {
            hideLoadingIndicator(); // Hide loading indicator after the operation
        }
    }
    
};

// UI Controller
const ui = {
    elements: {
        todoList: document.getElementById('todoList'),
        taskModal: document.getElementById('taskModal'),
        modalContent: document.getElementById('modalContent'),
        taskForm: document.getElementById('taskForm'),
        addNewTask: document.getElementById('addNewTask'),
        closeModal: document.getElementById('closeModal'),
        cancelTask: document.getElementById('cancelTask'),
        searchInput: document.querySelector('input[placeholder="Tìm kiếm công việc..."]'),
        filterStatus: document.getElementById('filterStatus'),
        sortBy: document.getElementById('sortBy'),
        progressRange: document.getElementById('taskProgress'),
        progressValue: document.getElementById('progressValue')
    },

    init() {
        this.bindEvents();
        this.refreshTodos();
    },

    bindEvents() {
        // Modal events
        this.elements.addNewTask.addEventListener('click', () => this.openModal());
        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.cancelTask.addEventListener('click', () => this.closeModal());
        this.elements.taskModal.addEventListener('click', (e) => {
            if (e.target === this.elements.taskModal) this.closeModal();
        });

        // Form events
        this.elements.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.elements.progressRange.addEventListener('input', (e) => {
            this.elements.progressValue.textContent = `${e.target.value}%`;
        });

        // Filter and search events
        this.elements.searchInput.addEventListener('input', debounce(() => this.refreshTodos(), 300));
        this.elements.filterStatus.addEventListener('change', () => this.refreshTodos());
        this.elements.sortBy.addEventListener('change', () => this.refreshTodos());

        // Add calendar button handler
        const calendarButton = document.querySelector('button:has(i.fas.fa-calendar)');
        if (calendarButton) {
            calendarButton.addEventListener('click', () => this.showCalendarView());
        }
    },

    showCalendarView() {
        const todoList = this.elements.todoList;
        todoList.innerHTML = '';

        // Group todos by due date
        const todos = state.todos.reduce((acc, todo) => {
            if (todo.due_date) {
                const date = todo.due_date.split('T')[0];
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(todo);
            }
            return acc;
        }, {});

        // Create calendar view
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'grid grid-cols-1 gap-4';

        // Sort dates
        const sortedDates = Object.keys(todos).sort();

        sortedDates.forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'bg-white rounded-lg p-4 shadow-sm';
            
            const dateHeader = document.createElement('h3');
            dateHeader.className = 'text-lg font-semibold text-gray-800 mb-3';
            dateHeader.textContent = new Date(date).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const todosList = document.createElement('div');
            todosList.className = 'space-y-2';
            
            todos[date].forEach(todo => {
                const todoItem = document.createElement('div');
                todoItem.className = 'flex items-center space-x-3 p-2 hover:bg-gray-50 rounded';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = todo.completed;
                checkbox.className = 'w-4 h-4 rounded border-gray-300';
                checkbox.addEventListener('change', async (e) => {
                    await this.handleStatusChange(todo.id, e.target.checked);
                });
                
                const title = document.createElement('span');
                title.className = `flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`;
                title.textContent = todo.title;
                
                const time = document.createElement('span');
                time.className = 'text-sm text-gray-500';
                time.textContent = todo.due_date.split('T')[1].substring(0, 5);
                
                todoItem.appendChild(checkbox);
                todoItem.appendChild(title);
                todoItem.appendChild(time);
                todosList.appendChild(todoItem);
            });
            
            dateGroup.appendChild(dateHeader);
            dateGroup.appendChild(todosList);
            calendarContainer.appendChild(dateGroup);
        });

        // Add message if no todos
        if (sortedDates.length === 0) {
            const noTodos = document.createElement('div');
            noTodos.className = 'text-center text-gray-500 py-8';
            noTodos.textContent = 'Không có công việc nào được lên lịch';
            calendarContainer.appendChild(noTodos);
        }

        todoList.appendChild(calendarContainer);
    },

    async refreshTodos() {
        this.showLoading(true); // Show loading indicator
        const todos = await api.fetchTodos();
        state.todos = todos;
        this.renderTodos();
        this.updateStats();
        this.showLoading(false); // Hide loading indicator
    },
    
    showLoading(isLoading) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    },
    

    renderTodos() {
        const todoList = this.elements.todoList;
        todoList.innerHTML = '';
    
        const filteredTodos = this.filterTodos(state.todos);
        const sortedTodos = this.sortTodos(filteredTodos);
    
        if (sortedTodos.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.textContent = 'Không tìm thấy công việc nào.';
            noResultsMessage.className = 'text-center text-gray-500 py-4';
            todoList.appendChild(noResultsMessage);
            return;
        }
    
        sortedTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            todoList.appendChild(todoElement);
        });
    }
    ,
    createTodoElement(todo) {
        const template = document.getElementById('todoTemplate');
        const todoElement = template.content.cloneNode(true);
        const todoItem = todoElement.querySelector('.todo-item');
    
        // Set todo data and ID
        todoItem.dataset.todoId = todo.id;
        todoItem.draggable = true;
    
        // Set title and description
        todoElement.querySelector('.todo-title').textContent = todo.title;
        todoElement.querySelector('.todo-description').textContent = todo.description || '';
    
        // Handle checkbox
        const checkbox = todoElement.querySelector('.todo-checkbox');
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', async (e) => {
            try {
                const newStatus = e.target.checked;
                await api.updateTodo(todo.id, { 
                    completed: newStatus,
                    progress: newStatus ? 100 : todo.progress || 0,
                    category: todo.category || 'other'
                });
                
                const todoItem = e.target.closest('.todo-item');
                const todoTitle = todoItem.querySelector('.todo-title');
                const progressBar = todoItem.querySelector('.progress-bar');
                
                if (newStatus) {
                    todoItem.classList.add('bg-gray-50');
                    todoTitle.classList.add('line-through', 'text-gray-500');
                    progressBar.style.width = '100%';
                    progressBar.className = 'progress-bar h-2 rounded-full bg-green-500';
                } else {
                    todoItem.classList.remove('bg-gray-50');
                    todoTitle.classList.remove('line-through', 'text-gray-500');
                    progressBar.style.width = `${todo.progress || 0}%`;
                    progressBar.className = `progress-bar h-2 rounded-full ${
                        todo.progress >= 75 ? 'bg-blue-500' :
                        todo.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`;
                }
                
                await this.refreshTodos();
                
                utils.showToast(
                    newStatus ? 'Đã hoàn thành công việc!' : 'Đã đánh dấu chưa hoàn thành',
                    'success'
                );
            } catch (error) {
                console.error('Error updating todo status:', error);
                utils.showToast('Không thể cập nhật trạng thái', 'error');
                e.target.checked = todo.completed;
            }
        });
    
        // Set category badge
        const categoryInfo = utils.getCategoryInfo(todo.category);
        const categorySpan = todoElement.querySelector('.todo-category');
        categorySpan.textContent = categoryInfo.label;
        categorySpan.className = `todo-category px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`;
    
        // Set priority badge
        const priorityInfo = utils.getPriorityInfo(todo.priority);
        const prioritySpan = todoElement.querySelector('.todo-priority');
        prioritySpan.textContent = priorityInfo.label;
        prioritySpan.className = `todo-priority px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`;
    
        // Set dates
        todoElement.querySelector('.todo-created-at').textContent = utils.formatDate(todo.created_at);
        const dueDateElement = todoElement.querySelector('.todo-due-date');
        dueDateElement.innerHTML = utils.formatTimeRemaining(todo.due_date);
        if (todo.due_date && new Date(todo.due_date) < new Date()) {
            dueDateElement.classList.add('text-red-500', 'font-medium');
        }
    
        // Set progress bar
        const progressBar = todoElement.querySelector('.progress-bar');
        const progressText = todoElement.querySelector('.progress-text');
        const progress = todo.progress || 0;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    
        // Add progress bar color based on completion
        if (progress >= 100) {
            progressBar.classList.add('bg-green-500');
        } else if (progress >= 50) {
            progressBar.classList.add('bg-blue-500');
        } else if (progress >= 25) {
            progressBar.classList.add('bg-yellow-500');
        } else {
            progressBar.classList.add('bg-red-500');
        }
    
        // Style completed todos
        if (todo.completed) {
            todoItem.classList.add('bg-gray-50');
            todoElement.querySelector('.todo-title').classList.add('line-through', 'text-gray-500');
            progressBar.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-blue-500');
            progressBar.classList.add('bg-green-500');
        }
    
        // Add edit button handler
        todoElement.querySelector('.edit-btn').addEventListener('click', () => {
            this.openModal(todo);
        });
    
        // Add delete button handler with confirmation
        todoElement.querySelector('.delete-btn').addEventListener('click', async () => {
            const confirmed = await this.showConfirmDialog(
                'Xóa công việc',
                'Bạn có chắc chắn muốn xóa công việc này không?'
            );
            if (confirmed) {
                try {
                    await api.deleteTodo(todo.id);
                    await this.refreshTodos();
                    utils.showToast('Đã xóa công việc thành công', 'success');
                } catch (error) {
                    console.error('Error deleting todo:', error);
                    utils.showToast('Không thể xóa công việc', 'error');
                }
            }
        });
    
        // Add drag and drop handlers
        todoItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', todo.id);
            todoItem.classList.add('opacity-50');
        });
    
        todoItem.addEventListener('dragend', () => {
            todoItem.classList.remove('opacity-50');
        });
    
        // Add hover effect
        todoItem.addEventListener('mouseenter', () => {
            todoItem.classList.add('transform', 'translate-y-[-2px]', 'shadow-md');
        });
    
        todoItem.addEventListener('mouseleave', () => {
            todoItem.classList.remove('transform', 'translate-y-[-2px]', 'shadow-md');
        });
    
        // Add double-click to edit
        todoItem.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.edit-btn') && !e.target.closest('.delete-btn')) {
                this.openModal(todo);
            }
        });
    
        return todoElement;
    }
,    

    filterTodos(todos) {
        return todos.filter(todo => {
            // Status filter
            const matchesStatus = state.filters.status === 'all' ? true :
                state.filters.status === 'completed' ? todo.completed : !todo.completed;

            // Search filter - search in both title and description
            const searchTerm = state.filters.search.toLowerCase();
            const matchesSearch = searchTerm === '' || 
                todo.title.toLowerCase().includes(searchTerm) ||
                (todo.description || '').toLowerCase().includes(searchTerm);

            return matchesStatus && matchesSearch;
        });
    },

    sortTodos(todos) {
        return [...todos].sort((a, b) => {
            switch (state.filters.sort) {
                case 'dueDate':
                    return new Date(a.due_date || '9999') - new Date(b.due_date || '9999');
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'created':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return 0;
            }
        });
    },

    async updateStats() {
        try {
            const stats = await api.fetchStats();
            
            // Update stats with null checks
            const statElements = {
                'totalTasks': stats.total || 0,
                'activeTasks': stats.active || 0,
                'completedTasks': stats.completed || 0,
                'overdueTasks': stats.overdue || 0,
                'todayCompleted': stats.completed_today || 0
            };

            // Update each element safely
            Object.entries(statElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });

            // Update progress bars if they exist
            const progressBars = document.querySelectorAll('.progress-bar');
            progressBars.forEach(el => {
                const type = el.getAttribute('data-type');
                if (type && stats[type]) {
                    const percentage = (stats[type] / stats.total) * 100;
                    el.style.width = `${percentage}%`;
                }
            });
        } catch (error) {
            console.error('Error updating stats:', error);
            utils.showToast('Lỗi khi cập nhật thống kê', 'error');
        }
    },openModal(todo = null) {
        const modalTitle = document.getElementById('modalTitle');
        const form = this.elements.taskForm;
        
        if (todo) {
            modalTitle.textContent = 'Chỉnh sửa công việc';
            form.taskId.value = todo.id;
            form.taskTitle.value = todo.title;
            form.taskDescription.value = todo.description || '';
            form.taskDueDate.value = todo.due_date ? todo.due_date.slice(0, 16) : '';
            form.taskCategory.value = todo.category || 'other';
            form.taskPriority.value = todo.priority || 'low';
            form.taskProgress.value = todo.progress || 0;
            this.elements.progressValue.textContent = `${todo.progress || 0}%`;
        } else {
            modalTitle.textContent = 'Thêm công việc mới';
            form.reset();
            form.taskId.value = '';
            this.elements.progressValue.textContent = '0%';
        }

        this.elements.taskModal.classList.remove('hidden');
        setTimeout(() => {
            this.elements.modalContent.classList.remove('scale-95', 'opacity-0');
            this.elements.modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeModal() {
        this.elements.modalContent.classList.remove('scale-100', 'opacity-100');
        this.elements.modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.elements.taskModal.classList.add('hidden');
        }, 300);
    },

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const todoData = {
            title: form.taskTitle.value,
            description: form.taskDescription.value,
            due_date: form.taskDueDate.value,
            category: form.taskCategory.value,
            priority: form.taskPriority.value,
            progress: parseInt(form.taskProgress.value)
        };

        try {
            if (form.taskId.value) {
                await api.updateTodo(form.taskId.value, todoData);
            } else {
                await api.createTodo(todoData);
            }
            this.closeModal();
            this.refreshTodos();
        } catch (error) {
            console.error('Error saving todo:', error);
        }
    },

    async handleStatusChange(todoId, completed) {
        try {
            await api.updateTodo(todoId, { completed });
            await this.refreshTodos();
            utils.showToast(
                completed ? 'Đã hoàn thành công việc!' : 'Đã đánh dấu chưa hoàn thành',
                'success'
            );
        } catch (error) {
            console.error('Error updating todo status:', error);
        }
    },

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            dialog.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4 animate__animated animate__fadeInDown">
                    <h3 class="text-lg font-bold mb-4">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end space-x-3">
                        <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cancel-btn">
                            Hủy
                        </button>
                        <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors confirm-btn">
                            Xác nhận
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('.confirm-btn').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });

            dialog.querySelector('.cancel-btn').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });

            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                    resolve(false);
                }
            });
        });
    },
    initializeDragAndDrop() {
        let draggedItem = null;
    
        this.elements.todoList.addEventListener('dragstart', (e) => {
            draggedItem = e.target.closest('.todo-item');
            if (draggedItem) {
                e.dataTransfer.setData('text/plain', draggedItem.dataset.todoId);
                draggedItem.classList.add('opacity-50');
            }
        });
    
        this.elements.todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const todoItem = e.target.closest('.todo-item');
            if (todoItem && draggedItem !== todoItem) {
                const rect = todoItem.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    todoItem.parentNode.insertBefore(draggedItem, todoItem);
                } else {
                    todoItem.parentNode.insertBefore(draggedItem, todoItem.nextSibling);
                }
            }
        });
    
        this.elements.todoList.addEventListener('drop', async (e) => {
            e.preventDefault();
            const todoId = e.dataTransfer.getData('text/plain');
            const targetTodo = e.target.closest('.todo-item');
            if (targetTodo) {
                const targetId = targetTodo.dataset.todoId;
                // Update the order of todos here (you might need to implement a backend API for this)
                await api.updateTodoOrder(todoId, targetId); // Example function to handle order update
                await this.refreshTodos();
            }
            draggedItem.classList.remove('opacity-50'); // Remove opacity class after drop
        });
    
        this.elements.todoList.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('opacity-50'); // Clean up opacity on drag end
                draggedItem = null; // Reset dragged item
            }
        });
    }
,    
    initializeSearch() {
        const searchInput = this.elements.searchInput;
        const clearButton = document.createElement('button');
        clearButton.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600';
        clearButton.innerHTML = '<i class="fas fa-times"></i>';
        clearButton.style.display = 'none';
    
        searchInput.parentElement.appendChild(clearButton);
    
        searchInput.addEventListener('input', debounce(async (e) => {
            state.filters.search = e.target.value.trim();
            clearButton.style.display = state.filters.search ? 'block' : 'none';
            await this.refreshTodos(); // Use await to ensure todos are refreshed after search
        }, 300));
    
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            state.filters.search = '';
            clearButton.style.display = 'none';
            this.refreshTodos();
        });
    }
    ,
    

    initializeSortingAndFilters() {
        this.elements.filterStatus.addEventListener('change', (e) => {
            state.filters.status = e.target.value;
            this.refreshTodos();
        });

        this.elements.sortBy.addEventListener('change', (e) => {
            state.filters.sort = e.target.value;
            this.refreshTodos();
        });
    },

    initializeHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Alt + N: New Task
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                this.openModal();
            }
            
            // Esc: Close Modal
            if (e.key === 'Escape' && !this.elements.taskModal.classList.contains('hidden')) {
                this.closeModal();
            }

            // Alt + F: Focus Search
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        });
    },

    initializeProgressBar() {
        const updateProgressValue = (e) => {
            const value = e.target.value;
            this.elements.progressValue.textContent = `${value}%`;
            
            // Thay đổi màu dựa trên giá trị
            const hue = (value * 1.2); // 120 = xanh lá, 0 = đỏ
            this.elements.progressValue.style.color = `hsl(${hue}, 70%, 45%)`;
        };

        this.elements.progressRange.addEventListener('input', updateProgressValue);
    },

    initializeAnimations() {
        // Thêm animation cho todo items khi được thêm mới
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('todo-item')) {
                            node.classList.add('animate__animated', 'animate__fadeIn');
                        }
                    });
                }
            });
        });

        observer.observe(this.elements.todoList, { childList: true });
    },

    initializeDragAndDrop() {
        let draggedItem = null;

        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                draggedItem = e.target;
                e.target.classList.add('opacity-50');
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('opacity-50');
            }
        });

        this.elements.todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const todoItem = e.target.closest('.todo-item');
            if (todoItem && draggedItem !== todoItem) {
                const rect = todoItem.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    todoItem.parentNode.insertBefore(draggedItem, todoItem);
                } else {
                    todoItem.parentNode.insertBefore(draggedItem, todoItem.nextSibling);
                }
            }
        });
    }
};
function showLoadingIndicator() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

// Helper Functions
function debounce(func, wait) {
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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    ui.init();
    ui.initializeSearch();
    ui.initializeSortingAndFilters();
    ui.initializeHotkeys();
    ui.initializeProgressBar();
    ui.initializeAnimations();
    ui.initializeDragAndDrop();

    // Hiển thị loading khi khởi động
    utils.showToast('Đang tải dữ liệu...', 'info');

    // Kiểm tra kết nối
    fetch(API_URL + '/health')
        .then(response => response.json())
        .then(() => {
            utils.showToast('Kết nối thành công!', 'success');
        })
        .catch(() => {
            utils.showToast('Không thể kết nối đến server!', 'error');
        });
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}