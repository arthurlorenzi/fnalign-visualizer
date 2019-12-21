import { action, computed, decorate, observable } from 'mobx';

class AlignmentStore {

	fndb

	language

	alignments = []

	indices = []

	frames = {}

	framesByName = {}

	synsetsByLU = {}

	synsetData = {}

	alignment = null

	sankeyFrames = []

	selectedEdge = [null, null]

	threshold = 0.1

	vectorsByLU = []

	vectorsId2Word = []

	get sankeyData() {
		if (this.alignment) {
			const {edges} = this.alignment;
			console.log(edges);
			const frameSet = new Set(this.sankeyFrames.map(x => x.id));

			return edges
				.filter(x => (frameSet.has(x[0]) || frameSet.has(x[1])) && x[2] >= this.threshold)
				.map(x => [
					this.frames[x[0]].name + '.' + this.frames[x[0]].language,
					this.frames[x[1]].name + '.' + this.frames[x[1]].language,
					x[2],
				]);
		} else {
			return [];
		}
	}

	get frameOptions() {
		return this.indices
			.flat()
			.map(x => ({
				id: x,
				label: this.frames[x].name + '.' + this.frames[x].language
			}))
			.sort((a , b) => (a.label < b.label) ? -1 : (a.label > b.label) ? 1 : 0);
	}

	get scoringOptions() {
		return this.alignments.map(x => ({
			value: x.id,
			label: x.desc,
		}));
	}

	get graphData() {
		if (!this.alignment)
			return { nodes: [], links: [] };

		switch(this.alignment.type) {
			case 'lu_wordnet':
				return this.LUWordNetGraph();
			case 'synset':
			case 'synset_inv':
				return this.synsetGraph();
			case 'lu_muse':
				return this.LUMuseGraph();
			default:
				return { nodes: [], links: [] };
		}
	}

	LUWordNetGraph() {
		const nodes = this.getLUNodes();
		const inter = this.getConnectionObjects(nodes, this.synsetsByLU);
		const links = inter.links.filter(l => l.target.frm1LU);

		nodes.push(...inter.nodes.filter(n => n.frm1LU));
		links.filter(l => l.source.type === 'frm2LU').forEach(l => {
			let swap = l.source;
			l.source = l.target;
			l.target = swap;
		})
		nodes.forEach(n => n.isReferenceNode = n.type === 'frm1LU');
		links
			.filter(l => (l.source.type === 'frm1LU' && l.target.isIntersection))
			.forEach(l => {
				l.source.isMatchingNode = true;
			});
		this.computeDegrees(links);

		return { nodes, links };
	}

	synsetGraph() {
		const nodes = this.getLUNodes();
		const inter = this.getConnectionObjects(nodes, this.synsetsByLU);
		const links = inter.links;

		nodes.push(...inter.nodes);
		const isReferenceFn =
			this.alignment.type === 'synset'
				? n => n.frm1LU
				: n => n.frm2LU;
		nodes.forEach(n => {
			n.isReferenceNode = isReferenceFn(n);
			n.isMatchingNode = n.isIntersection;
		})
		this.computeDegrees(links);

		return { nodes, links };
	}

	LUMuseGraph() {
		const nodes = this.getLUNodes();
		const inter = this.getConnectionObjects(nodes, this.vectorsByLU, x => this.vectorsId2Word[x]);
		const links = inter.links.filter(l => l.target.frm1LU);

		nodes.push(...inter.nodes.filter(n => n.frm1LU));
		links.filter(l => l.source.type === 'frm2LU').forEach(l => {
			let swap = l.source;
			l.source = l.target;
			l.target = swap;
		})
		nodes.forEach(n => n.isReferenceNode = n.type === 'frm1LU');
		links
			.filter(l => (l.source.type === 'frm1LU' && l.target.isIntersection))
			.forEach(l => {
				l.source.isMatchingNode = true;
			});
		this.computeDegrees(links);

		return { nodes, links };
	}

	createNode = x => ({ name: x, inDegree: 0, outDegree: 0, });

	getLUNodes() {
		if (this.selectedEdge[0] && this.selectedEdge[1]) {
			return this.frames[this.selectedEdge[0]].LUs
				.map(x => ({ type: 'frm1LU', ...this.createNode(x) }))
				.concat(
					this.frames[this.selectedEdge[1]].LUs
					.map(x => ({ type: 'frm2LU', ...this.createNode(x) }))
				);
		} else {
			return [];
		}
	}

	getConnectionObjects(LUNodes, relationMap, nameFn=x=>x) {
		const links = LUNodes
			.map(s =>
				(relationMap[s.name] || [])
					.slice(0, this.alignment.K)
					.filter(t => t[0] > this.alignment.threshold)
					.map(t => ({
						source: s,
						target: t[1],
					}))
			)
			.flat();
		// Creating node objects for intermediate Nodes
		const intermediateMap = {}
		const nodes = [...new Set(links.map(l => l.target))]
				.map(t => {
					const node = {
						type: 'intermediate',
						...this.createNode(nameFn(t))
					};
					intermediateMap[t] = node;
					return node;
				});
		// Including references to objects in links
		links.forEach(l => {
			l.target = intermediateMap[l.target];
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

			const copy = { ...a };
			copy.edges = edges;
			delete copy.data;

			return copy;
		});

		this.framesByName = {};
		for (let key in data.frames) {
			if (Object.prototype.hasOwnProperty.call(data.frames, key)) {
				let frame = data.frames[key];
				this.framesByName[frame.name + '.' + frame.language] = frame;
			}
		}

		this.indices = data.indices;
		this.frames = data.frames;
		this.synsetsByLU = data.resources.lu_to_syn;
		this.synsetData = data.resources.syn_data;
		this.vectorsByLU = data.resources.lu_vec_nn;
		this.vectorsId2Word = data.resources.id2word;

		// Resets
		this.sankeyFrames = [];
		this.selectedEdge = [null, null];
	})

	selectAlignment = action(id => {
		this.alignment = this.alignments.find(x => x.id === id);
	})

	selectEdge = action((source, target) => {
		this.selectedEdge[0] = this.framesByName[source].gid;
		this.selectedEdge[1] = this.framesByName[target].gid;
	})

}

decorate(AlignmentStore, {
	fndb: observable,
	language: observable,
	alignments: observable,
	indices: observable,
	frames: observable,
	synsetsByLU: observable,
	synsetData: observable,
	alignment: observable,
	sankeyFrames: observable,
	selectedEdge: observable,
	threshold: observable,
	vectorsByLU: observable,
	vectorsId2Word: observable,
	sankeyData: computed,
	frameOptions: computed,
	scoringOptions: computed,
});

export default AlignmentStore;