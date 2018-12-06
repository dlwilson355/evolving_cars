import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import glob

dfs_curved = []
for file in glob.glob('curved_difficulty_track/*'):
    dfs_curved += [pd.read_csv(file)]
    
dfs_flat = []
for file in glob.glob('flat_difficulty_track/*'):
    dfs_flat += [pd.read_csv(file)]

df_curved = pd.concat(dfs_curved)
df_flat = pd.concat(dfs_flat)

def get_stat(df, num=50):
    ds = df['track_length'] - df['average_distance']
    ds = ds[ds > 0]

    return ds.sort_values().iloc[:num].values

tmp_df = pd.DataFrame(data=np.array([get_stat(df_flat), get_stat(df_curved)]).T, columns=['fixed', 'curved'])

plt.rcParams['font.size'] = 15
plt.figure(figsize=(10, 8))
tmp_df.boxplot()
plt.title('Distributions of track length and the best fitness differences for 30 runs')
plt.savefig('boxplot.pdf', bbox_inches='tight')
plt.show()

