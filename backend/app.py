from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import datetime
from db import get_db_connection, init_db

app = Flask(__name__)
CORS(app)

# Initialize database on app start
init_db()

# 1. Login
@app.route('/api/v1/login', methods=['POST'])
def login():
    data = request.form if request.form else (request.json or {})
    email = data.get('email', 'react@hipster-inc.com')
    return jsonify({
        'success': True,
        'data': {
            'data': {
                'token': {'token': 'python_flask_jwt_token_777'},
                'user': {'id': 1, 'email': email, 'name': 'Wellness Admin'},
            }
        }
    })

# 2. Therapists
@app.route('/api/v1/therapists', methods=['GET'])
def get_therapists():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM therapists").fetchall()
    conn.close()
    staffs = [dict(row) for row in rows]
    return jsonify({'data': {'data': {'list': {'staffs': staffs}}}})

# 3. Services
@app.route('/api/v1/service-category', methods=['GET'])
def get_services():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM services").fetchall()
    conn.close()

    categories_map = {}
    for row in rows:
        service = dict(row)
        cat_name = service.get('category_name') or 'Massage Therapy'
        if cat_name not in categories_map:
            categories_map[cat_name] = {'name': cat_name, 'services': []}
        categories_map[cat_name]['services'].append(service)

    return jsonify({'data': {'data': {'list': {'category': list(categories_map.values())}}}})

# 4. Rooms
@app.route('/api/v1/room-bookings/outlet/<outlet_id>', methods=['GET'])
def get_rooms(outlet_id):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM rooms").fetchall()
    conn.close()
    rooms = [dict(row) for row in rows]
    return jsonify({'data': {'data': {'list': {'rooms': rooms}}}})

# 5. Clients / Users
@app.route('/api/v1/users', methods=['GET'])
def get_users():
    search = request.args.get('search', '').strip().lower()
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM clients").fetchall()
    conn.close()
    
    users = [dict(row) for row in rows]
    if search:
        filtered = [u for u in users if search in f"{u.get('name','')} {u.get('lastname','')}".lower() or search in (u.get('phone') or '')]
        if not filtered and len(search) >= 2:
            auto_client = {'id': int(datetime.datetime.now().timestamp() * 1000), 'name': request.args.get('search'), 'lastname': '', 'phone': '+65 9123 4567', 'email': 'auto@example.com'}
            filtered = [auto_client]
        users = filtered

    return jsonify({'data': {'data': {'list': {'users': users}}}})

@app.route('/api/v1/users/create', methods=['POST'])
def create_user():
    data = request.json or request.form
    name = data.get('name', 'Client')
    lastname = data.get('lastname', '')
    phone = data.get('phone', '')
    email = data.get('email', '')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO clients (name, lastname, phone, email) VALUES (?, ?, ?, ?)", (name, lastname, phone, email))
    client_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({'data': {'data': {'id': client_id, 'name': name, 'lastname': lastname, 'phone': phone, 'email': email}}})

