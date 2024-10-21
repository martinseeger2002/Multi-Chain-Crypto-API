# routes/main.py
from flask import Blueprint, render_template, send_file

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def landing_page():
    return render_template('API_landing_page.html')

@main_bp.route('/api_tester.html')
def api_tester():
    return send_file('api_tester.html')
