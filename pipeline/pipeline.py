from pipeline.etl import etl
from pipeline.train import train
from pipeline.test import test
import torch
from pathlib import Path

def run_pipeline(mode):
    X_seq, Y_seq = etl()

    if mode == 'train':        
        train(X_seq, Y_seq)

    elif mode == 'test':
        test(X_seq, Y_seq)
