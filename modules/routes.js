module.exports = function (app) {
    app.get('/', (req, res) => {
        res.status(200).send("Video Call Server by Nikhil Kadyan")
    });
}