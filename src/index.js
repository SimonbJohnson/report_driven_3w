import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import Report3w from './report.jsx';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Report3w configURL="config.json" />,document.getElementById('root'));
registerServiceWorker();
