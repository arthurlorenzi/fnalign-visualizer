import { action, computed, decorate, observable } from 'mobx';

const DEFAULT_PARAMS = {
	attr_matching: {
		threshold: 0,
		sankeyFrameSet: [],
		displayOnlyFrameSet: true,
		sankeyMaxEdges: null,
		limitSankeyEdges: false,
	},
	lu_wordnet: {
		threshold: 0.4,
		sankeyFrameSet: [],
		displayOnlyFrameSet: false,
		sankeyMaxEdges: null,
		limitSankeyEdges: false,
	},
	synset: {
		threshold: 0.1,
		sankeyFrameSet: [],
		displayOnlyFrameSet: false,
		sankeyMaxEdges: null,
		limitSankeyEdges: false,
	},
	synset_inv: {
		threshold: 0.1,
		sankeyFrameSet: [],
		displayOnlyFrameSet: false,
		sankeyMaxEdges: null,
		limitSankeyEdges: false,
	},
	lu_muse: {
		threshold: 0.75,
		sankeyFrameSet: [],
		displayOnlyFrameSet: false,
		sankeyMaxEdges: 5,
		limitSankeyEdges: true,
	},
	lu_mean_muse: {
		threshold: 0.85,
		sankeyFrameSet: [],
		displayOnlyFrameSet: false,
		sankeyMaxEdges: 5,
		limitSankeyEdges: true,
	}
};

class AlignmentStore {

	fndb

	language

	edges = {}

	indices = []

	frames = {}

	framesByName = {}

	synsetsByLU = {}

	synsetData = {}

	vectorsByLU = []

	vectorsId2Word = []

	constructor(uiState) {
		this.uiState = uiState;
	}

	get sankeyData() {
		const state = this.uiState;
		const {scoring} = state;
		
		if (scoring) {
			const {params} = scoring;
			const frameSet = new Set(state.sankeyFrames.map(x => x.id));
			const filterFn = params.displayOnlyFrameSet
				? x => frameSet.has(x[0]) && frameSet.has(x[1]) && x[2] >= params.threshold
				: x => (frameSet.has(x[0]) || frameSet.has(x[1])) && x[2] >= params.threshold;
			const filtered = this.edges[scoring.id].filter(filterFn);

			return this.pruneEdges(filtered)
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
				label: this.frames[x].name + '.' + this.frames[x].language,
				disabled: this.frames[x].LUs.length === 0,
			}))
			.sort((a , b) => (a.label < b.label) ? -1 : (a.label > b.label) ? 1 : 0);
	}

	get graphData() {
		const {scoring} = this.uiState;
		
		if (!scoring)
			return { nodes: [], links: [] };

		switch(scoring.type) {
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
		const type = this.uiState.scoring.type;
		const nodes = this.getLUNodes();
		const inter = this.getConnectionObjects(nodes, this.synsetsByLU);
		const links = inter.links;

		nodes.push(...inter.nodes);
		const isReferenceFn = type === 'synset' ? n => n.frm1LU : n => n.frm2LU;
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
		const {selectedEdge} = this.uiState;

		if (selectedEdge[0] && selectedEdge[1]) {
			return this.frames[selectedEdge[0]].LUs
				.map(x => ({ type: 'frm1LU', ...this.createNode(x) }))
				.concat(
					this.frames[selectedEdge[1]].LUs
					.map(x => ({ type: 'frm2LU', ...this.createNode(x) }))
				);
		} else {
			return [];
		}
	}

	getConnectionObjects(LUNodes, relationMap, nameFn=x=>x) {
		const {params} = this.uiState.scoring;

		const links = LUNodes
			.map(s =>
				(relationMap[s.name] || [])
					.slice(0, params.K)
					.filter(t => !Array.isArray(t) || t[0] > params.threshold)
					.map(t => ({
						source: s,
						target: Array.isArray(t) ? t[1] : t,
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

	pruneEdges(edges) {
		const {params} = this.uiState.scoring;

		if (!params.limitSankeyEdges)
			return edges;

		edges.sort((a, b) => {
			if (a[0] > b[0]) {
				return -1;
			} else if (a[0] < b[0]) {
				return 1;
			} else {
				return a[2] > b[2] ? -1 : a[2] < b[2] ? 1 : 0;
			}
		});

		const counts = {};

		edges.forEach(x => counts[x[0]] = 0);

		return edges.filter(x => {
			++counts[x[0]];
			return counts[x[0]] <= params.sankeyMaxEdges;
		});
	}

	load = action(data => {
		this.fndb = data.db[1];
		this.language = data.lang[1];

		this.edges = {}
		data.alignments.forEach(x => {
			const edges = [];
			x.data.forEach((row, i) => {
				row.forEach((value, j) => {
					if (value > 0)
						edges.push([data.indices[0][i], data.indices[1][j], value])
				});
			});
			this.edges[x.id] = edges;
		});

		this.framesByName = {};
		for (let key in data.frames) {
			if (Object.prototype.hasOwnProperty.call(data.frames, key)) {
				let frame = data.frames[key];
				this.framesByName[frame.name + '.' + frame.language] = frame;
			}
		}

		this.uiState.scoringOptions =
			data.alignments.map(x => ({
				id: x.id,
				desc: x.desc,
				type: x.type,
				params: DEFAULT_PARAMS[x.type]
			}));

		this.indices = data.indices;
		this.frames = data.frames;
		this.synsetsByLU = data.resources.lu_to_syn;
		this.synsetData = data.resources.syn_data;
		this.vectorsByLU = data.resources.lu_vec_nn;
		this.vectorsId2Word = data.resources.id2word;

		// Resets
		this.uiState.selectedEdge = [null, null];
		this.uiState.scoring = null;
		this.uiState.sankeyFrames = [];
	})

}

decorate(AlignmentStore, {
	fndb: observable,
	language: observable,
	indices: observable,
	frames: observable,
	synsetsByLU: observable,
	synsetData: observable,
	vectorsByLU: observable,
	vectorsId2Word: observable,
	sankeyData: computed,
	frameOptions: computed,
});

export default AlignmentStore;