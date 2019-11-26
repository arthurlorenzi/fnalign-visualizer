import { action, computed, decorate, observable } from 'mobx';

class AlignmentStore {

	alignments = []

	indices = []

	alignmentIndex = 0

	sankeyFrames = []

	selectedEdge = [null, null]

	threshold = 0.1

	get data() {
		const alignment = this.alignments[this.alignmentIndex]

		if (alignment) {
			const {edges} = alignment;
			const frameSet = new Set(this.sankeyFrames.map(x => x.id));

			return edges.filter(x => (frameSet.has(x[0]) || frameSet.has(x[1])) && x[2] >= this.threshold);
		} else {
			return [];
		}
	}

	get frames() {
		return this.indices
			.flat()
			.sort()
			.map(x => ({
				id: x,
				label: x
			}));
	}

	load = action(data => {
		this.indices = data.indices;

		this.alignments = data.alignments.map(a => {
			const edges = [];

			a.data.forEach((row, i) => {
				row.forEach((value, j) => {
					if (value > 0)
						edges.push([this.indices[0][i], this.indices[1][j], value])
				});
			});

			return { type: a.type, edges: edges }
		});
	})

}

decorate(AlignmentStore, {
	alignments: observable,
	alignmentIndex: observable,
	indices: observable,
	sankeyFrames: observable,
	selectedEdge: observable,
	threshold: observable,
	data: computed,
	frames: computed,
})

export default AlignmentStore;