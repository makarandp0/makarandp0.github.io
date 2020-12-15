/* eslint-disable no-console */
import { demo } from './videoapidemo.js';
const defaultSDKVersion = '2.10.0';

export function loadVideoAndDemo(Video, containerDiv) {
  const urlParams = new URLSearchParams(window.location.search);
  let sdkVersion = urlParams.get('sdkVersion');
  if (sdkVersion || !Video) {
    sdkVersion = sdkVersion || defaultSDKVersion;
    const newScript = document.createElement('script');
    newScript.onerror = oError => {
      throw new URIError('The script ' + oError.target.src + ' didn\'t load correctly.');
    };
    newScript.onload = () => {
      console.log('makarand: Twilio.Video.version ', window.Twilio.Video.version);
      demo(window.Twilio.Video, containerDiv);
    };
    const videoUrl = `//stage.twiliocdn.com/sdk/js/video/releases/${sdkVersion}/twilio-video.js`;
    newScript.src = videoUrl;
    document.head.appendChild(newScript);
  } else {
    window.Twilio = { Video };
    demo(window.Twilio.Video, containerDiv);
  }
}
