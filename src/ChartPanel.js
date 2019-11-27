import React from 'react';
import {observer} from 'mobx-react';
import Sankey from './components/Sankey';
import SynsetGraph from './components/SynsetGraph';

export default observer(props => {
	const {store} = props;

	if (store.selectedEdge[0] && store.selectedEdge[1]) {
		return <SynsetGraph store={store} />
	} else {
		return <Sankey store={store}/>
	}
})