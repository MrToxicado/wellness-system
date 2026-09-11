import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'wellness.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Therapists Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS therapists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            therapist_id INTEGER,
            name TEXT,
            alias TEXT,
            gender TEXT,
            specialization TEXT
        )
    ''')

    # 2. Services Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            duration INTEGER,
            price REAL,
            category_name TEXT
        )
    ''')

    # 3. Rooms Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER,
            name TEXT,
            room_name TEXT
        )
    ''')

    # 4. Clients Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            lastname TEXT,
            phone TEXT,
            email TEXT
        )
    ''')

    # 5. Bookings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            therapist_id INTEGER,
            service_id INTEGER,
            room_id INTEGER,
            client_name TEXT,
            service_name TEXT,
            start_time TEXT,
            end_time TEXT,
            duration_minutes INTEGER,
            status TEXT,
            requested_therapist INTEGER,
            notes TEXT,
            source TEXT
        )
    ''')

    conn.commit()

    # Seed data if empty
    cursor.execute("SELECT COUNT(*) FROM therapists")
    if cursor.fetchone()[0] == 0:
        print("[Python DB] Seeding initial SQLite tables...")

        # Therapists
        therapists = [
            (1, 'Lily', 'Lily', 'Female', 'Swedish Massage'),
            (2, 'James', 'James', 'Male', 'Deep Tissue'),
            (3, 'Emma', 'Emma', 'Female', 'Hot Stone'),
            (4, 'Lucas', 'Lucas', 'Male', 'Aromatherapy'),
            (5, 'Sophia', 'Sophia', 'Female', 'Facial & Skin'),
            (6, 'Oliver', 'Oliver', 'Male', 'Foot Reflexology'),
            (7, 'Ava', 'Ava', 'Female', 'Body Scrub'),
            (8, 'Noah', 'Noah', 'Male', 'Sports Massage'),
            (9, 'Isabella', 'Isabella', 'Female', 'Shiatsu'),
            (10, 'Liam', 'Liam', 'Male', 'Thai Massage'),
            (11, 'Mia', 'Mia', 'Female', 'Ayurvedic Massage'),
            (12, 'William', 'William', 'Male', 'Deep Tissue'),
            (13, 'Charlotte', 'Charlotte', 'Female', 'Reflexology'),
            (14, 'Elijah', 'Elijah', 'Male', 'Hot Stone'),
            (15, 'Amelia', 'Amelia', 'Female', 'Aromatherapy'),
        ]
        cursor.executemany("INSERT INTO therapists (therapist_id, name, alias, gender, specialization) VALUES (?, ?, ?, ?, ?)", therapists)

        # Services
        services = [
            ('Swedish Massage', 60, 80.0, 'Massage Therapy'),
            ('Deep Tissue Massage', 60, 100.0, 'Massage Therapy'),
            ('Aromatherapy Massage', 60, 90.0, 'Massage Therapy'),
            ('Hot Stone Therapy', 90, 140.0, 'Specialty Therapy'),
            ('Foot Reflexology', 45, 60.0, 'Reflexology'),
            ('Hydrating Facial Treatment', 45, 75.0, 'Facial Care'),
            ('Anti-Aging Facial', 60, 110.0, 'Facial Care'),
            ('Exfoliating Body Scrub', 60, 95.0, 'Body Treatment'),
        ]
        cursor.executemany("INSERT INTO services (name, duration, price, category_name) VALUES (?, ?, ?, ?)", services)

        # Rooms
        rooms = [
            (1, 'Room 1 (Single Bed)', 'Room 1 (Single Bed)'),
            (2, 'Room 2 (Single Bed)', 'Room 2 (Single Bed)'),
            (3, 'Room 3 (Double Bed)', 'Room 3 (Double Bed)'),
            (4, 'VIP Suite 1', 'VIP Suite 1'),
            (5, 'VIP Suite 2', 'VIP Suite 2'),
            (6, 'Therapy Room A', 'Therapy Room A'),
            (7, 'Therapy Room B', 'Therapy Room B'),
        ]
        cursor.executemany("INSERT INTO rooms (room_id, name, room_name) VALUES (?, ?, ?)", rooms)

        # Clients
        clients = [
            ('Yuvraj', 'Singh', '+65 9123 4567', 'yuvraj@example.com'),
            ('Emma', 'Watson', '+65 9234 5678', 'emma@example.com'),
            ('John', 'Doe', '+65 9345 6789', 'john@example.com'),
            ('Sarah', 'Jenkins', '+65 9456 7890', 'sarah@example.com'),
            ('Michael', 'Brown', '+65 9567 8901', 'michael@example.com'),
            ('Jessica', 'Taylor', '+65 9678 9012', 'jessica@example.com'),
        ]
        cursor.executemany("INSERT INTO clients (name, lastname, phone, email) VALUES (?, ?, ?, ?)", clients)

        # Sample Bookings
        import datetime
        today_str = datetime.date.today().isoformat()
        sample_bookings = [
            (1, 1, 1, 'Yuvraj Singh', 'Swedish Massage', f'{today_str}T09:30:00', f'{today_str}T10:30:00', 60, 'confirmed', 1, 'Prefers firm pressure', 'Walk-in'),
            (2, 2, 2, 'Emma Watson', 'Deep Tissue Massage', f'{today_str}T11:00:00', f'{today_str}T12:00:00', 60, 'confirmed', 0, '', 'Phone'),
            (3, 4, 4, 'Sarah Jenkins', 'Hot Stone Therapy', f'{today_str}T14:00:00', f'{today_str}T15:30:00', 90, 'check_in', 1, 'VIP Client', 'Website'),
        ]
        cursor.executemany("INSERT INTO bookings (therapist_id, service_id, room_id, client_name, service_name, start_time, end_time, duration_minutes, status, requested_therapist, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", sample_bookings)

        conn.commit()
        print("[Python DB] Database initialized and seeded successfully!")

    conn.close()

if __name__ == '__main__':
    init_db()
