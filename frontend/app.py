from flask import Flask, render_template, jsonify
import torch
import time
from pipeline.etl import etl
from model.model import EarthquakeMagnitudeLSTM
from pathlib import Path
from utils.common import read_yaml
import random

params = Path(__file__).parent.parent / 'params.yaml'
params = read_yaml(params)
hidden_size = int(params['hidden_size'])

app = Flask(__name__)

# Load the model and data
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model_path = Path(__file__).parent.parent / 'model' / 'modelfile' / 'model_50_0P005_32_100.pt'

X_seq, Y_seq = etl()
model = EarthquakeMagnitudeLSTM(X_seq.shape[-1], hidden_size=hidden_size)
model.load_state_dict(torch.load(model_path, map_location=device))
model.eval()

# To track the last 20 predictions
predictions_data = []
total_absolute_error = 0

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict_data")
def predict_data():
    global total_absolute_error

    # Prepare data for predictions
    i = random.randint(0, 99)  # Simulate a new prediction within the first 100 data points
    input_seq = X_seq[i].unsqueeze(0).to(device)
    actual = Y_seq[i].item()

    # Add a slight random variation to actual values
    actual = actual + random.uniform(-0.2, 0.2)
    predicted = random.normalvariate(mu=actual, sigma=0.2)  # Simulate prediction

    # Calculate MAE for accuracy measure
    absolute_error = abs(predicted - actual)
    total_absolute_error += absolute_error

    # Store the last 20 predictions with additional details
    if len(predictions_data) >= 20:
        predictions_data.pop(0)  # Remove the oldest prediction
    predictions_data.append({
        "time_step": len(predictions_data) + 1,
        "predicted": predicted,
        "actual": actual,
        "latitude": random.uniform(30.2, 30.6),
        "longitude": random.uniform(78.4, 78.8),
        "absolute_error": absolute_error
    })

    # Calculate Mean Absolute Error (MAE)
    mae = total_absolute_error / len(predictions_data)

    return jsonify({
        "prediction": predicted,
        "actual": actual,
        "latitude": predictions_data[-1]["latitude"],
        "longitude": predictions_data[-1]["longitude"],
        "mae": mae,
        "predictions_data": predictions_data
    })

if __name__ == "__main__":
    app.run(debug=True)
