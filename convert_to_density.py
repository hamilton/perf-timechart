import json
from collections import Counter
from math import floor

BIN_SIZE = 1000 # in miliseconds.

data = json.loads(open('data_10min_converted2.json', 'r').read())

new_data = []

def fill_in_blanks(data):
	new_data = []
	old_time = None
	new_time = None
	for (i,d,) in enumerate(data):
		new_time  = d[0]
		new_count = d[1]
		if i > 0:
			if new_time - old_time > BIN_SIZE:
				while old_time < new_time:
					old_time += BIN_SIZE
					new_data.append([old_time, 0])
			new_data.append([new_time, new_count])
		old_time = new_time
	return new_data


for process in data:
	new_process = {}
	new_process['y']    = process['y']
	new_process['id']   = process['id']
	new_process['name'] = process['name']

	samples_by_cpu = {}
	all_samples = Counter()

	other_events = []

	other_events = []
	for sample in process['samples']:
		time = sample[0]
		cpu  = sample[2]
		if sample[2] >= 0:

			time = floor(time / float(BIN_SIZE)) * BIN_SIZE

			if cpu not in samples_by_cpu: samples_by_cpu[cpu] = Counter()
			samples_by_cpu[cpu][time] += 1
			all_samples[time] += 1
		elif sample[2] == -1:
			other_events.append(sample)
	new_process['all_cpu_events']     = fill_in_blanks(sorted(all_samples.items()))
	new_process['cpu_events_by_core'] = dict([(cpu, fill_in_blanks(sorted(samples_by_cpu[cpu].items()))) for cpu in samples_by_cpu])
	new_process['io'] = other_events
	if len(new_process['all_cpu_events']) == 0 and len(new_process['io']) == 0:
		pass
	else:
		new_data.append(new_process)

f = open('area_data.json', 'w')
f.write(json.dumps(new_data))
	
