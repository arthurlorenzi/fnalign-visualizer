import { computed, decorate, observable } from 'mobx';

class AlignmentStore {

	raw = []

	selected = []

	threshold = 0.1

	get data() {
		const selectedSet = new Set(this.selected.map(x => x.id));
 
		return this.raw.filter(x => (selectedSet.has(x[0]) || selectedSet.has(x[1])) && x[2] >= this.threshold);
	}

	get frames() {
		return [
			...new Set(
				this.raw.map(x => x[0])
					.concat(this.raw.map(x => x[1]))
			)
		].sort().map(x => ({
			id: x,
			label: x, 
		}));
	}

}

decorate(AlignmentStore, {
	raw: observable,
	selected: observable,
	threshold: observable,
	data: computed,
	frames: computed,
})

export default AlignmentStore;