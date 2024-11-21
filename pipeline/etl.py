import os
import torch
import numpy as np
import pandas as pd
from pathlib import Path
from utils.common import *
from utils.preprocess import preprocess
from sklearn.preprocessing import StandardScaler

def pd_to_torch(root_path):
    df_base = pd.read_csv(root_path / 'database.csv')
    df_base = preprocess(df_base)

    df_features = df_base.drop('Magnitude', axis=1)
    df_labels = df_base['Magnitude']

    np_features = df_features.to_numpy()
    np_labels = df_labels.to_numpy()

    scaler = StandardScaler()
    np_features_scaled = scaler.fit_transform(np_features)

    tensor_features = torch.tensor(np_features_scaled, dtype=torch.float32)
    tensor_labels = torch.tensor(np_labels, dtype=torch.float32)

    return tensor_features, tensor_labels


def make_seq(features, labels, window_size):
    X, y = [], []
    for i in range(len(features) - window_size + 1):
        X.append(features[i:i+window_size])
        y.append(labels[i+window_size-1])
    
    return torch.stack(X), torch.stack(y)


def etl():
    config = Path(__file__).parent.parent / 'config.yaml'
    params = Path(__file__).parent.parent / 'params.yaml'
    config = read_yaml(config)
    params = read_yaml(params)
    data_root_path = Path(__file__).parent.parent / config['dataset_root']
    window_size = int(params['window_size'])
    if 'sequence_data.pt' in os.listdir(data_root_path):
        loaded_data = torch.load(data_root_path / 'sequence_data.pt', weights_only=False)
        X_seq = loaded_data['X_seq']
        y_seq = loaded_data['y_seq']
        return X_seq, y_seq

    tensor_features, tensor_labels = pd_to_torch(data_root_path)

    X_seq, y_seq = make_seq(tensor_features, tensor_labels, window_size=window_size)

    torch.save({
        'X_seq': X_seq,
        'y_seq': y_seq
    }, data_root_path / 'sequence_data.pt')

    print("Data saved to sequence_data.pt")

    return X_seq, y_seq
