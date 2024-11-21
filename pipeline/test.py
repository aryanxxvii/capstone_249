import torch
import numpy as np
from torch.utils.data import DataLoader
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from model.model import EarthquakeMagnitudeLSTM
import json
from utils.common import read_yaml
from utils.magloss import magnitude_aware_loss


def test(X_seq, Y_seq, test_ratio=0.3):
    params = Path(__file__).parent.parent / 'params.yaml'
    params = read_yaml(params)  

    n_epochs = int(params['n_epochs'])
    lr = float(params['lr'])
    lr_str = str(lr).replace('.', 'P')
    batch_size = int(params['batch_size'])
    window_size = int(params['window_size'])
    hidden_size = int(params['hidden_size'])

    model_path = Path(__file__).parent.parent / 'model' / 'modelfile' / f'model_{n_epochs}_{lr_str}_{batch_size}_{window_size}.pt'
    print(model_path)
    results_dir = Path(__file__).parent.parent / 'results' / f'model_{n_epochs}_{lr_str}_{batch_size}_{window_size}'
    results_dir.mkdir(parents=True, exist_ok=True)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    test_size = int(len(X_seq) * test_ratio)
    X_test = X_seq[-test_size:]
    Y_test = Y_seq[-test_size:]
    
    model = EarthquakeMagnitudeLSTM(X_seq.shape[-1], hidden_size=hidden_size)
    model.load_state_dict(torch.load(model_path, weights_only=True))
    model.to(device)
    model.eval()
    
    test_dataset = torch.utils.data.TensorDataset(X_test, Y_test)
    test_dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    all_predictions = []
    all_true_labels = []
    
    with torch.no_grad():
        for batch_features, batch_labels in test_dataloader:
            batch_features, batch_labels = batch_features.to(device), batch_labels.to(device)
            
            predictions = model(batch_features).squeeze()
            
            all_predictions.extend(predictions.cpu().numpy())
            all_true_labels.extend(batch_labels.cpu().numpy())
    
    # Convert to numpy arrays
    predictions = np.array(all_predictions)
    true_labels = np.array(all_true_labels)
    
    # Compute metrics
    metrics = {
        'Mean Absolute Error': mean_absolute_error(true_labels, predictions),
        'Mean Squared Error': mean_squared_error(true_labels, predictions),
        'Root Mean Squared Error': np.sqrt(mean_squared_error(true_labels, predictions)),
        'Magnitude-Aware Loss': magnitude_aware_loss(torch.tensor(predictions), torch.tensor(true_labels))
    }
    
    print("Model Performance Metrics:")
    for metric, value in metrics.items():
        print(f"{metric}: {value:.4f}")
    
    with open(results_dir / 'model_metrics.json', 'w') as f:
        json.dump({k: float(v) for k, v in metrics.items()}, f, indent=4)

    high_mag_rows = true_labels > 6.5
    high_mag_predictions = predictions[high_mag_rows]
    high_mag_true_labels = true_labels[high_mag_rows]

    high_mag_metrics = {
        'Mean Absolute Error': mean_absolute_error(high_mag_true_labels, high_mag_predictions),
        'Mean Squared Error': mean_squared_error(high_mag_true_labels, high_mag_predictions),
        'Root Mean Squared Error': np.sqrt(mean_squared_error(high_mag_true_labels, high_mag_predictions)),
        'Magnitude-Aware Loss': magnitude_aware_loss(torch.tensor(high_mag_predictions), torch.tensor(high_mag_true_labels))
    }

    print("\n\nHigh Magnitude Model Performance Metrics:")
    for metric, value in high_mag_metrics.items():
        print(f"{metric}: {value:.4f}")

    with open(results_dir / 'high_mag_model_metrics.json', 'w') as f:
        json.dump({k: float(v) for k, v in high_mag_metrics.items()}, f, indent=4)

    return metrics
