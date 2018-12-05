import glob
import os
import pandas as pd
import matplotlib.pyplot as plt

directories = []
final_dataframes = []
for directory in directories:
    csv_filepaths = glob.glob(os.path.join(directory, "*.csv"))
    final_data = pd.read_csv(csv_filepaths[0])
    for filepath in csv_filepaths[1:]:
        run_data = pd.read_csv(filepath)
        final_data['average_proportion_of_track_completed'] += run_data['average_proportion_of_track_completed']

    final_data['average_proportion_of_track_completed'] = final_data['average_proportion_of_track_completed'] / len(csv_filepaths)
    final_dataframes.append(final_data)

plt.rcParams.update({'font.size': 22})
for final_data in final_dataframes:
    plt.plot(final_data['generation'], final_data['average_proportion_of_track_completed'])
plt.legend(("Flat Difficulty", "Curved Difficulty"), loc="upper left")
plt.title("Average Portion of the Track Completed with Different Track Designs")
plt.xlabel("Generation")
plt.ylabel("Average Proportion Completed")
plt.show()