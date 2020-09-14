import Video from 'twilio-video';
import { loadVideoAndDemo } from '../../es6/loadVideoAndDemo';

// load css
// eslint-disable-next-line sort-imports
import '../../es6/index.css';
console.log('loaded twilio/app/src/app.js');
loadVideoAndDemo(Video, document.body);

