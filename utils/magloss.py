import torch

def magnitude_aware_loss(prediction, target, beta=0.5):
    """
    Weighted MSE with higher emphasis on stronger magnitudes.
    
    Args:
        prediction: Predicted values (torch.Tensor).
        target: Ground truth values (torch.Tensor).
        beta: Scaling factor for weights (float).
    
    Returns:
        torch.Tensor: Computed loss.
    """
    mse = (prediction - target) ** 2
    
    # Add weights proportional to magnitude
    weight = 1 + beta * target  # Scales weights linearly with magnitude
    total_loss = weight * mse
    
    return torch.mean(total_loss)
