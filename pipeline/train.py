import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from model.model import EarthquakeMagnitudeLSTM
from utils.common import read_yaml
from pathlib import Path
from pipeline.etl import etl
import numpy as np

params = Path(__file__).parent.parent / 'params.yaml'
params = read_yaml(params)

n_epochs = int(params['n_epochs'])
lr = float(params['lr'])
batch_size = int(params['batch_size'])

X_seq, Y_seq = etl()

def magnitude_aware_loss(prediction, target, max_magnitude=10.0):
    """
    Dynamic loss function that penalizes magnitude misclassifications exponentially
    """
    magnitude_diff = torch.abs(prediction - target)
    
    penalty = torch.exp(magnitude_diff) - 1
    
    magnitude_scaling = torch.abs(target) + 1
    
    total_loss = magnitude_diff * penalty * torch.log(magnitude_scaling)
    
    return torch.mean(total_loss)

def train():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    model = EarthquakeMagnitudeLSTM(X_seq.shape[2])
    model.to(device)
    criterion = magnitude_aware_loss
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=5)
    
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1)

    dataset = torch.utils.data.TensorDataset(X_seq, Y_seq)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    print("Data Statistics:")
    print(f"X_seq mean: {X_seq.mean()}, std: {X_seq.std()}")
    print(f"Y_seq mean: {Y_seq.mean()}, std: {Y_seq.std()}")

    model.train()
    for epoch in range(n_epochs):
        total_loss = 0.0
        all_predictions = []
        all_true_labels = []
        
        for batch_features, batch_labels in dataloader:
            batch_features, batch_labels = batch_features.to(device), batch_labels.to(device)
            
            optimizer.zero_grad()
            predictions = model(batch_features)
            
            loss = criterion(predictions.squeeze(), batch_labels)
            loss.backward()
            
            optimizer.step()
            
            total_loss += loss.item()
            
            all_predictions.extend(predictions.cpu().detach().numpy())
            all_true_labels.extend(batch_labels.cpu().numpy())
        
        avg_loss = total_loss / len(dataloader)
        avg_prediction = np.mean(all_predictions)
        avg_true_label = np.mean(all_true_labels)
        
        scheduler.step(avg_loss)
        
        print(f"Epoch [{epoch+1}/{n_epochs}]:")
        print(f"  Loss: {avg_loss:.4f}")
        print(f"  Avg Prediction: {avg_prediction:.4f}")
        print(f"  Avg True Label: {avg_true_label:.4f}")
        print(f"  Current LR: {optimizer.param_groups[0]['lr']}")

    return model


if __name__ == "__main__":
    trained_model = train()