from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import requests
import re
import os

API_KEY = "jina_2d62aa15a192462baa71ed7d33034b157lXXiERZQfjs6chdifXzCZGBWKGq"  #Replace with your own API key found on https://jina.ai/reader/

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///jobs.db'  
db = SQLAlchemy(app)


class WatchList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(30), nullable=False)
    url = db.Column(db.String(300), nullable=False)

    def __repr__(self):
        return f'<Job {self.company}>'

with app.app_context():
    db.create_all()

@app.route('/api/jobs', methods=['POST'])
def add_job():
    data = request.json
    company = data.get("company")
    url = data.get("url") 

    if company and url:
        new_company = WatchList(company=company, url=url)
        db.session.add(new_company)
        db.session.commit()
        return jsonify({"message": "Job added successfully!"}), 201
    return jsonify({"message": "Invalid data"}), 400

@app.route('/api/run-scraper', methods=['GET'])
def run_scraper():
    try:
        changes = main()  
        return jsonify(changes), 200
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route('/api/watchlist', methods=['GET'])
def get_watchlist():
    companies = WatchList.query.all()
    result = [{"company": c.company, "url": c.url} for c in companies]
    return jsonify(result), 200

def call_api(url):
    headers = {
        "Authorization": "Bearer " + API_KEY,
        "X-Remove-Selector": "header, .class, #id",
        "X-Retain-Images": "none",
        "X-Return-Format": "markdown",
        "X-With-Images-Summary": "all",
        "X-With-Links-Summary": "all"
    }
    url = "https://r.jina.ai/" + url
    response = requests.get(url, headers=headers)
    return response.text

def filter_lines(text):
    filtered_lines = []
    lines = text.split('\n')
    
    for line in lines:
        if re.search(r'\b(intern(ship)?|co[-/ ]?op|month|months)\b', line, re.IGNORECASE):
            filtered_lines.append(line.strip())
    
    return set(filtered_lines)

def load_file(filename):
    if not os.path.exists(filename):
        return set()
    with open(filename, "r", encoding="utf-8") as f:
        return set(line.strip() for line in f if line.strip())

def save_file(lines, filename):
    with open(filename, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")

def compare(current_lines, previous_lines):
    new_lines = current_lines - previous_lines
    removed_lines = previous_lines - current_lines

    changes = {
        "new_lines": list(new_lines),
        "removed_lines": list(removed_lines)
    }

    return changes

def main():        
        companies = WatchList.query.all()
        all_changes = []
        
        for company in companies:
            url = company.url
            filename = f"{company.company}.txt"
            text = call_api(url)
            current = filter_lines(text)
            previous = load_file(filename)

            changes = compare(current, previous)
            all_changes.append({
                "company": company.company,
                "changes": changes
            })

            save_file(current, filename)

        return all_changes

if __name__ == "__main__":
    app.run(debug=True)
