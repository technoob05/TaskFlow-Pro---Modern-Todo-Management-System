from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
from datetime import datetime
import os
import uuid

app = Flask(__name__, static_url_path='/static')
CORS(app)

# Đường dẫn đến file JSON
JSON_FILE = 'todos.json'
BACKUP_DIR = 'backups'

# Đảm bảo thư mục backup tồn tại
if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

def create_backup():
    """Tạo backup của file JSON"""
    if os.path.exists(JSON_FILE):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"{BACKUP_DIR}/todos_backup_{timestamp}.json"
        with open(JSON_FILE, 'r', encoding='utf-8') as source:
            with open(backup_file, 'w', encoding='utf-8') as target:
                target.write(source.read())

def load_todos():
    """Load todos từ file JSON với xử lý lỗi và backup"""
    if not os.path.exists(JSON_FILE):
        return {"todos": []}
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as file:
            data = json.load(file)
            # Đảm bảo cấu trúc dữ liệu đúng
            if not isinstance(data, dict) or 'todos' not in data:
                return {"todos": []}
            return data
    except json.JSONDecodeError:
        # Nếu file JSON bị hỏng, tạo backup và trả về danh sách rỗng
        create_backup()
        return {"todos": []}
    except Exception as e:
        print(f"Lỗi khi đọc file JSON: {str(e)}")
        return {"todos": []}

def save_todos(data):
    """Lưu todos với backup"""
    try:
        create_backup()  # Tạo backup trước khi lưu
        with open(JSON_FILE, 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"Lỗi khi lưu file JSON: {str(e)}")
        return False


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('static/js', path)

@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Lấy danh sách todos với các tùy chọn lọc"""
    data = load_todos()
    todos = data['todos']

    # Lọc theo trạng thái
    status = request.args.get('status')
    if status == 'active':
        todos = [todo for todo in todos if not todo['completed']]
    elif status == 'completed':
        todos = [todo for todo in todos if todo['completed']]

    # Lọc theo category
    category = request.args.get('category')
    if category:
        todos = [todo for todo in todos if todo.get('category') == category]

    # Lọc theo priority
    priority = request.args.get('priority')
    if priority:
        todos = [todo for todo in todos if todo.get('priority') == priority]

    # Lọc theo due date
    due_date = request.args.get('due_date')
    if due_date:
        today = datetime.now().date()
        todos = [todo for todo in todos if todo.get('due_date') and 
                datetime.fromisoformat(todo['due_date'].replace('Z', '+00:00')).date() == today]

    # Sắp xếp
    sort_by = request.args.get('sort')
    if sort_by == 'due_date':
        todos.sort(key=lambda x: x.get('due_date', '9999-12-31'))
    elif sort_by == 'priority':
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        todos.sort(key=lambda x: priority_order.get(x.get('priority', 'low')))
    elif sort_by == 'created':
        todos.sort(key=lambda x: x.get('created_at', ''), reverse=True)

    return jsonify(todos)

@app.route('/api/todos', methods=['POST'])
def create_todo():
    """Tạo todo mới"""
    try:
        todo_data = request.json
        valid, result = validate_todo(todo_data)
        
        if not valid:
            return jsonify({'error': result}), 400
        
        todo_data = result
        todo_data['id'] = str(uuid.uuid4())  # Sử dụng UUID để tránh trùng lặp
        todo_data['created_at'] = datetime.now().isoformat()
        # In create_todo
        todo_data['completed'] = todo_data.get('completed', False)  # Default to False if not provided

        data = load_todos()
        data['todos'].append(todo_data)
        
        if save_todos(data):
            return jsonify(todo_data), 201
        else:
            return jsonify({'error': 'Lỗi khi lưu dữ liệu'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/todos/<todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Cập nhật todo"""
    try:
        update_data = request.json
        
        # Đảm bảo dữ liệu hợp lệ
        valid, result = validate_todo(update_data, is_update=True)
        if not valid:
            return jsonify({'error': result}), 400
            
        data = load_todos()
        todo_list = data['todos']
        # In update_todo
        if 'completed' not in update_data:
            update_data['completed'] = todo['completed']  # Retain the existing value if not provided
        # Tìm và cập nhật todo
        todo_updated = False
        for todo in todo_list:
            if str(todo['id']) == str(todo_id):  # Chuyển đổi sang string để so sánh
                # Log để debug
                print(f"Found todo to update: {todo}")
                print(f"Update data: {update_data}")
                
                # Cập nhật thời gian sửa đổi
                update_data['updated_at'] = datetime.now().isoformat()
                
                # Xử lý category đặc biệt
                if 'category' in update_data and update_data['category'] == '':
                    update_data['category'] = 'other'
                
                # Cập nhật các trường được gửi lên
                todo.update(update_data)
                todo_updated = True
                
                # Log sau khi cập nhật
                print(f"Todo after update: {todo}")
                break
        
        if not todo_updated:
            return jsonify({'error': 'Todo không tồn tại'}), 404
            
        # Lưu thay đổi
        if save_todos(data):
            return jsonify(todo)
        else:
            return jsonify({'error': 'Lỗi khi lưu dữ liệu'}), 500
                    
    except Exception as e:
        print(f"Error in update_todo: {str(e)}")  # Log lỗi để debug
        return jsonify({'error': str(e)}), 500

