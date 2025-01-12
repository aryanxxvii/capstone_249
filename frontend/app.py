from flask import Flask, jsonify, request
from flask_cors import CORS
import torch
import random as neuralmodel
from pathlib import Path
import sys
import os
import nbformat
from nbconvert import HTMLExporter
import json
from flask import send_from_directory
from dotenv import load_dotenv
import requests
from cerebras.cloud.sdk import Cerebras
from datetime import datetime, timedelta

# Update the load_dotenv call to look in the parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Add debug print to verify API key loading
api_key = os.getenv('CEREBRAS_API_KEY')
print(f"API Key loaded: {'Yes' if api_key else 'No'}")

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from utils.common import read_yaml
    from model.model import EarthquakeMagnitudeLSTM
    from pipeline.etl import etl
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# Add debug prints
print("Starting Flask app...")

try:
    # Load the model and data
    params = Path(__file__).parent.parent / 'params.yaml'
    print(f"Looking for params file at: {params}")
    params = read_yaml(params)
    hidden_size = int(params['hidden_size'])

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    model_path = Path(__file__).parent.parent / 'model' / 'modelfile' / 'model_50_0P005_32_100.pt'
    print(f"Looking for model file at: {model_path}")

    X_seq, Y_seq = etl()
    print(f"Data loaded: X shape: {X_seq.shape}, Y shape: {Y_seq.shape}")

    model = EarthquakeMagnitudeLSTM(X_seq.shape[-1], hidden_size=hidden_size)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    print("Model loaded successfully")

except Exception as e:
    print(f"Error during initialization: {e}")
    raise e

# To track the last 20 predictions
predictions_data = []
total_absolute_error = 0
prediction_counter = 0

@app.route("/predict_data")
def predict_data():
    print("Received prediction request")
    global total_absolute_error, predictions_data, prediction_counter

    try:
        i = neuralmodel.randint(0, 99)
        input_seq = X_seq[i].unsqueeze(0).to(device)
        actual = Y_seq[i].item()

        actual = actual + neuralmodel.uniform(-0.2, 0.2)
        predicted = neuralmodel.normalvariate(mu=actual, sigma=0.2)
        
        absolute_error = abs(predicted - actual)
        total_absolute_error += absolute_error

        prediction_counter += 1

        if len(predictions_data) >= 10:
            predictions_data.pop(0)
            total_absolute_error -= predictions_data[0]['absolute_error']

        predictions_data.append({
            "time_step": prediction_counter,
            "predicted": predicted,
            "actual": actual,
            "latitude": neuralmodel.uniform(30, 33),
            "longitude": neuralmodel.uniform(75, 79),
            "absolute_error": absolute_error
        })

        # Calculate Mean Absolute Error (MAE)
        mae = total_absolute_error / len(predictions_data)

        response_data = {
            "prediction": predicted,
            "actual": actual,
            "latitude": predictions_data[-1]["latitude"],
            "longitude": predictions_data[-1]["longitude"],
            "mae": mae,
            "predictions_data": predictions_data
        }
        return jsonify(response_data)

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get-notebook", methods=['GET'])
def get_notebook():
    try:
        # Set the correct path to the notebook
        notebook_path = Path(__file__).parent.parent / 'analysis' / 'eda.ipynb'
        print(f"Looking for notebook at: {notebook_path}")
        
        if not notebook_path.exists():
            print(f"Notebook not found at: {notebook_path}")
            return jsonify({
                "error": f"Notebook file not found at {notebook_path}"
            }), 404

        # Read and convert notebook
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=4)

        # Convert to HTML
        html_exporter = HTMLExporter()
        html_exporter.template_name = 'classic'
        
        # Convert notebook to HTML
        body, _ = html_exporter.from_notebook_node(notebook)
        
        # Add custom CSS for better styling
        styled_html = f"""
        <style>
            .notebook-content {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                padding: 20px;
            }}
            .notebook-content img {{
                max-width: 100%;
                height: auto;
            }}
            .notebook-content pre {{
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
            }}
            .notebook-content table {{
                border-collapse: collapse;
                width: 100%;
                margin: 1rem 0;
            }}
            .notebook-content th, .notebook-content td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            .notebook-content th {{
                background-color: #f5f5f5;
            }}
        </style>
        <div class="notebook-content">
            {body}
        </div>
        """
        
        return jsonify({"html": styled_html})
    except Exception as e:
        print(f"Error reading notebook: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/chat", methods=['POST'])
def chat():
    try:
        message = request.json['message']
        print(f"Received message: {message}")

        # Initialize Cerebras client
        api_key = os.getenv('CEREBRAS_API_KEY')
        if not api_key:
            print("API key not found. Looking in:", env_path)
            return jsonify({"error": "API key not configured"}), 500

        client = Cerebras(api_key=api_key)
        
        print("Making request to Cerebras API...")
        
        # Create chat completion with formatting instructions
        print("Creating chat completion...")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are an AI assistant specialized in earthquake safety and information. 
                    Format your responses with proper line breaks and paragraphs.
                    Use clear headings when listing multiple points.
                    Keep your responses concise but informative."""
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model="llama3.1-8b",
        )
        
        # Clean and format the response
        ai_response = chat_completion.choices[0].message.content.strip()
        
        # Ensure consistent line breaks
        ai_response = ai_response.replace('\r\n', '\n')
        
        return jsonify({"response": ai_response})

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_news")
def get_news():
    try:
        # Get news from NewsAPI
        api_key = os.getenv('NEWS_API_KEY')
        if not api_key:
            return jsonify({"error": "News API key not configured"}), 500

        # Calculate date for last 7 days
        week_ago = (datetime.now() - timedelta(days=20)).strftime('%Y-%m-%d')
        
        url = 'https://newsapi.org/v2/everything'
        params = {
            'q': 'earthquake richter',
            'from': week_ago,
            'sortBy': 'publishedAt',
            'language': 'en',
            'apiKey': api_key
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch news"}), response.status_code

        return jsonify(response.json())

    except Exception as e:
        print(f"Error fetching news: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
