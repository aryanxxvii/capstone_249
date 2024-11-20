import pandas as pd
import numpy as np
from geopy.distance import geodesic
from sklearn.cluster import KMeans

def calculate_distance(current_lat, current_lon, prev_lat, prev_lon):
    if pd.isnull(prev_lat) or pd.isnull(prev_lon):
        return 0
    return geodesic((current_lat, current_lon), (prev_lat, prev_lon)).km


def preprocess(data):
    data = data[['Date', 'Time', 'Latitude', 'Longitude', 'Magnitude']]
    data.loc[:, 'Timestamp'] = pd.to_datetime(data['Date'] + ' ' + data['Time'], format="%m/%d/%Y %H:%M:%S", errors='coerce')
    data = data[data['Timestamp'] >= pd.Timestamp('1970-01-01')]

    data.reset_index(drop=True, inplace=True)
    data = data.drop(['Date', 'Time'], axis=1)

    data['Time_Delta'] = data['Timestamp'].diff().dt.total_seconds()    
    data = data.fillna(0)
    data['Year'] = data['Timestamp'].dt.year
    data['Month'] = data['Timestamp'].dt.month
    data['Day'] = data['Timestamp'].dt.day
    data['Weekday'] = data['Timestamp'].dt.weekday
    data['Hour'] = data['Timestamp'].dt.hour

    data['Hour'] = data['Timestamp'].dt.hour
    data['Hour_Sin'] = np.sin(2 * np.pi * data['Hour'] / 24)
    data['Hour_Cos'] = np.cos(2 * np.pi * data['Hour'] / 24)

    data['DayOfYear'] = data['Timestamp'].dt.dayofyear
    data['DayOfYear_Sin'] = np.sin(2 * np.pi * data['DayOfYear'] / 365)
    data['DayOfYear_Cos'] = np.cos(2 * np.pi * data['DayOfYear'] / 365)

    data['Month_Sin'] = np.sin(2 * np.pi * data['Month'] / 12)
    data['Month_Cos'] = np.cos(2 * np.pi * data['Month'] / 12)

    data['Day_Sin'] = np.sin(2 * np.pi * data['Day'] / 31)
    data['Day_Cos'] = np.cos(2 * np.pi * data['Day'] / 31)
    
    data['Prev_Latitude'] = data['Latitude'].shift(1)
    data['Prev_Longitude'] = data['Longitude'].shift(1)
    
    data['Geodesic_Distance'] = data.apply(
        lambda row: calculate_distance(row['Latitude'], row['Longitude'], 
                                       row['Prev_Latitude'], row['Prev_Longitude']), 
        axis=1
    )
    
    data = data.drop(columns=['Prev_Latitude', 'Prev_Longitude'])
 
    kmeans = KMeans(n_clusters=10, random_state=42)
    data['Region_Cluster'] = kmeans.fit_predict(data[['Latitude', 'Longitude']])

    data['Time_Delta_Lag1'] = data['Time_Delta'].shift(1)
    data.fillna(0, inplace=True)

    data['Region_Time'] = data['Region_Cluster'] * data['Time_Delta']

    data['Cumulative_Quakes'] = np.arange(1, len(data) + 1)

    data.drop('Timestamp', axis=1, inplace=True)

    return data