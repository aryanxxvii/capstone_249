import torch
from utils.common import read_yaml
from pathlib import Path

params = Path(__file__).parent.parent / 'params.yaml'
params = read_yaml(params)

mag_loss_beta = float(params['mag_loss_beta'])

def magnitude_aware_loss(prediction, target, beta=mag_loss_beta):
    mse = (prediction - target) ** 2
    
    weight = 1 + beta * target
    total_loss = weight * mse
    
    return torch.mean(total_loss)
