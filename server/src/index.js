require('dotenv').config(); const mongoose=require('mongoose'); const app=require('./app');
const port = Number(process.env.PORT) || 4000;

if (!process.env.MONGODB_URI) {
	console.error('MONGODB_URI is required before starting the API.');
	process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
	.then(() => {
		app.listen(port, () => console.log(`Hype API listening on port ${port}`));
	})
	.catch((error) => {
		console.error('MongoDB connection failed:', error.message);
		process.exit(1);
	});
