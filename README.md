# TaskFlow Pro - Modern Todo Management System

A feature-rich task management system built with Flask and modern web technologies, offering a beautiful UI and powerful functionality.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-v3.6+-blue.svg)
![Flask](https://img.shields.io/badge/flask-v2.3.2-green.svg)
## ScreenShot 
![image](https://github.com/user-attachments/assets/3bcaa2ef-7ee1-4770-9bba-d643eb4761cf)


## ✨ Features

- 🎯 Task Management
  - Create, update, and delete tasks
  - Set task priorities (Low, Medium, High)
  - Categorize tasks (Work, Personal, Shopping, Study)
  - Track progress with progress bars
  - Set due dates and descriptions

- 🎨 Modern UI/UX
  - Responsive design with Tailwind CSS
  - Dark mode support
  - Drag and drop task reordering
  - Smooth animations and transitions
  - Interactive progress bars
  - Status indicators

- 📊 Organization & Filtering
  - Search tasks
  - Filter by status (Active/Completed)
  - Sort by due date, priority, or creation date
  - Calendar view for scheduled tasks
  - Category and priority color coding

- 📱 User Experience
  - Toast notifications
  - Loading indicators
  - Keyboard shortcuts
  - Confirmation dialogs
  - File backup system

## 🚀 Tech Stack

- **Backend:**
  - Python with Flask
  - RESTful API architecture
  - JSON file-based storage
  - Automatic backup system

- **Frontend:**
  - HTML5 / CSS3 / JavaScript
  - Tailwind CSS for styling
  - Font Awesome icons
  - Chart.js for statistics
  - Animate.css for animations

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/taskflow-pro.git
cd taskflow-pro
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # For Unix
venv\Scripts\activate     # For Windows
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up static files:
```bash
mkdir static
cp -r js static/
cp -r css static/
```

5. Start the application:
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## 🔧 Configuration

The application uses environment variables for configuration. Create a `.env` file in the project root:

```env
# Customize these settings
FLASK_APP=app.py
FLASK_ENV=development
```

## 📝 Usage

### Task Management

- Create a new task: Click the "Thêm công việc mới" button
- Edit a task: Click the edit icon or double-click the task
- Delete a task: Click the delete icon and confirm
- Mark as complete: Check the task's checkbox

### Keyboard Shortcuts

- `Alt + N`: Create new task
- `Alt + F`: Focus search bar
- `Esc`: Close modal

### Filtering and Sorting

- Use the search bar to find specific tasks
- Filter tasks by status using the dropdown
- Sort tasks by due date, priority, or creation date

## 🔒 Security

- Input validation for all task fields
- XSS protection
- CORS enabled
- Automatic file backups

## 💡 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGithub](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the awesome styling framework
- [Font Awesome](https://fontawesome.com/) for icons
- [Chart.js](https://www.chartjs.org/) for statistics visualization
- [Animate.css](https://animate.style/) for animations

## 📸 Screenshots

(Add screenshots of your application here)

## 🔮 Future Features

- User authentication and accounts
- Task sharing and collaboration
- Mobile application
- Cloud synchronization
- Advanced statistics and reporting
- Task templates and recurring tasks
