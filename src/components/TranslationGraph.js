import React from 'react';
import {observer} from 'mobx-react';
import {format} from 'd3-format';
import {select} from 'd3-selection';
import {scalePoint} from 'd3-scale';

import './TranslationGraph.css';

const TranslationGraph = observer(
	class TranslationGraph extends React.Component {

		root = null

		links = null

		nodes = null

		height = null
		
		width = null

		margin = null

		scoreFormatter = format(".3f")

		componentDidMount() {
			this.renderGraph();
		}

		componentDidUpdate() {
			this.renderGraph();
		}

		getRenderingData() {
			const {store} = this.props;
			const data = store.graphData;
			
			const x =
				scalePoint()
					.domain(['frm1LU', 'intermediate', 'frm2LU'])
					.range([0, this.width])
					.padding(.3)

			const yLU1 = scalePoint()
				.domain(data.nodes
					.filter(d => d.type === 'frm1LU')
					.sort((a, b) => b.outDegree - a.outDegree)
					.map(d => d.name))
				.range([this.margin*2, this.height-(this.margin*2)]);

			const yLU2 = scalePoint()
				.domain(data.nodes
						.filter(d => d.type === 'frm2LU')
						.sort((a,b) => b.outDegree - a.outDegree)
						.map(d => d.name))
				.range([this.margin*2, this.height-(this.margin*2)]);

			const yInter = scalePoint()
				.domain(data.nodes
					.filter(d => d.type === 'intermediate')
					.sort((a, b) => b.inDegree - a.inDegree)
					.map(d => d.name))
				.range([this.margin, this.height-this.margin]);

			const frm1LUX = x('frm1LU');
			const frm2LUX = x('frm2LU');
			const interX = x('intermediate');

			data.nodes.forEach(d => {
				if (d.type === 'frm1LU') {
					d.x = frm1LUX;
					d.y = yLU1(d.name);
				} else if (d.type === 'frm2LU') {
					d.x = frm2LUX;
					d.y = yLU2(d.name);
				} else {
					d.x = interX;
					d.y = yInter(d.name);
				}
			})

			return {
				nodes: data.nodes,
				links: data.links
			}
		}

		computePath(datum) {
			let coef;
			let x1 = datum.source.x;
			let y1 = datum.source.y - (datum.source.height/4);
			let x2 = datum.target.x;
			let y2 = datum.target.y - (datum.target.height/4);

			if (datum.source.type === 'frm1LU' || datum.source.type === 'intermediate') {
				x1 += datum.source.width + 12;
				x2 -= 12;
				coef = 1;
			} else {
				x1 -= 12;
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

		includeFooter(data) {
			const svg = select(this.root).select("svg");
			const matching = data.nodes.filter(d => d.isMatchingNode).length;
			const reference = data.nodes.filter(d => d.isReferenceNode && !d.isMatchingNode).length;

			svg.select("#title")
				.attr("x", this.margin)
				.attr("y", this.height-this.margin/2)
				.attr("class", "graph-info")
				.text(`Frames: ${this.props.store.selectedEdge[0]}, ${this.props.store.selectedEdge[1]}`)

			svg.select("#stats")
				.attr("x", this.width)
				.attr("y", this.height-this.margin/2)
				.attr("class", "graph-info graph-score")
				.html(`
					Alignment score:
					<tspan class="match">${matching}</tspan>
					÷
					(
					<tspan class="match">${matching}</tspan>
					+
					<tspan class="reference">${reference}</tspan>
					)
					= ${this.scoreFormatter(matching/(matching + reference))}`)
		}


		renderGraph() {
			this.height = window.innerHeight-10;
			this.width = 960;
			this.margin = 60;

			const data = this.getRenderingData();
			const svg = select(this.root).select("svg");

			svg
				.attr("height", this.height)
				.attr("width", this.width);

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
					.attr("class", d => {
						let name = "node";
						if (d.isMatchingNode) {
							name += " match";
						} else if (d.isReferenceNode) {
							name += " ref";
						}
						return name;
					})
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

			this.includeFooter(data);
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

			this.nodes.filter(d => linked.has(d))
				.style("font-weight", "bold")
				.attr("opacity", 1);

			if (this.props.onMouseOverNode)
				this.props.onMouseOverNode(datum, this.nodes, this.links);
		}

		onMouseOutNode() {
			this.links.attr("opacity", 0.1);
			this.nodes
				.style("font-weight", "normal")
				.attr("opacity", 0.75);

			select("#synset-tooltip").style("display", "none");

			if (this.props.onMouseOutNode)
				this.props.onMouseOutNode();
		}

		render() {
			const {store} = this.props;

			return (
				<div ref={node => this.root = node}>
					{
						store.graphData.nodes.length > 0
						?
							<svg>
								<defs>
									<marker id="arrowhead"
										markerWidth="10" markerHeight="7" 
										refX="0" refY="3.5" orient="auto">
										<polygon points="0 0, 10 3.5, 0 7" fill="#555" />
									</marker>
								</defs>
								<g id="nodes" />
								<g id="links" />
								<text id="title" />
								<text id="stats" />
							</svg>
						: <h3 className="no-data-text">No data to show.</h3>
					}
				</div>
			);
		}

	}
);

export default TranslationGraph;