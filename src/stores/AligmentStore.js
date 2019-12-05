import { action, computed, decorate, observable } from 'mobx';

class AlignmentStore {

	fndb

	language

	alignments = []

	indices = []

	LUsByFrame = {}

	synsetsByLU = {}

	synsetData = {}

	scoring = null

	sankeyFrames = []

	selectedEdge = [null, null]

	threshold = 0.1

	get data() {
		const alignment = this.alignments.find(x => x.type === this.scoring);

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

	get scoringOptions() {
		return this.alignments.map(x => ({
			value: x.type,
			label: x.desc,
		}));
	}

	get graphData() {
		return this.scoring === 'lu_wordnet'
			? this.LUWordNetGraph()
			: this.synsetGraph();
	}

	LUWordNetGraph() {
		const nodes = this.getLUNodes();
		const objs = this.getSynsetObjects(nodes);
		const links = objs.links.filter(l => l.target.frm1LU);

		nodes.push(...objs.nodes.filter(n => n.frm1LU));
		links.forEach(l => {
			let swap;
			if (l.source.type === 'frm2LU') {
				swap = l.source;
				l.source = l.target;
				l.target = swap;
			}
		})
		nodes.forEach(n => n.isReferenceNode = n.type === 'frm1LU');
		links.forEach(l => {
			if (l.source.type === 'frm1LU' && l.target.isIntersection) {
				l.source.isMatchingNode = true;
			}
		});
		this.computeDegrees(links);

		return { nodes, links };
	}

	synsetGraph() {
		const nodes = this.getLUNodes();
		const objs = this.getSynsetObjects(nodes);
		const links = objs.links;

		nodes.push(...objs.nodes);
		const isReferenceFn =
			this.scoring === 'synset'
				? n => n.frm1LU
				: n => n.frm2LU;
		nodes.forEach(n => {
			n.isReferenceNode = isReferenceFn(n);
			n.isMatchingNode = n.isIntersection;
		})
		this.computeDegrees(links);

		return { nodes, links };
	}

	createNode = x => ({ name: x, inDegree: 0, outDegree: 0, });

	getLUNodes() {
		return (
			this.LUsByFrame[this.selectedEdge[0]] || []).map(x => ({ type: 'frm1LU', ...this.createNode(x) })
		).concat(
			(this.LUsByFrame[this.selectedEdge[1]] || []).map(x => ({ type: 'frm2LU', ...this.createNode(x) }))
		);
	}

	getSynsetObjects(LUNodes) {
		// LU -> Synset links
		const links = LUNodes
			.map(n =>
				(this.synsetsByLU[n.name] || [])
					.map(synset => ({
						source: n,
						target: synset,
					}))
			)
			.flat();
		// Synset nodes
		const synsetMap = {}
		const nodes = [...new Set(links.map(l => l.target))]
				.map(s => {
					const synset = { type: 'synset', ...this.createNode(s) };
					synsetMap[s] = synset;
					return synset;
				});
		// Including references to objects in links
		links.forEach(l => {
			l.target = synsetMap[l.target];
			l.target[l.source.type] = true;
		});
		nodes.forEach(n => n.isIntersection = n.frm1LU && n.frm2LU);

		return { nodes, links };
	}

	computeDegrees(links) {
		links.forEach(l => {
			++l.source.outDegree;
			++l.target.inDegree;
		});
	}

	get selectionGraph() {
		const factory = x => ({ name: x, inDegree: 0, outDegree: 0, });

		// LU nodes
		const nodes = 
			(this.LUsByFrame[this.selectedEdge[0]] || []).map(x => ({ type: 'frm1LU', ...factory(x) }))
			.concat(
			(this.LUsByFrame[this.selectedEdge[1]] || []).map(x => ({ type: 'frm2LU', ...factory(x) })));
		// LU/synset links
		let links = nodes
			.map(n =>
				(this.synsetsByLU[n.name] || [])
					.map(synset => ({
						source: n,
						target: synset,
					}))
			)
			.flat();
		// Synset nodes
		const synsetMap = {}
		nodes.push(
			...[...new Set(links.map(l => l.target))]
				.map(s => {
					const synset = { type: 'synset', ...factory(s) };
					synsetMap[s] = synset;
					return synset;
				})
		)

		// Updating references on links
		links.forEach(l => l.target = synsetMap[l.target]);
		// Looking for synset inteserctions
		links.forEach(l => l.target[l.source.type] = true);

		if (this.scoring === "lu_wordnet") {
			links = links.filter(l => l.target.frm1LU);
		}
		
		// Identifying reference nodes
		nodes.forEach(n => this.setReferenceNode(n));
		// Update degrees
		links.forEach(l => {
			++l.source.outDegree;
			++l.target.inDegree;
		})

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

			return { type: a.type, desc: a.desc, edges: edges }
		});

		this.indices = data.indices;
		this.LUsByFrame = data.lus;
		this.synsetsByLU = data.resources.lu_to_syn;
		this.synsetData = data.resources.syn_data;

		// Resets
		this.sankeyFrames = [];
		this.selectedEdge = [null, null];
	})

	setReferenceNode(n) {
		switch(this.scoring) {
			case "synset":
				n.isReferenceNode = n.frm1LU;
				n.isMatchingNode = n.frm1LU && n.frm2LU;
				break;
			case "synset_inv":
				n.isReferenceNode = n.frm2LU;
				n.isMatchingNode = n.frm1LU && n.frm2LU;
				break;
			case "lu_wordnet":
				n.isReferenceNode = n.type === "frm1LU";
				break;
			default:
				n.isReferenceNode = n.isMatchingNode = true;
		}
	}

}

decorate(AlignmentStore, {
	fndb: observable,
	language: observable,
	alignments: observable,
	indices: observable,
	LUsByFrame: observable,
	synsetsByLU: observable,
	synsetData: observable,
	scoring: observable,
	sankeyFrames: observable,
	selectedEdge: observable,
	threshold: observable,
	data: computed,
	frames: computed,
	scoringOptions: computed,
	selectionGraph: computed,
});

export default AlignmentStore;