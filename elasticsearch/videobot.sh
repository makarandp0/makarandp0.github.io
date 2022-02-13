echo ==================================================
echo this command establishes mapping between videobot host\'s port with localhost
echo make sure that you are connected to oncall VPN before calling this.
echo this will start ssh session, and you can use another terminal to execute commands against
echo localhost:29200
echo
videobot() {
    owl ssh --prod \
    -L 29200:localhost:29200 \
    -L 19690:localhost:19690 \
    -L 19098:localhost:19098 \
    -L 19580:localhost:19580 \
    -L 9096:localhost:9096  \
    video-slackbot-service
}