def validate_todo(todo_data, is_update=False):
    """Kiểm tra và chuẩn hóa dữ liệu todo"""
    try:
        # Chỉ kiểm tra title bắt buộc khi tạo mới
        if not is_update and 'title' not in todo_data:
            return False, "Thiếu trường bắt buộc: title"

        # Tạo bản sao để không làm thay đổi dữ liệu gốc
        validated_data = todo_data.copy()

        # Chuẩn hóa trường completed
        if 'completed' in validated_data:
            validated_data['completed'] = bool(validated_data['completed'])

        # Chuẩn hóa trường progress
        if 'progress' in validated_data:
            try:
                validated_data['progress'] = int(validated_data['progress'])
                validated_data['progress'] = max(0, min(100, validated_data['progress']))
            except (TypeError, ValueError):
                validated_data['progress'] = 0

        # Chuẩn hóa category
        if 'category' in validated_data:
            valid_categories = {'work', 'personal', 'shopping', 'study', 'other', ''}
            if validated_data['category'] not in valid_categories:
                validated_data['category'] = 'other'
            if validated_data['category'] == '':
                validated_data['category'] = 'other'

        # Chuẩn hóa priority
        if 'priority' in validated_data:
            valid_priorities = {'low', 'medium', 'high'}
            if validated_data['priority'] not in valid_priorities:
                validated_data['priority'] = 'low'

        return True, validated_data

    except Exception as e:
        print(f"Error in validate_todo: {str(e)}")  # Log lỗi để debug
        return False, f"Lỗi xác thực dữ liệu: {str(e)}"
@app.route('/api/todos/<todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Xóa todo"""
    try:
        data = load_todos()
        todo_list = data['todos']
        
        for index, todo in enumerate(todo_list):
            if todo['id'] == todo_id:
                del todo_list[index]
                
                if save_todos(data):
                    return '', 204
                else:
                    return jsonify({'error': 'Lỗi khi lưu dữ liệu'}), 500
                    
        return jsonify({'error': 'Todo không tồn tại'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/todos/stats', methods=['GET'])
def get_stats():
    """Lấy thống kê về todos"""
    data = load_todos()
    todos = data['todos']
    
    now = datetime.now()
    
    stats = {
        'total': len(todos),
        'completed': len([t for t in todos if 'completed' in t and t['completed']]),
        'active': len([t for t in todos if 'completed' in t and not t['completed']]),
        'overdue': len([t for t in todos if 'completed' in t and not t['completed'] and 
                        t.get('due_date') and 
                        datetime.fromisoformat(t['due_date'].replace('Z', '+00:00')) < now]),
        'by_priority': {
            'high': len([t for t in todos if 'priority' in t and t.get('priority') == 'high']),
            'medium': len([t for t in todos if 'priority' in t and t.get('priority') == 'medium']),
            'low': len([t for t in todos if 'priority' in t and t.get('priority') == 'low'])
        },
        'by_category': {
            'work': len([t for t in todos if 'category' in t and t.get('category') == 'work']),
            'personal': len([t for t in todos if 'category' in t and t.get('category') == 'personal']),
            'shopping': len([t for t in todos if 'category' in t and t.get('category') == 'shopping']),
            'study': len([t for t in todos if 'category' in t and t.get('category') == 'study']),
            'other': len([t for t in todos if 'category' in t and t.get('category') == 'other'])
        }
    }
    
    return jsonify(stats)

@app.route('/api/todos/backup', methods=['POST'])
def create_manual_backup():
    """Tạo backup thủ công"""
    try:
        create_backup()
        return jsonify({'message': 'Backup created successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/todos/restore/<backup_file>', methods=['POST'])
def restore_backup(backup_file):
    """Khôi phục từ file backup"""
    try:
        backup_path = os.path.join(BACKUP_DIR, backup_file)
        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup file not found'}), 404
            
        with open(backup_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        if save_todos(data):
            return jsonify({'message': 'Restore successful'}), 200
        else:
            return jsonify({'error': 'Error saving restored data'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/todos/search', methods=['GET'])
def search_todos():
    """Tìm kiếm todos"""
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])

    data = load_todos()
    todos = data['todos']
    
    results = [
        todo for todo in todos if (
            'title' in todo and query in todo['title'].lower() or
            'description' in todo and query in todo.get('description', '').lower()
        )
    ]
              
    return jsonify(results)

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })
    
@app.route('/api/todos/order', methods=['PUT'])
def update_todo_order():
    """Cập nhật thứ tự todos"""
    try:
        order_data = request.json
        todo_id = order_data['todo_id']
        target_id = order_data['target_id']

        data = load_todos()
        todos = data['todos']

        # Find the indices of the todos to reorder
        todo_index = next((index for index, todo in enumerate(todos) if todo['id'] == todo_id), None)
        target_index = next((index for index, todo in enumerate(todos) if todo['id'] == target_id), None)

        # Validate indices
        if todo_index is None or target_index is None:
            return jsonify({'error': 'Todo ID không hợp lệ'}), 400

        # Remove the todo from its current position
        todo_to_move = todos.pop(todo_index)

        # Insert the todo at the target position
        if target_index < todo_index:
            # If moving up in the list
            todos.insert(target_index, todo_to_move)
        else:
            # If moving down in the list
            todos.insert(target_index + 1, todo_to_move)

        # Save the updated todos
        if save_todos(data):
            return jsonify({'message': 'Order updated successfully'}), 200
        else:
            return jsonify({'error': 'Lỗi khi lưu dữ liệu'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Đảm bảo file JSON tồn tại
    if not os.path.exists(JSON_FILE):
        save_todos({"todos": []})

    # Lắng nghe trên mọi địa chỉ IP trong mạng
    app.run(host='0.0.0.0', port=5000, debug=True)
