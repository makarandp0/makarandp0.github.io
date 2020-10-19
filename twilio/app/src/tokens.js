/* eslint-disable no-console */
import Video from 'twilio-video';
import { demo } from '../../es6/tokens.js';

// load css
// eslint-disable-next-line sort-imports
import '../../es6/index.css';
console.log('loaded tokens.js');
demo(Video, document.body);

