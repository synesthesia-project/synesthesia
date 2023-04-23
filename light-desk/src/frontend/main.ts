import * as ReactDOM from 'react-dom';

import {rootComponent} from './components/stage';
import {initialiseListeners} from './util/touch';

initialiseListeners();

ReactDOM.render(
  rootComponent(),
  document.getElementById('root')
);
