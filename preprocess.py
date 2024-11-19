import pandas as pd
import numpy as np
from geopy.distance import geodesic
from sklearn.cluster import KMeans

def calculate_distance(current_lat, current_lon, prev_lat, prev_lon):
    # Check if any value is missing (e.g., for the first row)
    if pd.isnull(prev_lat) or pd.isnull(prev_lon):
        return 0  # No distance for the first row
    # Calculate geodesic distance
    return geodesic((current_lat, current_lon), (prev_lat, prev_lon)).km


def preprocess(data):
    data = data[['Date', 'Time', 'Latitude', 'Longitude', 'Depth', 'Magnitude']]
    data['Timestamp'] = pd.to_datetime(data['Date'] + ' ' + data['Time'], format="%m/%d/%Y %H:%M:%S", errors='coerce')
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


    
    # Create shifted columns for previous latitude and longitude
    data['Prev_Latitude'] = data['Latitude'].shift(1)
    data['Prev_Longitude'] = data['Longitude'].shift(1)
    
    # Compute geodesic distance using the fixed function
    data['Geodesic_Distance'] = data.apply(
        lambda row: calculate_distance(row['Latitude'], row['Longitude'], 
                                       row['Prev_Latitude'], row['Prev_Longitude']), 
        axis=1
    )
    
    # Drop temporary columns if needed
    data = data.drop(columns=['Prev_Latitude', 'Prev_Longitude'])
 
    kmeans = KMeans(n_clusters=10, random_state=42)
    data['Region_Cluster'] = kmeans.fit_predict(data[['Latitude', 'Longitude']])

    data['Cumulative_Magnitude'] = data['Magnitude'].rolling(window=5).sum()
    data['Avg_Magnitude'] = data['Magnitude'].rolling(window=5).mean()

    global_avg_magnitude = data['Magnitude'].mean()
    data['Deviation_From_Avg'] = data['Magnitude'] - global_avg_magnitude

    data['Magnitude_Lag1'] = data['Magnitude'].shift(1)
    data['Time_Delta_Lag1'] = data['Time_Delta'].shift(1)

    data['Magnitude_Depth'] = data['Magnitude'] * data['Depth']
    data['Region_Time'] = data['Region_Cluster'] * data['Time_Delta']

    data['Rolling_Magnitude_Month'] = data['Magnitude'].rolling(window=30).mean()
    data['Year_Count'] = data.groupby('Year')['Magnitude'].transform('count')

    data['Yearly_Avg_Magnitude'] = data.groupby('Year')['Magnitude'].transform('mean')
    data['Cumulative_Quakes'] = np.arange(1, len(data) + 1)  # Simple cumulative count
    data['Magnitude_Year'] = data['Year'] * data['Magnitude']
    data['Depth_Month'] = data['Depth'] * data['Month']

 
    return data