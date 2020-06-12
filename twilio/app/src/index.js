import Video from 'twilio-video';
import { demo } from '../../es6/videoapidemo';

// load css
// eslint-disable-next-line sort-imports
import '../../es6/index.css';

window.Twilio = {
  Video
};
demo(Video);

