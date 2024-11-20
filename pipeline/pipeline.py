def run_pipeline(mode):
    if mode == 'train':
        from pipeline.train import train
        train()
    elif mode == 'test':
        from pipeline.test import test
        test()
    elif mode == 'inference':
        from pipeline.inference import inference
        inference()