# 6. Bookings
@app.route('/api/v1/bookings/outlet/booking/list', methods=['GET'])
def get_bookings():
    date_param = request.args.get('date') or request.args.get('service_at') or request.args.get('start_date')
    conn = get_db_connection()
    if date_param:
        clean_date = date_param.split('T')[0].split(' ')[0]
        rows = conn.execute("SELECT * FROM bookings WHERE start_time LIKE ?", (f"{clean_date}%",)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM bookings").fetchall()
    conn.close()

    formatted_bookings = []
    for row in rows:
        b = dict(row)
        formatted_bookings.append({
            'id': b['id'],
            'therapist_id': b['therapist_id'],
            'service_id': b['service_id'],
            'room_id': b['room_id'],
            'customer_name': b['client_name'],
            'client_name': b['client_name'],
            'service_name': b['service_name'],
            'start_time': b['start_time'],
            'end_time': b['end_time'],
            'duration_minutes': b['duration_minutes'],
            'status': b['status'],
            'requested_therapist': bool(b['requested_therapist']),
            'notes': b['notes'],
            'source': b['source'],
            'booking_item': {
                'itemGroup1': [{
                    'id': b['id'],
                    'therapist_id': b['therapist_id'],
                    'service_id': b['service_id'],
                    'service': b['service_name'],
                    'service_at': b['start_time'].replace('T', ' ') if b['start_time'] else '',
                    'duration': b['duration_minutes'],
                    'requested_person': b['requested_therapist'],
                    'room_items': [{'room_id': b['room_id']}],
                }]
            }
        })

    return jsonify({'data': {'data': {'list': {'bookings': formatted_bookings}}}})

@app.route('/api/v1/bookings/create', methods=['POST'])
def create_booking():
    data = request.json or request.form
    items_raw = data.get('items', []) if isinstance(data, dict) else []
    items = []
    if isinstance(items_raw, str):
        try:
            items = json.loads(items_raw)
        except Exception:
            items = []
    elif isinstance(items_raw, list):
        items = items_raw

    primary_item = items[0] if items else {}
    client_name = data.get('client_name') or data.get('customer_name') or primary_item.get('customer_name') or 'Guest Client'
    therapist_id = primary_item.get('therapist_id') or primary_item.get('therapist') or data.get('therapist_id') or 1
    service_id = primary_item.get('service_id') or primary_item.get('service') or data.get('service_id') or 1
    room_id = primary_item.get('room_id') or data.get('room_id') or 1

    start_time = primary_item.get('start_time') or data.get('start_time')
    end_time = primary_item.get('end_time') or data.get('end_time')
    duration = int(primary_item.get('duration_minutes') or primary_item.get('duration') or data.get('duration_minutes') or 60)

    if not start_time:
        service_at = data.get('service_at', '')
        start_time = service_at.replace(' ', 'T') if service_at else datetime.datetime.now().strftime('%Y-%m-%dT09:00:00')

    if not end_time and start_time:
        try:
            start_clean = start_time.replace(' ', 'T').split('.')[0]
            start_dt = datetime.datetime.fromisoformat(start_clean)
            end_dt = start_dt + datetime.timedelta(minutes=duration)
            end_time = end_dt.strftime('%Y-%m-%dT%H:%M:%S')
        except Exception:
            end_time = start_time

    start_time = start_time.replace(' ', 'T').split('.')[0] if start_time else ''
    end_time = end_time.replace(' ', 'T').split('.')[0] if end_time else ''

    status = 'confirmed'
    requested = 1 if (primary_item.get('requested_therapist') or primary_item.get('requested_person') or data.get('requested_therapist')) else 0
    notes = data.get('notes') or data.get('note') or ''
    source = data.get('source') or 'Walk-in'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO bookings 
        (therapist_id, service_id, room_id, client_name, service_name, start_time, end_time, duration_minutes, status, requested_therapist, notes, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (therapist_id, service_id, room_id, client_name, 'Spa Treatment', start_time, end_time, duration, status, requested, notes, source))
    
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()

    print(f"[Python Server] Created booking #{booking_id} for {client_name} at {start_time}")
    return jsonify({'success': True, 'id': booking_id})

@app.route('/api/v1/bookings/<int:booking_id>', methods=['POST', 'PUT'])
def update_booking(booking_id):
    data = request.json or request.form
    therapist_id = data.get('therapist_id')
    room_id = data.get('room_id')
    status = data.get('status')
    notes = data.get('notes')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if start_time:
        start_time = start_time.replace(' ', 'T').split('.')[0]
    if end_time:
        end_time = end_time.replace(' ', 'T').split('.')[0]

    conn = get_db_connection()
    conn.execute('''
        UPDATE bookings 
        SET therapist_id = COALESCE(?, therapist_id),
            room_id = COALESCE(?, room_id),
            status = COALESCE(?, status),
            notes = COALESCE(?, notes),
            start_time = COALESCE(?, start_time),
            end_time = COALESCE(?, end_time)
        WHERE id = ?
    ''', (therapist_id, room_id, status, notes, start_time, end_time, booking_id))
    conn.commit()
    conn.close()

    print(f"[Python Server] Updated booking #{booking_id} start_time={start_time}")
    return jsonify({'success': True})

@app.route('/api/v1/bookings/destroy/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/v1/bookings/item/cancel', methods=['POST'])
def cancel_booking():
    data = request.json or request.form
    booking_id = data.get('booking_id') or data.get('id')
    if booking_id:
        conn = get_db_connection()
        conn.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
        conn.commit()
        conn.close()
    return jsonify({'success': True})

@app.route('/api/v1/bookings/<int:booking_id>/check-in', methods=['POST'])
def check_in(booking_id):
    conn = get_db_connection()
    conn.execute("UPDATE bookings SET status = 'check_in' WHERE id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/v1/bookings/<int:booking_id>/check-out', methods=['POST'])
def check_out(booking_id):
    conn = get_db_connection()
    conn.execute("UPDATE bookings SET status = 'completed' WHERE id = ?", (booking_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    print("🚀 Python (Flask) + SQLite Backend Server starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
