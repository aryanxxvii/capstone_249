import torch
import torch.nn as nn

class EarthquakeMagnitudeLSTM(nn.Module):
    def __init__(self, input_size, hidden_size=128):
        super(EarthquakeMagnitudeLSTM, self).__init__()
        
        self.first_lstm_layers = nn.ModuleList([
            nn.LSTM(
                input_size if i == 0 else hidden_size * 2, 
                hidden_size, 
                batch_first=True, 
                bidirectional=True
            ) for i in range(3)
        ])
        
        self.first_attention = nn.MultiheadAttention(
            embed_dim=hidden_size * 2, 
            num_heads=4, 
            dropout=0.2,
            batch_first=True
        )
        
        self.second_lstm_layers = nn.ModuleList([
            nn.LSTM(
                hidden_size * 2, 
                hidden_size, 
                batch_first=True, 
                bidirectional=True
            ) for _ in range(3)
        ])
        
        self.second_attention = nn.MultiheadAttention(
            embed_dim=hidden_size * 2, 
            num_heads=4, 
            dropout=0.2,
            batch_first=True
        )
        
        self.magnitude_predictor = nn.Sequential(
            nn.Linear(hidden_size * 2, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 1)
        )
        
    def forward(self, x):
        for lstm_layer in self.first_lstm_layers:
            x, _ = lstm_layer(x)
        
        x, _ = self.first_attention(x, x, x)
        
        for lstm_layer in self.second_lstm_layers:
            x, _ = lstm_layer(x)
        
        x, _ = self.second_attention(x, x, x)
        
        pooled_features = torch.mean(x, dim=1)
        
        magnitude = self.magnitude_predictor(pooled_features)
        
        return magnitude
    