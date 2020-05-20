import Video from 'twilio-video';
import { demo } from '../../es6/videoapidemo';
window.Twilio = {
  Video
};
demo(Video);

