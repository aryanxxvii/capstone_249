import torch
import torch.nn as nn
import torch.nn.functional as F

class EarthquakeMagnitudeLSTM(nn.Module):
    def __init__(self, input_size, hidden_size=64, num_layers=3):
        super(EarthquakeMagnitudeLSTM, self).__init__()
        
        self.lstm = nn.LSTM(input_size, hidden_size, 
                            num_layers=num_layers, 
                            batch_first=True, 
                            bidirectional=True, 
                            dropout=0.3)
        
        self.multihead_attn = nn.MultiheadAttention(
            embed_dim=hidden_size*2, 
            num_heads=4, 
            dropout=0.2
        )
        
        self.feature_extractor = nn.Sequential(
            nn.Linear(hidden_size*2, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        self.magnitude_predictor = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        
        attn_output, _ = self.multihead_attn(
            lstm_out, lstm_out, lstm_out
        )
        
        features = torch.mean(attn_output, dim=1)
        
        extracted_features = self.feature_extractor(features)
        
        magnitude = self.magnitude_predictor(extracted_features)
        
        return magnitude