import { computed, decorate, observable } from 'mobx';

class AlignmentStore {

	raw = []

	sankeyFrames = []

	selectedAlignment = [null, null]

	threshold = 0.1

	get data() {
		const frameSet = new Set(this.sankeyFrames.map(x => x.id));
		return this.raw.filter(x => (frameSet.has(x[0]) || frameSet.has(x[1])) && x[2] >= this.threshold).sort();
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
	sankeyFrames: observable,
	selectedAlignment: observable,
	threshold: observable,
	data: computed,
	frames: computed,
})

export default AlignmentStore;