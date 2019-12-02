import { action, computed, decorate, observable } from 'mobx';

class AlignmentStore {

	fndb

	language

	alignments = []

	indices = []

	LUsByFrame = {}

	synsetsByLU = {}

	lemmasBySynset = {}

	alignmentIndex = 0

	sankeyFrames = []

	showDetails = false

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

	get selectionGraph() {
		const factory = x => ({ name: x, inDegree: 0, outDegree: 0, });

		// LUs
		const nodes = 
			(this.LUsByFrame[this.selectedEdge[0]] || []).map(x => ({ type: 'frm1LU', ...factory(x) }))
			.concat(
			(this.LUsByFrame[this.selectedEdge[1]] || []).map(x => ({ type: 'frm2LU', ...factory(x) })));

		// LU -> synset links
		const links = nodes
			.map(n =>
				(this.synsetsByLU[n.name] || [])
					.map(synset => ({
						source: n,
						target: synset,
					}))
			)
			.flat();

		// Synsets
		const synsetMap = {}
		nodes.push(
			...[...new Set(links.map(l => l.target))]
				.map(s => {
					const synset = { type: 'synset', ...factory(s) };
					synsetMap[s] = synset;
					return synset;
				})
		)

		links.forEach(l => {
			// Link update to include synset object reference
			l.target = synsetMap[l.target];
			// Update degrees
			++l.source.outDegree;
			++l.target.inDegree;
			// Check for matching synsets
			l.target[l.source.type] = true;
		});

		nodes.forEach(n => {
			if (n.frm1LU && n.frm2LU) {
				n.isMatchingNode = true;
			}
			delete n.frm1LU;
			delete n.frm2LU;
		});

		return { nodes, links };
	}

	load = action(data => {
		this.fndb = data.db[1];
		this.language = data.lang[1];

		this.alignments = data.alignments.map(a => {
			const edges = [];

			a.data.forEach((row, i) => {
				row.forEach((value, j) => {
					if (value > 0)
						edges.push([data.indices[0][i], data.indices[1][j], value])
				});
			});

			return { type: a.type, edges: edges }
		});

		this.indices = data.indices;
		this.LUsByFrame = data.lus;
		this.synsetsByLU = data.resources.lu_to_syn;
		this.lemmasBySynset = data.resources.syn_to_lemma;
	})

}

decorate(AlignmentStore, {
	fndb: observable,
	language: observable,
	alignments: observable,
	indices: observable,
	LUsByFrame: observable,
	synsetsByLU: observable,
	lemmasBySynset: observable,
	alignmentIndex: observable,
	sankeyFrames: observable,
	showDetails: observable,
	selectedEdge: observable,
	threshold: observable,
	data: computed,
	frames: computed,
	selectionGraph: computed,
});

export default AlignmentStore;