import React from 'react';
import {observer} from 'mobx-react';
import { format } from 'd3-format';
import { select } from 'd3-selection';
import { scalePoint } from 'd3-scale';

import './SynsetGraph.css';

const SynsetGraph = observer(
	class SynsetGraph extends React.Component {

		root = null

		links = null

		nodes = null

		posRegex = /\.\w{1,3}$/gi

		scoreFormatter = format(".3f")

		componentDidMount() {
			if (this.props.store.selectedEdge[0] && this.props.store.selectedEdge[1])
				this.renderGraph();
		}

		componentDidUpdate() {
			if (this.props.store.selectedEdge[0] && this.props.store.selectedEdge[1])
				this.renderGraph();
		}

		getRenderingData(height, width, margin) {
			const {store} = this.props;
			const data = store.selectionGraph;
			
			const x =
				scalePoint()
					.domain(['frm1LU', 'synset', 'frm2LU'])
					.range([0, width])
					.padding(.3)

			const yLU1 = scalePoint()
				.domain(data.nodes
					.filter(d => d.type === 'frm1LU')
					.sort((a, b) => b.outDegree - a.outDegree)
					.map(d => d.name))
				.range([margin*2, height-(margin*2)]);

			const yLU2 = scalePoint()
				.domain(data.nodes
						.filter(d => d.type === 'frm2LU')
						.sort((a,b) => b.outDegree - a.outDegree)
						.map(d => d.name))
				.range([margin*2, height-(margin*2)]);

			const ySyn = scalePoint()
				.domain(data.nodes
					.filter(d => d.type === 'synset')
					.sort((a, b) => b.inDegree - a.inDegree)
					.map(d => d.name))
				.range([margin, height-margin]);

			const frm1LUX = x('frm1LU');
			const frm2LUX = x('frm2LU');
			const synsetX = x('synset');

			data.nodes.forEach(d => {
				if (d.type === 'frm1LU') {
					d.x = frm1LUX;
					d.y = yLU1(d.name);
				} else if (d.type === 'frm2LU') {
					d.x = frm2LUX;
					d.y = yLU2(d.name);
				} else {
					d.x = synsetX;
					d.y = ySyn(d.name);
				}
			})

			return {
				nodes: data.nodes,
				links: data.links
			}
		}

		lemmaHtml(lemma, isHighlighted) {
			if(isHighlighted)
				return `<span class="synset-lemma highlighted">${lemma}</span>`;
			else
				return `<span class="synset-lemma">${lemma}</span>`;
		}

		onMouseOverSynset(datum) {
			const {store} = this.props;
			const lemmas = store.lemmasBySynset[datum.name];
			const language = store.language;
			const highlighted = new Set();

			this.links.each(d => {
				if (d.target === datum) {
					highlighted.add(d.source.name.replace(this.posRegex, ''))
				}
			});

			select("#synset-eng-lemmas")
				.html(lemmas["eng"].map(l => this.lemmaHtml(l, highlighted.has(l))).join(", "))

			select("#synset-l2-title").html(`${language}:`)
			select("#synset-l2-lemmas")
				.html(lemmas[language].map(l => this.lemmaHtml(l, highlighted.has(l))).join(", "))

			select("#synset-tooltip")
				.style("top", `${datum.y+datum.height/2}px`)
				.style("left", `${datum.x+12}px`)
				.style("display", "block")
		}

		onMouseOverNode(datum) {
			const linked = new Set();

			this.links
				.filter(d => d.source === datum || d.target === datum)
				.each(d => {
					linked.add(d.source);
					linked.add(d.target);
				})
				.attr("opacity", 1);

			this.nodes
				.filter(d => linked.has(d))
				.style("font-weight", "bold")
				.attr("opacity", 1);

			if (datum.type === 'synset')
				this.onMouseOverSynset(datum);
		}

		onMouseOutNode() {
			this.links.attr("opacity", 0.1);
			this.nodes
				.style("font-weight", "normal")
				.attr("opacity", 0.75);

			select("#synset-tooltip").style("display", "none");
		}

		computePath(datum) {
			let coef;
			let x1 = datum.source.x;
			let y1 = datum.source.y - (datum.source.height/4);
			let x2 = datum.target.x;
			let y2 = datum.target.y - (datum.target.height/4);

			if (datum.source.type === 'frm1LU') {
				x1 += datum.source.width + 8;
				x2 -= 12;
				coef = 1;
			} else {
				x1 -= 8;
				x2 += datum.target.width + 16;
				coef = -1;
			}

			const offset = 15;
			const ccoef = (Math.abs(x1 - x2)-2*offset)/2.5;

			return `
				M ${x1}            ${y1}
				L ${x1 + 3*coef}   ${y1}
				C ${x1+ccoef*coef} ${y1}, ${x2-ccoef*coef} ${y2}, ${x2+offset*-coef} ${y2}
				L ${x2}            ${y2}
			`;
		}

		renderGraph() {
			const height = window.innerHeight-10;
			const width = 960;
			const margin = 60;

			const data = this.getRenderingData(height, width, margin);
			const svg = select(this.root).select("svg");

			svg
				.attr("height", height)
				.attr("width", width);

			this.nodes = svg.select("#nodes")
				.selectAll("text")
				.data(data.nodes)
				.join("text")
					.text(d => d.name)
					.each(function(d) {
						const bbox = this.getBBox();
						d.width = bbox.width;
						d.height = bbox.height + 2;
					})
					.attr("x", d => d.x)
					.attr("y", d => d.y)
					.attr("class", d => d.type === 'synset' && d.isMatchingNode ? "synset-node match " : "synset-node")
					.attr("opacity", 0.75)
					.on("mouseover", d => this.onMouseOverNode(d))
					.on("mouseout", d => this.onMouseOutNode(d))

			this.links = svg.select("#links")
				.selectAll("path")
				.data(data.links)
				.join("path")
					.attr("d", this.computePath)
					.attr("marker-end", "url(#arrowhead)")
					.attr("stroke", "#555")
					.attr("fill-opacity", 0)
					.attr("opacity", 0.1)

			const synsets = data.nodes.filter(d => d.type === 'synset')
			const matching = synsets.filter(d => d.isMatchingNode)

			if (data.nodes.length > 0) {
				svg.select("#stats")
					.attr("x", width)
					.attr("y", height-margin/2)
					.attr("class", "synset-graph-score")
					.html(`
						Alignment score:
						<tspan class="synset-matches">${matching.length}</tspan>
						÷ ${synsets.length}
						= ${this.scoreFormatter(matching.length/synsets.length)}`)
			}
		}

		render() {
			const {store} = this.props;

			return (
				<div id="synset-graph-container" ref={node => this.root = node}>
					<div id="synset-tooltip">
						<div className="synset-lang-title">eng:</div>
						<div id="synset-eng-lemmas"></div>
						<div className="synset-lang-title" id="synset-l2-title" />
						<div id="synset-l2-lemmas"></div>
					</div>
					{
						(store.selectedEdge[0] && store.selectedEdge[1])
						?
							<svg>
								<defs>
									<marker id="arrowhead" markerWidth="10" markerHeight="7" 
										refX="0" refY="3.5" orient="auto">
										<polygon points="0 0, 10 3.5, 0 7" fill="#555" />
									</marker>
								</defs>
								<g id="nodes" />
								<g id="links" />
								<text id="stats" />
							</svg>
						: <h3 className="no-data-text">No data to show.</h3>
					}
				</div>
			);
		}
	}
)

export default SynsetGraph;