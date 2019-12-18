import React from 'react';
import {observer} from 'mobx-react';
import {select} from 'd3-selection';

import './SynsetGraph.css';
import TranslationGraph from './TranslationGraph';

const SynsetGraph = observer(
	class SynsetGraph extends React.Component {

		posRegex = /\.\w{1,4}$/gi

		lemmaHtml(lemma, isHighlighted) {
			if(isHighlighted)
				return `<span class="synset-lemma highlighted">${lemma}</span>`;
			else
				return `<span class="synset-lemma">${lemma}</span>`;
		}

		onMouseOverNode = (datum, nodes, links) => {
			if (datum.type !== 'intermediate')
				return;

			const {store} = this.props;
			const synset = store.synsetData[datum.name];
			const language = store.language;
			const highlighted = new Set();

			links.each(d => {
				if (d.target === datum) {
					highlighted.add(d.source.name.replace(this.posRegex, ''))
				}
			});

			select("#synset-name").html(datum.name);

			select("#synset-desc").html(synset.definition);

			select("#synset-eng-lemmas")
				.html(synset["en"].map(l => this.lemmaHtml(l, highlighted.has(l))).join(", "))

			select("#synset-l2-title").html(`${language}:`)
			select("#synset-l2-lemmas")
				.html(synset[language].map(l => this.lemmaHtml(l, highlighted.has(l))).join(", "))

			const tooltip = select("#synset-tooltip");
			tooltip.style("display", "block");
			const bbox = tooltip.node().getBoundingClientRect();
			let top = datum.y + datum.height/2;

			if (datum.y + bbox.height > window.innerHeight) {
				top = datum.y - datum.height - bbox.height;
			} else {
				top = datum.y + datum.height/2;
			}

			tooltip
				.style("top", `${top}px`)
				.style("left", `${datum.x+12}px`)
		}

		onMouseOutNode() {
			select("#synset-tooltip").style("display", "none");
		}

		render() {
			const {store} = this.props;

			return (
				<div ref={node => this.root = node}>
					<div id="synset-graph-content">
						<div id="synset-tooltip">
							<div className="synset-lang-title large" id="synset-name"></div>
							<div id="synset-desc"></div>
							<div className="synset-lang-title">eng:</div>
							<div id="synset-eng-lemmas"></div>
							<div className="synset-lang-title" id="synset-l2-title" />
							<div id="synset-l2-lemmas"></div>
						</div>
						<TranslationGraph
							store={store}
							onMouseOverNode={this.onMouseOverNode}
							onMouseOutNode={this.onMouseOutNode}
						/>
					</div>
				</div>
			);
		}
	}
)

export default SynsetGraph;